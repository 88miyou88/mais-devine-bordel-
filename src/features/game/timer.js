import { el } from "../../core/dom.js";
import { state } from "../../core/state.js";

export function initializeDurationControls() {
  el.durationButtons.forEach(button => {
    button.addEventListener("click", () => updateDurationSelection(Number(button.dataset.seconds)));
  });
  el.customSeconds.addEventListener("input", () => {
    if (el.customSeconds.value !== "") {
      el.durationButtons.forEach(button => button.classList.remove("selected"));
    }
  });
}

export function getRequestedSeconds() {
  const custom = Number.parseInt(el.customSeconds.value, 10);
  if (Number.isFinite(custom)) return Math.min(600, Math.max(10, custom));
  return state.selectedSeconds;
}

export function updateDurationSelection(seconds) {
  state.selectedSeconds = seconds;
  el.durationButtons.forEach(button => {
    button.classList.toggle("selected", Number(button.dataset.seconds) === seconds);
  });
  el.customSeconds.value = "";
}

export function runCountdown(onComplete) {
  clearInterval(state.countdownTimer);
  let value = 3;
  el.countdownValue.textContent = value;
  state.countdownTimer = window.setInterval(() => {
    value -= 1;
    if (value > 0) {
      el.countdownValue.textContent = value;
      el.countdownValue.style.animation = "none";
      void el.countdownValue.offsetWidth;
      el.countdownValue.style.animation = "";
    } else {
      clearInterval(state.countdownTimer);
      onComplete();
    }
  }, 900);
}

export function startTimerLoop(onExpired) {
  cancelAnimationFrame(state.rafId);
  const tick = now => {
    if (!state.running || state.paused) return;
    state.remainingMs = Math.max(0, state.deadline - now);
    renderTime();
    if (state.remainingMs <= 0) {
      onExpired();
      return;
    }
    state.rafId = requestAnimationFrame(tick);
  };
  state.rafId = requestAnimationFrame(tick);
}

export function renderTime() {
  el.timeDisplay.textContent = String(Math.ceil(state.remainingMs / 1000));
}

export function pauseRoundClock(reason = "system") {
  if (!state.running || state.paused) return false;
  state.remainingMs = Math.max(0, state.deadline - performance.now());
  state.paused = true;
  state.pauseReason = reason;
  cancelAnimationFrame(state.rafId);
  renderTime();
  return true;
}

export function resumeRoundClock(onExpired) {
  if (!state.running || !state.paused) return false;
  state.paused = false;
  state.pauseReason = null;
  state.deadline = performance.now() + state.remainingMs;
  startTimerLoop(onExpired);
  return true;
}

export function togglePauseState(forcePause, { onResume = null, onExpired = null } = {}) {
  if (!state.running || state.pauseReason === "drawing") return;
  const shouldPause = typeof forcePause === "boolean" ? forcePause : !state.paused;
  if (shouldPause === state.paused) return;

  if (shouldPause) {
    pauseRoundClock("user");
    el.pauseOverlay.classList.remove("hidden");
    el.pauseButton.textContent = "▶ Reprendre";
  } else {
    el.pauseOverlay.classList.add("hidden");
    el.pauseButton.textContent = "Ⅱ Pause";
    resumeRoundClock(onExpired);
    onResume?.();
  }
}

export function stopTimers() {
  cancelAnimationFrame(state.rafId);
  clearInterval(state.countdownTimer);
}
