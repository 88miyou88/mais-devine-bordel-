import { SWIPE_ANIMATION_MS } from "../../config/config.js";
import { el, getSwipeThreshold } from "../../core/dom.js";

let callbacks = {};
let pointer = null;
let locked = false;

function resetCard() {
  el.drinkingCard.classList.remove("drinking-swiping-left", "drinking-swiping-right", "drinking-swipe-animating");
  el.drinkingCard.style.removeProperty("--drinking-swipe-progress");
  el.drinkingCard.style.transform = "";
  el.drinkingCard.style.opacity = "1";
  locked = false;
}

export function updateDrinkingSwipeLabels(leftLabel, rightLabel) {
  el.drinkingSwipeLeftLabel.textContent = leftLabel || "NON";
  el.drinkingSwipeRightLabel.textContent = rightLabel || "OUI";
}

function onPointerDown(event) {
  if (locked || event.button !== 0 || event.target.closest("button, input, select, label, dialog")) return;
  pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY
  };
  el.drinkingCard.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!pointer || event.pointerId !== pointer.id || locked) return;
  const dx = event.clientX - pointer.startX;
  const dy = event.clientY - pointer.startY;
  pointer.currentX = event.clientX;
  pointer.currentY = event.clientY;
  if (Math.abs(dy) > Math.abs(dx) / 0.65 && Math.abs(dy) > 28) {
    resetCard();
    pointer = null;
    return;
  }
  const progress = Math.min(1, Math.abs(dx) / getSwipeThreshold());
  el.drinkingCard.style.transform = `translateX(${dx}px) rotate(${dx / 55}deg)`;
  el.drinkingCard.style.opacity = String(1 - progress * 0.15);
  el.drinkingCard.style.setProperty("--drinking-swipe-progress", String(0.08 + progress * 0.46));
  el.drinkingCard.classList.toggle("drinking-swiping-left", dx < 0);
  el.drinkingCard.classList.toggle("drinking-swiping-right", dx > 0);
}

function animateAndRun(direction) {
  if (callbacks.canSwipe?.(direction) === false) {
    resetCard();
    return;
  }
  locked = true;
  el.drinkingCard.classList.remove("drinking-swiping-left", "drinking-swiping-right");
  el.drinkingCard.classList.add(direction === "right" ? "drinking-swiping-right" : "drinking-swiping-left");
  el.drinkingCard.style.setProperty("--drinking-swipe-progress", "0.58");
  el.drinkingCard.classList.add("drinking-swipe-animating");
  const sign = direction === "right" ? 1 : -1;
  el.drinkingCard.style.transform = `translateX(${sign * window.innerWidth * 1.12}px) rotate(${sign * 9}deg)`;
  el.drinkingCard.style.opacity = "0";
  window.setTimeout(() => {
    callbacks.onSwipe?.(direction);
    resetCard();
  }, SWIPE_ANIMATION_MS);
}

function onPointerEnd(event) {
  if (!pointer || event.pointerId !== pointer.id || locked) return;
  const dx = pointer.currentX - pointer.startX;
  const dy = pointer.currentY - pointer.startY;
  pointer = null;
  const horizontalEnough = Math.abs(dx) >= Math.abs(dy) * 0.65;
  const threshold = getSwipeThreshold();
  if (horizontalEnough && dx >= threshold) animateAndRun("right");
  else if (horizontalEnough && dx <= -threshold) animateAndRun("left");
  else resetCard();
}

export function resetDrinkingSwipe() {
  pointer = null;
  resetCard();
}

export function initializeDrinkingSwipe(options = {}) {
  callbacks = options;
  el.drinkingCard.addEventListener("pointerdown", onPointerDown);
  el.drinkingCard.addEventListener("pointermove", onPointerMove);
  el.drinkingCard.addEventListener("pointerup", onPointerEnd);
  el.drinkingCard.addEventListener("pointercancel", onPointerEnd);
}
