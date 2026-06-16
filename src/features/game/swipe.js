import { SWIPE_ANIMATION_MS } from "../../config/config.js";
import { el, getSwipeThreshold } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { writeTextStorage } from "../../core/storage.js";

let onSwipe = null;

export function initializeSwipe(handler) {
  onSwipe = handler;
  el.gameCard.addEventListener("pointerdown", onPointerDown);
  el.gameCard.addEventListener("pointermove", onPointerMove);
  el.gameCard.addEventListener("pointerup", onPointerEnd);
  el.gameCard.addEventListener("pointercancel", onPointerEnd);
  syncSwipeGuides();
}

export function resetCardPosition() {
  el.gameCard.classList.remove("animating", "swiping-valid", "swiping-pass");
  el.gameCard.style.removeProperty("--swipe-tint");
  el.gameCard.style.transform = "";
  el.gameCard.style.opacity = "1";
}

export function animateCardExit(result, onComplete) {
  el.gameCard.classList.remove("swiping-valid", "swiping-pass");
  el.gameCard.classList.add(result === "valid" ? "swiping-valid" : "swiping-pass");
  el.gameCard.style.setProperty("--swipe-tint", "0.58");

  const direction = result === "valid" ? 1 : -1;
  const displayDirection = state.flipped ? -direction : direction;
  el.gameCard.classList.add("animating");
  el.gameCard.style.transform =
    `translateX(${displayDirection * window.innerWidth * 1.15}px) ` +
    `rotate(${displayDirection * 10}deg)`;
  el.gameCard.style.opacity = "0";
  window.setTimeout(onComplete, SWIPE_ANIMATION_MS);
}

function setGuide(guide, result) {
  guide.dataset.result = result;
  guide.classList.toggle("guide-valid", result === "valid");
  guide.classList.toggle("guide-pass", result === "pass");
  guide.querySelector(".guide-word").textContent = result === "valid" ? "VALIDÉE" : "PASSÉE";
}

export function syncSwipeGuides() {
  setGuide(el.leftSwipeGuide, state.flipped ? "valid" : "pass");
  setGuide(el.rightSwipeGuide, state.flipped ? "pass" : "valid");
}

export function setFlipped(value) {
  state.flipped = value;
  el.app.classList.toggle("flipped", value);
  writeTextStorage("mdb-flipped", value ? "1" : "0");
  syncSwipeGuides();
}

export function toggleFlipped() {
  setFlipped(!state.flipped);
}

function onPointerDown(event) {
  if (!state.running || state.paused || event.button !== 0) return;
  if (event.target.closest("button")) return;
  state.pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY
  };
  el.gameCard.setPointerCapture?.(event.pointerId);
  el.gameCard.classList.remove("animating");
}

function onPointerMove(event) {
  if (!state.pointer || event.pointerId !== state.pointer.id || !state.running || state.paused) return;
  const rawDx = event.clientX - state.pointer.startX;
  const dy = event.clientY - state.pointer.startY;
  state.pointer.currentX = event.clientX;
  state.pointer.currentY = event.clientY;

  const horizontalEnough = Math.abs(rawDx) >= Math.abs(dy) * 0.65;
  if (!horizontalEnough && Math.abs(dy) > 28) {
    resetCardPosition();
    return;
  }

  const displayDx = state.flipped ? -rawDx : rawDx;
  const threshold = getSwipeThreshold();
  const progress = Math.min(1, Math.abs(rawDx) / threshold);
  el.gameCard.style.transform = `translateX(${displayDx}px) rotate(${displayDx / 45}deg)`;
  el.gameCard.style.opacity = String(1 - progress * 0.18);
  el.gameCard.classList.remove("swiping-valid", "swiping-pass");
  el.gameCard.style.setProperty("--swipe-tint", String(0.07 + progress * 0.43));
  if (rawDx > 0) el.gameCard.classList.add("swiping-valid");
  else if (rawDx < 0) el.gameCard.classList.add("swiping-pass");
}

function onPointerEnd(event) {
  if (!state.pointer || event.pointerId !== state.pointer.id) return;
  const rawDx = state.pointer.currentX - state.pointer.startX;
  const dy = state.pointer.currentY - state.pointer.startY;
  const threshold = getSwipeThreshold();
  const horizontalEnough = Math.abs(rawDx) >= Math.abs(dy) * 0.65;
  state.pointer = null;

  if (!state.running || state.paused) {
    resetCardPosition();
    return;
  }
  if (horizontalEnough && rawDx >= threshold) onSwipe?.("valid");
  else if (horizontalEnough && rawDx <= -threshold) onSwipe?.("pass");
  else resetCardPosition();
}
