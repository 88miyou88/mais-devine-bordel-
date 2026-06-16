import { DIFFICULTY_LABELS } from "../../config/config.js";
import {
  el,
  releaseWakeLock,
  requestGameDisplay,
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

function drawPointValue(difficulty) {
  return difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1;
}

function buildBalancedDrawQueue(cards, wanted) {
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

export async function startDrawingRound() {
  const cards = selectedCardsForMode("draw");
  if (!cards.length) {
    alert("Sélectionne au moins une catégorie et une difficulté pour le dessin.");
    return;
  }
  await requestGameDisplay();
  const wanted = Math.min(state.settings.modeOptions.draw.attemptCount, cards.length);
  state.drawRound = {
    queue: buildBalancedDrawQueue(cards, wanted),
    attemptIndex: 0,
    points: 0,
    successes: 0,
    totalUsedMs: 0,
    history: [],
    currentCard: null,
    timerRaf: 0,
    deadline: 0,
    durationMs: 0,
    remainingMs: 0,
    support: null,
    strokes: [],
    undoActions: [],
    currentStroke: null,
    color: "#111318",
    size: 7,
    eraser: false,
    canvasWidth: 0,
    canvasHeight: 0
  };
  showNextDrawingPrompt();
}

function showNextDrawingPrompt() {
  const round = state.drawRound;
  cancelAnimationFrame(round?.timerRaf || 0);
  if (!round || round.attemptIndex >= round.queue.length) {
    finishDrawingRound();
    return;
  }
  round.currentCard = round.queue[round.attemptIndex];
  round.support = null;
  el.drawPromptPanel.classList.remove("hidden");
  el.drawAttemptLabel.textContent = `Dessin ${round.attemptIndex + 1} sur ${round.queue.length}`;
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
  if (!round?.currentCard) return;
  round.support = support;
  round.strokes = [];
  round.undoActions = [];
  round.currentStroke = null;
  round.eraser = false;
  updateDrawToolButton();
  displayDrawingSupport(support);
  resetDrawHoldButtons();
  el.drawPlayProgress.textContent = `Dessin ${round.attemptIndex + 1}/${round.queue.length}`;
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
  const seconds = state.settings.modeOptions.draw.durations[round.currentCard.difficulty];
  round.durationMs = seconds * 1000;
  round.remainingMs = round.durationMs;
  round.deadline = performance.now() + round.durationMs;
  cancelAnimationFrame(round.timerRaf);

  const tick = now => {
    if (!state.drawRound || state.drawRound !== round) return;
    round.remainingMs = Math.max(0, round.deadline - now);
    el.drawTimerDisplay.textContent = String(Math.ceil(round.remainingMs / 1000));
    if (round.remainingMs <= 0) {
      playDrawingEndSignal();
      recordDrawingResult("passed", round.durationMs, false, true);
      return;
    }
    round.timerRaf = requestAnimationFrame(tick);
  };
  round.timerRaf = requestAnimationFrame(tick);
}

function playDrawingEndSignal() {
  if (state.settings.vibrationEnabled && "vibrate" in navigator) {
    navigator.vibrate([180, 80, 180, 80, 300]);
  }
  if (!state.settings.modeOptions.draw.soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.drawAudioContext ||= new AudioContextClass();
    const context = state.drawAudioContext;
    const start = context.currentTime;
    [0, 0.18, 0.36].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = index === 2 ? 440 : 660;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.14);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.15);
    });
  } catch (error) {
    recordError(error);
  }
}

function recordDrawingResult(result, elapsedMs = null, fromReveal = false, timeout = false) {
  const round = state.drawRound;
  if (!round?.currentCard) return;
  cancelAnimationFrame(round.timerRaf);
  const used = fromReveal ? 0 : Math.max(0, elapsedMs ?? (round.durationMs - round.remainingMs));
  const gained = result === "valid" ? drawPointValue(round.currentCard.difficulty) : 0;
  if (result === "valid") {
    round.points += gained;
    round.successes += 1;
    vibrateForResult("valid");
  } else if (!timeout) {
    vibrateForResult("pass");
  }
  round.totalUsedMs += used;
  round.history.push({
    card: round.currentCard,
    result,
    points: gained,
    usedMs: used,
    support: round.support || "skipped"
  });
  round.attemptIndex += 1;
  updateDrawLiveScore();
  window.setTimeout(showNextDrawingPrompt, 280);
}

function finishDrawingRound() {
  const round = state.drawRound;
  if (!round) return;
  cancelAnimationFrame(round.timerRaf);
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
    status.textContent = entry.result === "valid" ? "✓" : "✕";
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
    word.textContent = entry.result === "valid" ? "TROUVÉ" : "PASSÉ";
    row.append(status, details, word);
    el.resultDetails.append(row);
  });

  state.drawRound = null;
  showScreen(el.resultsScreen);
  releaseWakeLock();
}

export function stopDrawingRound() {
  if (state.drawRound) cancelAnimationFrame(state.drawRound.timerRaf || 0);
  state.drawRound = null;
  state.drawPointer = null;
}

export function initializeDrawing() {
  initializeDrawingCanvas();
  initializeHoldActions({
    onFound: () => recordDrawingResult("valid"),
    onPass: () => recordDrawingResult("passed")
  });
  el.drawRevealPromptButton.addEventListener("click", revealDrawingPrompt);
  el.drawSkipRevealButton.addEventListener("click", skipDrawingBeforeStart);
  el.drawOnPhoneButton.addEventListener("click", () => startDrawingPlay("phone"));
  el.drawOnPaperButton.addEventListener("click", () => startDrawingPlay("paper"));
}
