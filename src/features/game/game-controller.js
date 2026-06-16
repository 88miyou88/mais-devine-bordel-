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

function classicCards() {
  return getPlayableCards({ excludeModeIds: ["draw"] });
}

function refillQueue() {
  const next = shuffle(classicCards());
  if (state.currentCard && next.length > 1) {
    const firstSame = next[0].modeId === state.currentCard.modeId && next[0].id === state.currentCard.id;
    if (firstSame) [next[0], next[1]] = [next[1], next[0]];
  }
  state.queue.push(...next);
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
  if (config.type === "lyrics") length += card.answer.length;
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

function createMixedDrawingState() {
  const drawSelected = state.settings.selectedModeIds.includes("draw");
  if (!drawSelected || state.settings.selectedModeIds.length < 2) return null;
  const drawCards = selectedCardsForMode("draw");
  if (!drawCards.length) return null;
  const wanted = preparedMixedDrawingCount ?? Math.min(state.settings.modeOptions.draw.mixedCount, drawCards.length);
  preparedMixedDrawingCount = null;
  return {
    ...createMixedDrawingPlan(state.durationMs, wanted),
    queue: buildBalancedDrawQueue(drawCards, wanted),
    found: 0,
    passed: 0,
    expired: 0,
    points: 0,
    totalPenaltyMs: 0
  };
}

export async function startClassicRound() {
  preparedMixedDrawingCount = null;
  if (!classicCards().length) {
    alert("Sélectionne au moins un mode classique contenant des cartes actives pour lancer une partie mélangée.");
    return false;
  }

  state.durationMs = getRequestedSeconds() * 1000;
  const drawSelected = state.settings.selectedModeIds.includes("draw");
  if (drawSelected) {
    const drawCards = selectedCardsForMode("draw");
    if (!drawCards.length) {
      alert("Le mode Dessin est sélectionné, mais aucune de ses cartes ne correspond aux catégories et difficultés choisies.");
      return false;
    }

    const requested = state.settings.modeOptions.draw.mixedCount;
    const availableCount = Math.min(requested, drawCards.length);
    const feasibleCount = getFeasibleMixedDrawingCount(state.durationMs, availableCount);
    if (feasibleCount === 0) {
      alert("Cette manche est trop courte pour placer un dessin proprement. Augmente la durée à au moins 15 secondes ou désactive le mode Dessin.");
      return false;
    }
    preparedMixedDrawingCount = feasibleCount;
    if (feasibleCount < requested) {
      alert(`Avec ${state.durationMs / 1000} secondes et les cartes sélectionnées, cette manche utilisera ${feasibleCount} dessin${feasibleCount > 1 ? "s" : ""} au lieu de ${requested}.`);
    }
  }

  state.remainingMs = state.durationMs;
  await requestGameDisplay();
  showScreen(el.countdownScreen);
  runCountdown(beginGame);
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
  updateScores();
  refillQueue();
  drawNextCard();
  showScreen(el.gameScreen);
  state.deadline = performance.now() + state.remainingMs;
  startTimerLoop(() => finishGame("time"));
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
  const liveRemaining = state.paused
    ? state.remainingMs
    : Math.max(0, state.deadline - performance.now());
  state.remainingMs = liveRemaining;
  const elapsedMs = state.durationMs - liveRemaining;
  closeUnplayableMixedDrawings(plan, liveRemaining);
  return isMixedDrawingDue(plan, elapsedMs, liveRemaining);
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
  drawNextCard();
  showScreen(el.gameScreen);
  resumeRoundClock(() => finishGame("time"));
  requestWakeLock();
}

export function commitSwipe(result) {
  if (!state.running || state.paused || !state.currentCard) return;
  const judgedCard = state.currentCard;
  const points = result === "valid" ? 1 : 0;
  state.history.push({ kind: "classic", card: judgedCard, result, points });
  if (result === "valid") {
    state.valid += 1;
    state.score += 1;
  } else {
    state.passed += 1;
  }
  const startsDrawing = drawingBreakDueAfterCurrentCard();
  if (startsDrawing) {
    pauseRoundClock("drawing");
    markMixedDrawingStarted(state.mixedDrawing);
  }
  updateScores();
  vibrateForResult(result);
  animateCardExit(result, () => {
    if (!state.running) return;
    if (startsDrawing) beginMixedDrawingBreak();
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
  if (state.currentCard) state.queue.unshift(state.currentCard);
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

export function finishGame(reason = "manual") {
  if (!state.running) return;
  state.running = false;
  state.paused = false;
  state.pauseReason = null;
  stopTimers();
  finalizeUnplayedDrawings(reason);
  stopDrawingRound();
  el.pauseOverlay.classList.add("hidden");
  el.pauseButton.textContent = "Ⅱ Pause";
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
