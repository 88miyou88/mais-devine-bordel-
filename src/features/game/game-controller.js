import { DIFFICULTY_LABELS } from "../../config/config.js";
import {
  el,
  releaseWakeLock,
  requestGameDisplay,
  requestWakeLock,
  showScreen,
  vibrateForResult
} from "../../core/dom.js";
import { state } from "../../core/state.js";
import { shuffle } from "../../core/utils.js";
import { removeCardDuringGame } from "../../services/card-removals.js";
import {
  getBoxName,
  getPlayableCards,
  modeConfig,
  selectedCardsForMode
} from "../../services/libraries.js";
import {
  buildBalancedDrawQueue,
  startMixedDrawingBreak,
  stopDrawingRound
} from "../drawing/drawing-controller.js";
import {
  closeUnplayableMixedDrawings,
  createMixedDrawingPlan,
  getFeasibleMixedDrawingCount,
  isMixedDrawingDue,
  markMixedDrawingCompleted,
  markMixedDrawingStarted
} from "../drawing/mixed-drawing.js";
import { renderGameResults } from "./results.js";
import { animateCardExit, initializeSwipe, resetCardPosition } from "./swipe.js";
import {
  getRequestedSeconds,
  initializeDurationControls,
  pauseRoundClock,
  renderTime,
  resumeRoundClock,
  runCountdown,
  startTimerLoop,
  stopTimers,
  togglePauseState
} from "./timer.js";

let onReplay = null;
let onHome = null;
let preparedMixedDrawingCount = null;
let roundOptions = null;
let sequenceCursor = 0;
let modeQueues = new Map();

function isMultiplayerRound() {
  return roundOptions?.multiplayer === true;
}

function selectedModeOrder() {
  const configured = Array.isArray(roundOptions?.modeOrder) && roundOptions.modeOrder.length
    ? roundOptions.modeOrder
    : state.settings.selectedModeIds;
  return [...new Set(configured)];
}

function classicModeIds() {
  return selectedModeOrder().filter(modeId => modeId !== "draw");
}

function classicCards() {
  if (!isMultiplayerRound()) return getPlayableCards({ excludeModeIds: ["draw"] });
  return classicModeIds().flatMap(modeId => selectedCardsForMode(modeId));
}

function refillQueue() {
  const next = shuffle(classicCards());
  if (state.currentCard && next.length > 1) {
    const firstSame = next[0].modeId === state.currentCard.modeId && next[0].id === state.currentCard.id;
    if (firstSame) [next[0], next[1]] = [next[1], next[0]];
  }
  state.queue.push(...next);
}

function usedIdsForMode(modeId) {
  if (!roundOptions?.usedCardIdsByMode) return null;
  roundOptions.usedCardIdsByMode[modeId] ||= [];
  return roundOptions.usedCardIdsByMode[modeId];
}

function refillModeQueue(modeId) {
  const cards = selectedCardsForMode(modeId);
  if (!cards.length) {
    modeQueues.set(modeId, []);
    return;
  }
  const usedIds = usedIdsForMode(modeId);
  let available = usedIds ? cards.filter(card => !usedIds.includes(card.id)) : cards;
  if (!available.length) {
    if (usedIds) usedIds.splice(0, usedIds.length);
    available = cards;
  }
  const queue = shuffle(available);
  if (state.currentCard && queue.length > 1 && queue[0].id === state.currentCard.id) {
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  modeQueues.set(modeId, queue);
}

function takeCardForMode(modeId) {
  if (!modeQueues.get(modeId)?.length) refillModeQueue(modeId);
  const card = modeQueues.get(modeId)?.shift();
  if (!card) return null;
  const usedIds = usedIdsForMode(modeId);
  if (usedIds && !usedIds.includes(card.id)) usedIds.push(card.id);
  return card;
}

function sameCard(first, second) {
  return Boolean(first && second && first.modeId === second.modeId && first.id === second.id);
}

function prepareNextFreeCard() {
  if (state.queue.length === 0) refillQueue();
  return state.queue[0] || null;
}

function restorePreparedCardAfterUndo(entry) {
  const preparedCard = entry?._nextCard || null;
  if (!preparedCard) return;

  if (!isMultiplayerRound()) {
    if (!state.queue.some(card => sameCard(card, preparedCard))) {
      state.queue.unshift(preparedCard);
    }
    return;
  }

  const queue = modeQueues.get(preparedCard.modeId) || [];
  if (!queue.some(card => sameCard(card, preparedCard))) {
    modeQueues.set(preparedCard.modeId, [preparedCard, ...queue]);
  }

  const usedIds = usedIdsForMode(preparedCard.modeId);
  const usedIndex = usedIds?.lastIndexOf(preparedCard.id) ?? -1;
  if (usedIndex >= 0) usedIds.splice(usedIndex, 1);
}

function drawNextCard() {
  if (state.queue.length === 0) refillQueue();
  if (state.queue.length === 0) {
    finishGame("empty");
    return;
  }
  state.currentCard = state.queue.shift();
  renderGameCard();
}

function renderGameCard() {
  const card = state.currentCard;
  if (!card) return;
  const config = modeConfig(card.modeId);
  el.gameCard.style.setProperty("--mode-color", config.color);
  el.gameModeLabel.textContent = config.gameLabel;
  el.lyricsGameContent.classList.toggle("hidden", config.type !== "lyrics");
  el.mimeGameContent.classList.toggle("hidden", config.type !== "mime");
  el.wordsGameContent.classList.toggle("hidden", config.type !== "words");
  el.gameCard.classList.remove("forbidden-hidden");

  if (config.type === "lyrics") {
    el.lyricsContextText.textContent = card.context || "";
    el.lyricsContextText.classList.toggle("hidden", !String(card.context || "").trim());
    el.promptText.textContent = card.prompt;
    el.answerText.textContent = card.answer;
    el.cardMetaPrimary.textContent = card.title;
    el.cardMetaSecondary.textContent = `${card.source} · ${DIFFICULTY_LABELS[card.difficulty]}`;
  } else if (config.type === "words") {
    el.wordPromptText.textContent = card.prompt;
    el.forbiddenWordsList.innerHTML = "";
    (card.forbiddenWords || []).forEach(word => {
      const chip = document.createElement("span");
      chip.className = "forbidden-word";
      chip.textContent = word;
      el.forbiddenWordsList.append(chip);
    });
    const showForbidden = state.settings.modeOptions.words.showForbiddenWords;
    el.gameCard.classList.toggle("forbidden-hidden", !showForbidden);
    el.cardMetaPrimary.textContent = getBoxName(card.modeId, card.boxId);
    el.cardMetaSecondary.textContent = DIFFICULTY_LABELS[card.difficulty];
  } else {
    el.mimePromptText.textContent = card.prompt;
    el.cardMetaPrimary.textContent = getBoxName(card.modeId, card.boxId);
    el.cardMetaSecondary.textContent = DIFFICULTY_LABELS[card.difficulty];
  }

  resetCardPosition();
  requestAnimationFrame(fitCardContent);
}

function fitCardContent() {
  el.gameCard.classList.remove("card-medium", "card-compact", "card-tiny");
  const card = state.currentCard;
  if (!card) return;
  const config = modeConfig(card.modeId);
  let length = card.prompt.length;
  if (config.type === "lyrics") length += card.answer.length + String(card.context || "").length * 0.65;
  if (config.type === "words" && state.settings.modeOptions.words.showForbiddenWords) {
    length += (card.forbiddenWords || []).join(" ").length * 0.55;
  }
  if (length > 58) el.gameCard.classList.add("card-medium");
  if (length > 88) {
    el.gameCard.classList.remove("card-medium");
    el.gameCard.classList.add("card-compact");
  }
  if (length > 125) {
    el.gameCard.classList.remove("card-medium", "card-compact");
    el.gameCard.classList.add("card-tiny");
  }
  requestAnimationFrame(() => {
    if (el.gameCard.scrollHeight > el.gameCard.clientHeight + 2) {
      el.gameCard.classList.remove("card-medium", "card-compact");
      el.gameCard.classList.add("card-tiny");
    }
  });
}

function buildDrawQueue(drawCards, wanted) {
  const usedIds = usedIdsForMode("draw");
  let available = usedIds ? drawCards.filter(card => !usedIds.includes(card.id)) : drawCards;
  if (available.length < wanted) {
    if (usedIds) usedIds.splice(0, usedIds.length);
    available = drawCards;
  }
  return buildBalancedDrawQueue(available, wanted);
}

function createMixedDrawingState() {
  const modes = selectedModeOrder();
  const drawSelected = modes.includes("draw");
  if (!drawSelected || modes.length < 2) return null;
  const drawCards = selectedCardsForMode("draw");
  if (!drawCards.length) return null;
  const wanted = preparedMixedDrawingCount ?? Math.min(state.settings.modeOptions.draw.mixedCount, drawCards.length);
  preparedMixedDrawingCount = null;
  return {
    ...createMixedDrawingPlan(state.durationMs, wanted),
    queue: buildDrawQueue(drawCards, wanted),
    found: 0,
    passed: 0,
    expired: 0,
    points: 0,
    totalPenaltyMs: 0
  };
}

function liveRemainingMs() {
  if (state.paused) return state.remainingMs;
  return Math.max(0, state.deadline - performance.now());
}

function nextSequenceStep() {
  const order = selectedModeOrder();
  if (!order.length) return null;
  const maxChecks = Math.max(4, order.length * 3);
  for (let guard = 0; guard < maxChecks; guard += 1) {
    const modeId = order[sequenceCursor % order.length];
    sequenceCursor += 1;
    if (modeId === "draw") {
      const plan = state.mixedDrawing;
      if (!plan || plan.active || plan.nextIndex >= plan.requestedCount) continue;
      const remaining = liveRemainingMs();
      state.remainingMs = remaining;
      if (remaining <= plan.minimumRemainingMs) {
        closeUnplayableMixedDrawings(plan, remaining);
        continue;
      }
      return { type: "draw" };
    }
    const card = takeCardForMode(modeId);
    if (card) return { type: "classic", card };
  }
  return null;
}

function executeSequenceStep(step) {
  if (!state.running) return;
  if (!step) {
    finishGame("empty");
    return;
  }
  if (step.type === "draw") {
    if (!state.mixedDrawing?.active) {
      pauseRoundClock("drawing");
      markMixedDrawingStarted(state.mixedDrawing);
    }
    beginMixedDrawingBreak();
    return;
  }
  state.currentCard = step.card;
  renderGameCard();
}

export async function startClassicRound(options = {}) {
  preparedMixedDrawingCount = null;
  roundOptions = options.multiplayer ? {
    ...options,
    modeOrder: [...new Set(options.modeOrder || state.settings.selectedModeIds)]
  } : null;
  const modes = selectedModeOrder();
  const classicIds = modes.filter(modeId => modeId !== "draw");
  if (!classicIds.length || !classicCards().length) {
    alert("Sélectionne au moins un mode classique contenant des cartes actives pour lancer cette manche.");
    roundOptions = null;
    return false;
  }

  state.durationMs = (Number(options.durationSeconds) || getRequestedSeconds()) * 1000;
  const drawSelected = modes.includes("draw");
  if (drawSelected) {
    const drawCards = selectedCardsForMode("draw");
    if (!drawCards.length) {
      alert("Le mode Dessin est sélectionné, mais aucune de ses cartes ne correspond aux catégories et difficultés choisies.");
      roundOptions = null;
      return false;
    }
    const requested = state.settings.modeOptions.draw.mixedCount;
    const availableCount = Math.min(requested, drawCards.length);
    const feasibleCount = getFeasibleMixedDrawingCount(state.durationMs, availableCount);
    if (feasibleCount === 0) {
      alert("Cette manche est trop courte pour placer un dessin proprement. Augmente la durée à au moins 15 secondes ou désactive le mode Dessin.");
      roundOptions = null;
      return false;
    }
    preparedMixedDrawingCount = feasibleCount;
    if (!options.multiplayer && feasibleCount < requested) {
      alert(`Avec ${state.durationMs / 1000} secondes et les cartes sélectionnées, cette manche utilisera ${feasibleCount} dessin${feasibleCount > 1 ? "s" : ""} au lieu de ${requested}.`);
    }
  }

  state.remainingMs = state.durationMs;
  state.roundContext = roundOptions ? {
    kind: "multiplayer",
    playerId: roundOptions.playerId,
    turnId: roundOptions.turnId,
    modeOrder: [...roundOptions.modeOrder]
  } : { kind: "free" };
  await requestGameDisplay();
  if (options.skipCountdown) beginGame();
  else {
    showScreen(el.countdownScreen);
    runCountdown(beginGame);
  }
  return true;
}

function beginGame() {
  state.running = true;
  state.paused = false;
  state.pauseReason = null;
  state.queue = [];
  state.currentCard = null;
  state.history = [];
  state.valid = 0;
  state.passed = 0;
  state.score = 0;
  state.remainingMs = state.durationMs;
  state.mixedDrawing = createMixedDrawingState();
  sequenceCursor = 0;
  modeQueues = new Map();
  updateScores();
  showScreen(el.gameScreen);
  state.deadline = performance.now() + state.remainingMs;
  startTimerLoop(() => finishGame("time"));
  if (isMultiplayerRound()) executeSequenceStep(nextSequenceStep());
  else {
    refillQueue();
    drawNextCard();
  }
}

function missedCount() {
  const drawing = state.mixedDrawing;
  return state.passed + (drawing ? drawing.passed + drawing.expired : 0);
}

function updateScores() {
  const mixed = Boolean(state.mixedDrawing);
  el.validScoreLabel.textContent = mixed ? "POINTS" : "VALIDÉES";
  el.passScoreLabel.textContent = mixed ? "RATÉS" : "PASSÉES";
  el.validScore.textContent = String(mixed ? state.score : state.valid);
  el.passScore.textContent = String(mixed ? missedCount() : state.passed);
  const last = state.history.at(-1);
  el.undoButton.disabled = !last || last.kind !== "classic";
  el.undoButton.title = last?.kind === "draw"
    ? "Le dernier résultat est un dessin et ne peut pas être annulé."
    : "Revenir à la carte précédente";
}

export function togglePause(forcePause) {
  togglePauseState(forcePause, {
    onResume: requestWakeLock,
    onExpired: () => finishGame("time")
  });
}

function drawingBreakDueAfterCurrentCard() {
  const plan = state.mixedDrawing;
  if (!plan) return false;
  const remaining = liveRemainingMs();
  state.remainingMs = remaining;
  const elapsedMs = state.durationMs - remaining;
  closeUnplayableMixedDrawings(plan, remaining);
  return isMixedDrawingDue(plan, elapsedMs, remaining);
}

function beginMixedDrawingBreak() {
  const plan = state.mixedDrawing;
  if (!plan || plan.nextIndex >= plan.queue.length) {
    if (plan) {
      plan.active = false;
      const missing = Math.max(0, plan.requestedCount - plan.nextIndex);
      plan.cancelledCount += missing;
      plan.nextIndex = plan.requestedCount;
    }
    resumeAfterDrawingBreak();
    return;
  }
  const card = plan.queue[plan.nextIndex];
  const usedIds = usedIdsForMode("draw");
  if (usedIds && !usedIds.includes(card.id)) usedIds.push(card.id);
  startMixedDrawingBreak({
    card,
    index: plan.nextIndex + 1,
    total: plan.requestedCount,
    currentScore: state.score,
    penaltySeconds: plan.penaltyMs / 1000,
    onComplete: completeMixedDrawingBreak
  });
}

function completeMixedDrawingBreak(entry) {
  const plan = state.mixedDrawing;
  if (!state.running || !plan) return;
  if (entry.result === "deleted") {
    plan.active = false;
    plan.removedCount = (plan.removedCount || 0) + 1;
    plan.nextIndex += 1;
    renderTime();
    resumeAfterDrawingBreak();
    return;
  }
  state.history.push(entry);
  state.score += entry.points;
  plan.points += entry.points;
  if (entry.result === "valid") plan.found += 1;
  else if (entry.result === "expired") plan.expired += 1;
  else plan.passed += 1;
  plan.totalPenaltyMs += plan.penaltyMs;
  state.remainingMs = Math.max(0, state.remainingMs - plan.penaltyMs);
  markMixedDrawingCompleted(plan);
  updateScores();
  renderTime();

  if (state.remainingMs <= 0) {
    finishGame("time");
    return;
  }
  resumeAfterDrawingBreak();
}

function resumeAfterDrawingBreak() {
  if (!state.running) return;
  showScreen(el.gameScreen);
  if (isMultiplayerRound()) executeSequenceStep(nextSequenceStep());
  else drawNextCard();
  if (!state.running) return;
  resumeRoundClock(() => finishGame("time"));
  requestWakeLock();
}

function deleteCurrentClassicCard() {
  if (!state.running || state.paused || !state.currentCard) return;
  const card = state.currentCard;
  const config = modeConfig(card.modeId);
  const label = config.type === "lyrics" ? card.title : card.prompt;
  if (!confirm(
    `Supprimer définitivement cette carte ?\n\n${label}\n\n` +
    "Elle disparaîtra immédiatement de ce téléphone et sera ajoutée au fichier des cartes supprimées."
  )) return;

  if (!removeCardDuringGame(card.modeId, card.id, { source: "classic_game" })) return;
  state.queue = state.queue.filter(item => !(item.modeId === card.modeId && item.id === card.id));
  const modeQueue = modeQueues.get(card.modeId);
  if (modeQueue) {
    modeQueues.set(card.modeId, modeQueue.filter(item => item.id !== card.id));
  }
  state.currentCard = null;
  resetCardPosition();
  if (isMultiplayerRound()) executeSequenceStep(nextSequenceStep());
  else drawNextCard();
}

export function commitSwipe(result) {
  if (!state.running || state.paused || !state.currentCard) return;
  const judgedCard = state.currentCard;
  const points = result === "valid" ? 1 : 0;
  const historyEntry = {
    kind: "classic",
    card: judgedCard,
    result,
    points,
    _nextCard: null,
    _sequenceCursorBeforeNext: null
  };
  state.history.push(historyEntry);
  if (result === "valid") {
    state.valid += 1;
    state.score += 1;
  } else {
    state.passed += 1;
  }

  let nextStep = null;
  let startsDrawing = false;
  if (isMultiplayerRound()) {
    historyEntry._sequenceCursorBeforeNext = sequenceCursor;
    nextStep = nextSequenceStep();
    if (nextStep?.type === "classic") historyEntry._nextCard = nextStep.card;
    startsDrawing = nextStep?.type === "draw";
  } else {
    startsDrawing = drawingBreakDueAfterCurrentCard();
    if (!startsDrawing) historyEntry._nextCard = prepareNextFreeCard();
  }
  if (startsDrawing) {
    pauseRoundClock("drawing");
    markMixedDrawingStarted(state.mixedDrawing);
  }

  updateScores();
  vibrateForResult(result);
  animateCardExit(result, () => {
    if (!state.running) return;
    if (startsDrawing) beginMixedDrawingBreak();
    else if (isMultiplayerRound()) executeSequenceStep(nextStep);
    else drawNextCard();
  });
}

export function undoLast() {
  if (!state.running || state.paused || state.history.length === 0) return;
  const last = state.history.at(-1);
  if (last.kind !== "classic") return;
  state.history.pop();
  if (last.result === "valid") {
    state.valid = Math.max(0, state.valid - 1);
    state.score = Math.max(0, state.score - 1);
  } else {
    state.passed = Math.max(0, state.passed - 1);
  }
  restorePreparedCardAfterUndo(last);
  if (isMultiplayerRound()) {
    sequenceCursor = Number.isInteger(last._sequenceCursorBeforeNext)
      ? Math.max(0, last._sequenceCursorBeforeNext)
      : Math.max(0, sequenceCursor - 1);
  }
  state.currentCard = last.card;
  updateScores();
  renderGameCard();
}

function finalizeUnplayedDrawings(reason) {
  const plan = state.mixedDrawing;
  if (!plan) return;
  plan.active = false;
  const remaining = Math.max(0, plan.requestedCount - plan.nextIndex);
  if (remaining) {
    if (reason === "time") plan.skippedForTime += remaining;
    else plan.cancelledCount += remaining;
    plan.nextIndex = plan.requestedCount;
  }
}

function currentRoundResult(reason) {
  if (state.running && !state.paused) state.remainingMs = liveRemainingMs();
  return {
    reason,
    durationMs: state.durationMs,
    remainingMs: state.remainingMs,
    score: state.score,
    valid: state.valid,
    passed: state.passed,
    history: state.history.map(entry => {
      const { _nextCard, _sequenceCursorBeforeNext, ...publicEntry } = entry;
      return {
        ...publicEntry,
        card: entry.card ? { ...entry.card } : null
      };
    })
  };
}

export function finishGame(reason = "manual") {
  if (!state.running) return;
  const result = currentRoundResult(reason);
  const complete = roundOptions?.onComplete || null;
  state.running = false;
  state.paused = false;
  state.pauseReason = null;
  stopTimers();
  finalizeUnplayedDrawings(reason);
  stopDrawingRound();
  el.pauseOverlay.classList.add("hidden");
  el.pauseButton.textContent = "Ⅱ Pause";

  if (complete) {
    const completedOptions = roundOptions;
    roundOptions = null;
    state.roundContext = null;
    state.mixedDrawing = null;
    state.currentCard = null;
    releaseWakeLock();
    complete(result, completedOptions);
    return;
  }

  renderGameResults(reason);
  showScreen(el.resultsScreen);
  releaseWakeLock();
}

export function stopClassicGame() {
  state.running = false;
  state.paused = false;
  state.pauseReason = null;
  state.pointer = null;
  state.mixedDrawing = null;
  state.roundContext = null;
  roundOptions = null;
  sequenceCursor = 0;
  modeQueues = new Map();
  stopTimers();
  el.pauseOverlay.classList.add("hidden");
  el.pauseButton.textContent = "Ⅱ Pause";
}

export function initializeGame(callbacks = {}) {
  onReplay = callbacks.onReplay || null;
  onHome = callbacks.onHome || null;
  initializeDurationControls();
  initializeSwipe(commitSwipe);
  el.undoButton.addEventListener("click", undoLast);
  el.pauseButton.addEventListener("click", () => togglePause());
  el.resumeOverlayButton.addEventListener("click", () => togglePause(false));
  el.endButton.addEventListener("click", () => finishGame("manual"));
  el.deleteCurrentCardButton.addEventListener("click", deleteCurrentClassicCard);
  el.replayButton.addEventListener("click", () => onReplay?.());
  el.homeButton.addEventListener("click", () => onHome?.());

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && state.running && !state.paused) togglePause(true);
    else if (document.visibilityState === "visible" && state.running && state.pauseReason !== "drawing") requestWakeLock();
  });
  window.addEventListener("keydown", event => {
    if (!state.running || state.paused) return;
    if (event.key === "ArrowRight") commitSwipe("valid");
    if (event.key === "ArrowLeft") commitSwipe("pass");
    if (event.key === "Backspace") {
      event.preventDefault();
      undoLast();
    }
    if (event.key === " ") {
      event.preventDefault();
      togglePause();
    }
  });
  renderTime();
}
