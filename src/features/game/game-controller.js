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
import { getBoxName, getPlayableCards, modeConfig } from "../../services/libraries.js";
import { renderGameResults } from "./results.js";
import { animateCardExit, initializeSwipe, resetCardPosition } from "./swipe.js";
import {
  getRequestedSeconds,
  initializeDurationControls,
  renderTime,
  runCountdown,
  startTimerLoop,
  stopTimers,
  togglePauseState
} from "./timer.js";

let onReplay = null;
let onHome = null;

function refillQueue() {
  const next = shuffle(getPlayableCards());
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

export async function startClassicRound() {
  state.durationMs = getRequestedSeconds() * 1000;
  state.remainingMs = state.durationMs;
  await requestGameDisplay();
  showScreen(el.countdownScreen);
  runCountdown(beginGame);
}

function beginGame() {
  state.running = true;
  state.paused = false;
  state.queue = [];
  state.currentCard = null;
  state.history = [];
  state.valid = 0;
  state.passed = 0;
  state.remainingMs = state.durationMs;
  updateScores();
  refillQueue();
  drawNextCard();
  showScreen(el.gameScreen);
  state.deadline = performance.now() + state.remainingMs;
  startTimerLoop(() => finishGame("time"));
}

function updateScores() {
  el.validScore.textContent = String(state.valid);
  el.passScore.textContent = String(state.passed);
  el.undoButton.disabled = state.history.length === 0;
}

export function togglePause(forcePause) {
  togglePauseState(forcePause, {
    onResume: requestWakeLock,
    onExpired: () => finishGame("time")
  });
}

export function commitSwipe(result) {
  if (!state.running || state.paused || !state.currentCard) return;
  const judgedCard = state.currentCard;
  state.history.push({ card: judgedCard, result });
  if (result === "valid") state.valid += 1;
  else state.passed += 1;
  updateScores();
  vibrateForResult(result);
  animateCardExit(result, () => {
    if (state.running) drawNextCard();
  });
}

export function undoLast() {
  if (!state.running || state.paused || state.history.length === 0) return;
  const last = state.history.pop();
  if (last.result === "valid") state.valid = Math.max(0, state.valid - 1);
  else state.passed = Math.max(0, state.passed - 1);
  if (state.currentCard) state.queue.unshift(state.currentCard);
  state.currentCard = last.card;
  updateScores();
  renderGameCard();
}

export function finishGame(reason = "manual") {
  if (!state.running) return;
  state.running = false;
  state.paused = false;
  stopTimers();
  el.pauseOverlay.classList.add("hidden");
  el.pauseButton.textContent = "Ⅱ Pause";
  renderGameResults(reason);
  showScreen(el.resultsScreen);
  releaseWakeLock();
}

export function stopClassicGame() {
  state.running = false;
  state.paused = false;
  state.pointer = null;
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
    else if (document.visibilityState === "visible" && state.running) requestWakeLock();
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
