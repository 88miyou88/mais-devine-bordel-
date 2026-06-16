import {
  DIFFICULTY_LABELS,
  DRAW_RETURN_COUNTDOWN_SECONDS
} from "../../config/config.js";
import {
  el,
  releaseWakeLock,
  requestGameDisplay,
  requestWakeLock,
  showScreen,
  vibrateForResult
} from "../../core/dom.js";
import { recordError, state } from "../../core/state.js";
import { shuffle } from "../../core/utils.js";
import { getBoxName, selectedCardsForMode } from "../../services/libraries.js";
import {
  initializeDrawingCanvas,
  resizeDrawingCanvas,
  updateDrawToolButton
} from "./canvas.js";
import { initializeHoldActions, resetDrawHoldButtons } from "./hold-actions.js";
import { displayDrawingSupport } from "./paper-mode.js";

let callbacks = {};

function drawPointValue(difficulty) {
  return difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
}

export function buildBalancedDrawQueue(cards, wanted) {
  const buckets = { easy: [], medium: [], hard: [] };
  cards.forEach(card => buckets[card.difficulty]?.push(card));
  Object.keys(buckets).forEach(key => {
    buckets[key] = shuffle(buckets[key]);
  });
  const enabled = state.modes.draw.selectedDifficultyIds.filter(id => buckets[id]?.length);
  const order = shuffle(enabled.length ? enabled : ["easy", "medium", "hard"]);
  const result = [];
  let guard = 0;
  while (result.length < wanted && guard < wanted * 20) {
    const difficulty = order[guard % order.length];
    if (buckets[difficulty]?.length) result.push({ ...buckets[difficulty].pop(), modeId: "draw" });
    else {
      const fallback = Object.keys(buckets).find(key => buckets[key].length);
      if (!fallback) break;
      result.push({ ...buckets[fallback].pop(), modeId: "draw" });
    }
    guard += 1;
  }
  return result;
}

function createDrawingRound({
  kind,
  queue,
  totalAttempts = queue.length,
  displayIndex = 1,
  points = 0,
  penaltySeconds = 0,
  onComplete = null
}) {
  return {
    kind,
    queue,
    attemptIndex: 0,
    totalAttempts,
    displayIndex,
    points,
    successes: 0,
    totalUsedMs: 0,
    history: [],
    currentCard: null,
    timerRaf: 0,
    transitionTimer: 0,
    deadline: 0,
    durationMs: 0,
    remainingMs: 0,
    timerPaused: false,
    resultLocked: false,
    support: null,
    strokes: [],
    undoActions: [],
    currentStroke: null,
    color: "#111318",
    size: 7,
    eraser: false,
    canvasWidth: 0,
    canvasHeight: 0,
    penaltySeconds,
    onComplete,
    transitionAction: null
  };
}

export async function startDrawingRound() {
  const cards = selectedCardsForMode("draw");
  if (!cards.length) {
    alert("Sélectionne au moins une catégorie et une difficulté pour le dessin.");
    return false;
  }
  await requestGameDisplay();
  const wanted = Math.min(state.settings.modeOptions.draw.attemptCount, cards.length);
  state.drawRound = createDrawingRound({
    kind: "standalone",
    queue: buildBalancedDrawQueue(cards, wanted),
    totalAttempts: wanted
  });
  showNextDrawingPrompt();
  return true;
}

export function startMixedDrawingBreak({
  card,
  index,
  total,
  currentScore,
  penaltySeconds,
  onComplete
}) {
  stopDrawingRound();
  state.drawRound = createDrawingRound({
    kind: "mixed",
    queue: [{ ...card, modeId: "draw" }],
    totalAttempts: total,
    displayIndex: index,
    points: currentScore,
    penaltySeconds,
    onComplete
  });
  playDrawingArrivalSignal();
  showPickupTransition();
}

function drawingIndex(round) {
  return round.kind === "mixed" ? round.displayIndex : round.attemptIndex + 1;
}

function showPickupTransition() {
  const round = state.drawRound;
  if (!round) return;
  clearInterval(round.transitionTimer);
  round.transitionAction = showNextDrawingPrompt;
  el.drawTransitionKicker.textContent = "CARTE SPÉCIALE · DESSIN";
  el.drawTransitionTitle.textContent = "Récupère le téléphone !";
  el.drawTransitionText.textContent = "Le chrono général est en pause. Prends le téléphone sans montrer la prochaine consigne.";
  el.drawTransitionCountdown.classList.add("hidden");
  el.drawTransitionButton.classList.remove("hidden");
  el.drawTransitionButton.textContent = "J’ai le téléphone";
  showScreen(el.drawTransitionScreen);
}

function showReturnTransition(entry) {
  const round = state.drawRound;
  if (!round) return;
  clearInterval(round.transitionTimer);
  cancelAnimationFrame(round.timerRaf);
  el.drawPauseOverlay.classList.add("hidden");
  el.drawTransitionKicker.textContent = entry.result === "valid" ? "DESSIN TROUVÉ" : "DESSIN TERMINÉ";
  el.drawTransitionTitle.textContent = "Remets le téléphone sur ton front";
  el.drawTransitionText.textContent = `Pénalité appliquée : −${round.penaltySeconds} s. La partie reprend automatiquement.`;
  el.drawTransitionButton.classList.add("hidden");
  el.drawTransitionCountdown.classList.remove("hidden");
  let remaining = DRAW_RETURN_COUNTDOWN_SECONDS;
  el.drawTransitionCountdown.textContent = String(remaining);
  showScreen(el.drawTransitionScreen);

  round.transitionTimer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    remaining -= 1;
    if (remaining > 0) {
      el.drawTransitionCountdown.textContent = String(remaining);
      el.drawTransitionCountdown.style.animation = "none";
      void el.drawTransitionCountdown.offsetWidth;
      el.drawTransitionCountdown.style.animation = "";
      return;
    }
    clearInterval(round.transitionTimer);
    const complete = round.onComplete;
    state.drawRound = null;
    complete?.(entry);
  }, 900);
}

function handleTransitionButton() {
  const action = state.drawRound?.transitionAction;
  if (!action) return;
  state.drawRound.transitionAction = null;
  action();
}

function showNextDrawingPrompt() {
  const round = state.drawRound;
  cancelAnimationFrame(round?.timerRaf || 0);
  if (!round || round.attemptIndex >= round.queue.length) {
    if (round?.kind === "standalone") finishDrawingRound();
    return;
  }
  round.currentCard = round.queue[round.attemptIndex];
  round.support = null;
  round.resultLocked = false;
  round.timerPaused = false;
  el.drawPauseOverlay.classList.add("hidden");
  el.drawPauseButton.textContent = "Ⅱ";
  el.drawPromptPanel.classList.remove("hidden");
  el.drawAttemptLabel.textContent = `Dessin ${drawingIndex(round)} sur ${round.totalAttempts}`;
  const points = drawPointValue(round.currentCard.difficulty);
  el.drawRevealMeta.textContent = `${getBoxName("draw", round.currentCard.boxId)} · ${DIFFICULTY_LABELS[round.currentCard.difficulty]} · ${points} point${points > 1 ? "s" : ""}`;
  setDrawingPromptRevealed(false);
  resetDrawHoldButtons();
  showScreen(el.drawRevealScreen);
}

function setDrawingPromptRevealed(revealed) {
  const round = state.drawRound;
  if (!round?.currentCard) return;
  round.promptRevealed = revealed;
  el.drawRevealPromptButton.classList.toggle("revealed", revealed);
  el.drawRevealPromptButton.setAttribute("aria-pressed", String(revealed));
  el.drawRevealPrompt.textContent = revealed ? round.currentCard.prompt : "Appuie pour révéler le mot";
  el.drawRevealMeta.classList.toggle("hidden", !revealed);
  [el.drawOnPhoneButton, el.drawOnPaperButton, el.drawSkipRevealButton].forEach(button => {
    button.disabled = !revealed;
  });
}

function revealDrawingPrompt() {
  if (!state.drawRound?.currentCard || state.drawRound.promptRevealed) return;
  setDrawingPromptRevealed(true);
  if (state.settings.vibrationEnabled && "vibrate" in navigator) navigator.vibrate(22);
}

function skipDrawingBeforeStart() {
  recordDrawingResult("passed", 0, true);
}

function startDrawingPlay(support) {
  const round = state.drawRound;
  if (!round?.currentCard || round.resultLocked) return;
  round.support = support;
  round.strokes = [];
  round.undoActions = [];
  round.currentStroke = null;
  round.eraser = false;
  updateDrawToolButton();
  displayDrawingSupport(support);
  resetDrawHoldButtons();
  el.drawPlayProgress.textContent = `Dessin ${drawingIndex(round)}/${round.totalAttempts}`;
  updateDrawLiveScore();
  showScreen(el.drawPlayScreen);
  if (support === "phone") requestAnimationFrame(() => resizeDrawingCanvas(true));
  startDrawingTimer();
}

function updateDrawLiveScore() {
  const round = state.drawRound;
  if (!round) return;
  el.drawLiveScore.textContent = `${round.points} point${round.points > 1 ? "s" : ""}`;
}

function startDrawingTimer() {
  const round = state.drawRound;
  if (!round?.currentCard) return;
  const seconds = state.settings.modeOptions.draw.durations[round.currentCard.difficulty];
  round.durationMs = seconds * 1000;
  round.remainingMs = round.durationMs;
  round.timerPaused = false;
  runDrawingTimer(round);
}

function runDrawingTimer(round) {
  round.deadline = performance.now() + round.remainingMs;
  cancelAnimationFrame(round.timerRaf);
  const tick = now => {
    if (!state.drawRound || state.drawRound !== round || round.timerPaused || round.resultLocked) return;
    round.remainingMs = Math.max(0, round.deadline - now);
    el.drawTimerDisplay.textContent = String(Math.ceil(round.remainingMs / 1000));
    if (round.remainingMs <= 0) {
      playDrawingEndSignal();
      recordDrawingResult("expired", round.durationMs);
      return;
    }
    round.timerRaf = requestAnimationFrame(tick);
  };
  el.drawTimerDisplay.textContent = String(Math.ceil(round.remainingMs / 1000));
  round.timerRaf = requestAnimationFrame(tick);
}

function toggleDrawingPause(forcePause) {
  const round = state.drawRound;
  if (!round?.support || round.resultLocked) return;
  const shouldPause = typeof forcePause === "boolean" ? forcePause : !round.timerPaused;
  if (shouldPause === round.timerPaused) return;

  if (shouldPause) {
    round.remainingMs = Math.max(0, round.deadline - performance.now());
    round.timerPaused = true;
    cancelAnimationFrame(round.timerRaf);
    el.drawPauseOverlay.classList.remove("hidden");
    el.drawPauseButton.textContent = "▶";
  } else {
    round.timerPaused = false;
    el.drawPauseOverlay.classList.add("hidden");
    el.drawPauseButton.textContent = "Ⅱ";
    runDrawingTimer(round);
    requestWakeLock();
  }
}

function playTonePattern(notes) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    state.drawAudioContext ||= new AudioContextClass();
    const context = state.drawAudioContext;
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime;
    notes.forEach(({ offset, frequency, duration = 0.14 }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + duration + 0.01);
    });
  } catch (error) {
    recordError(error);
  }
}

function playDrawingArrivalSignal() {
  if (state.settings.vibrationEnabled && "vibrate" in navigator) {
    navigator.vibrate([80, 55, 80, 55, 220]);
  }
  if (!state.settings.modeOptions.draw.arrivalSoundEnabled) return;
  playTonePattern([
    { offset: 0, frequency: 520, duration: 0.11 },
    { offset: 0.14, frequency: 720, duration: 0.11 },
    { offset: 0.28, frequency: 920, duration: 0.17 }
  ]);
}

function playDrawingEndSignal() {
  if (state.settings.vibrationEnabled && "vibrate" in navigator) {
    navigator.vibrate([180, 80, 180, 80, 300]);
  }
  if (!state.settings.modeOptions.draw.soundEnabled) return;
  playTonePattern([
    { offset: 0, frequency: 660 },
    { offset: 0.18, frequency: 660 },
    { offset: 0.36, frequency: 440 }
  ]);
}

function recordDrawingResult(result, elapsedMs = null, fromReveal = false) {
  const round = state.drawRound;
  if (!round?.currentCard || round.resultLocked) return;
  round.resultLocked = true;
  cancelAnimationFrame(round.timerRaf);
  const used = fromReveal ? 0 : Math.max(0, elapsedMs ?? (round.durationMs - round.remainingMs));
  const gained = result === "valid" ? drawPointValue(round.currentCard.difficulty) : 0;
  if (result === "valid") {
    round.points += gained;
    round.successes += 1;
    vibrateForResult("valid");
  } else if (result === "passed") {
    vibrateForResult("pass");
  }

  const entry = {
    kind: "draw",
    card: round.currentCard,
    result,
    points: gained,
    usedMs: used,
    support: round.support || "skipped",
    penaltySeconds: round.kind === "mixed" ? round.penaltySeconds : 0
  };

  round.totalUsedMs += used;
  round.history.push(entry);

  if (round.kind === "mixed") {
    showReturnTransition(entry);
    return;
  }

  round.attemptIndex += 1;
  updateDrawLiveScore();
  window.setTimeout(showNextDrawingPrompt, 280);
}

function finishDrawingRound() {
  const round = state.drawRound;
  if (!round) return;
  cancelAnimationFrame(round.timerRaf);
  clearInterval(round.transitionTimer);
  el.resultBreakdown.classList.add("hidden");
  el.resultBreakdown.innerHTML = "";
  el.resultValid.textContent = String(round.points);
  el.resultPassed.textContent = String(round.successes);
  el.resultTotal.textContent = String(round.history.length);
  el.resultValidLabel.textContent = "points";
  el.resultPassedLabel.textContent = "trouvés";
  el.resultTotalLabel.textContent = "dessins";
  el.resultDetails.innerHTML = "";

  round.history.forEach(entry => {
    const row = document.createElement("div");
    row.className = `result-row ${entry.result === "valid" ? "valid" : "passed"}`;
    const status = document.createElement("span");
    status.className = "status";
    status.textContent = entry.result === "valid" ? "✓" : entry.result === "expired" ? "⌛" : "✕";
    const details = document.createElement("div");
    details.className = "details";
    const title = document.createElement("strong");
    title.textContent = entry.card.prompt;
    const small = document.createElement("small");
    const seconds = (entry.usedMs / 1000).toFixed(1).replace(".0", "");
    small.textContent = `${DIFFICULTY_LABELS[entry.card.difficulty]} · ${entry.points} point${entry.points > 1 ? "s" : ""} · ${seconds} s`;
    details.append(title, small);
    const word = document.createElement("span");
    word.className = "result-word";
    word.textContent = entry.result === "valid" ? "TROUVÉ" : entry.result === "expired" ? "EXPIRÉ" : "PASSÉ";
    row.append(status, details, word);
    el.resultDetails.append(row);
  });

  state.drawRound = null;
  showScreen(el.resultsScreen);
  releaseWakeLock();
}

function endDrawingRound() {
  const round = state.drawRound;
  if (!round) return;
  if (round.kind === "mixed") {
    stopDrawingRound();
    callbacks.onAbortMixed?.();
  } else {
    finishDrawingRound();
  }
}

export function stopDrawingRound() {
  if (state.drawRound) {
    cancelAnimationFrame(state.drawRound.timerRaf || 0);
    clearInterval(state.drawRound.transitionTimer || 0);
  }
  state.drawRound = null;
  state.drawPointer = null;
  el.drawPauseOverlay.classList.add("hidden");
  resetDrawHoldButtons();
}

export function initializeDrawing(options = {}) {
  callbacks = options;
  initializeDrawingCanvas();
  initializeHoldActions({
    onFound: () => recordDrawingResult("valid"),
    onPass: () => recordDrawingResult("passed")
  });
  el.drawTransitionButton.addEventListener("click", handleTransitionButton);
  el.drawRevealPromptButton.addEventListener("click", revealDrawingPrompt);
  el.drawSkipRevealButton.addEventListener("click", skipDrawingBeforeStart);
  el.drawOnPhoneButton.addEventListener("click", () => startDrawingPlay("phone"));
  el.drawOnPaperButton.addEventListener("click", () => startDrawingPlay("paper"));
  el.drawPauseButton.addEventListener("click", () => toggleDrawingPause());
  el.drawResumeButton.addEventListener("click", () => toggleDrawingPause(false));
  el.drawEndButton.addEventListener("click", endDrawingRound);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && state.drawRound?.support && !state.drawRound.timerPaused) {
      toggleDrawingPause(true);
    }
  });
}
