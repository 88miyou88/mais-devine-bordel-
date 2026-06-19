import { SWIPE_ANIMATION_MS } from "../../config/config.js";
import { el, getSwipeThreshold } from "../../core/dom.js";

const TAP_SLOP = 12;
const SWIPEABLE_TAP_SELECTOR = "[data-swipe-tap]";
const BLOCKING_CONTROL_SELECTOR = "button:not([data-swipe-tap]), input, select, label, dialog";

let callbacks = {};
let pointer = null;
let locked = false;
let suppressedTapTarget = null;
let suppressTapUntil = 0;

function resetCard() {
  el.drinkingCard.classList.remove("drinking-swiping-left", "drinking-swiping-right", "drinking-swipe-animating");
  el.drinkingCard.style.removeProperty("--drinking-swipe-progress");
  el.drinkingCard.style.transform = "";
  el.drinkingCard.style.opacity = "1";
  locked = false;
}

function suppressTap(target) {
  if (!target) return;
  suppressedTapTarget = target;
  suppressTapUntil = performance.now() + 550;
}

function onClickCapture(event) {
  if (performance.now() > suppressTapUntil) return;
  const tapTarget = event.target.closest(SWIPEABLE_TAP_SELECTOR);
  if (!tapTarget || tapTarget !== suppressedTapTarget) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  suppressedTapTarget = null;
  suppressTapUntil = 0;
}

export function updateDrinkingSwipeLabels(leftLabel, rightLabel) {
  el.drinkingSwipeLeftLabel.textContent = leftLabel || "NON";
  el.drinkingSwipeRightLabel.textContent = rightLabel || "OUI";
}

function onPointerDown(event) {
  if (locked || event.button !== 0 || event.target.closest(BLOCKING_CONTROL_SELECTOR)) return;
  const tapTarget = event.target.closest(SWIPEABLE_TAP_SELECTOR);
  pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    tapTarget,
    dragging: false,
    captured: false
  };
  if (!tapTarget) {
    el.drinkingCard.setPointerCapture?.(event.pointerId);
    pointer.captured = true;
  }
}

function beginHorizontalDrag(event) {
  if (!pointer || pointer.dragging) return;
  pointer.dragging = true;
  suppressTap(pointer.tapTarget);
  if (!pointer.captured) {
    el.drinkingCard.setPointerCapture?.(event.pointerId);
    pointer.captured = true;
  }
}

function onPointerMove(event) {
  if (!pointer || event.pointerId !== pointer.id || locked) return;
  const dx = event.clientX - pointer.startX;
  const dy = event.clientY - pointer.startY;
  pointer.currentX = event.clientX;
  pointer.currentY = event.clientY;

  const horizontalIntent = Math.abs(dx) > TAP_SLOP && Math.abs(dx) >= Math.abs(dy) * 1.05;
  if (horizontalIntent) beginHorizontalDrag(event);

  if (!pointer.dragging && Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx)) {
    suppressTap(pointer.tapTarget);
    resetCard();
    pointer = null;
    return;
  }
  if (!pointer.dragging) return;

  event.preventDefault();
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
  const wasDragging = pointer.dragging;
  const tapTarget = pointer.tapTarget;
  pointer = null;
  const horizontalEnough = Math.abs(dx) >= Math.abs(dy) * 0.65;
  const threshold = getSwipeThreshold();
  if (wasDragging) suppressTap(tapTarget);
  if (wasDragging && horizontalEnough && dx >= threshold) animateAndRun("right");
  else if (wasDragging && horizontalEnough && dx <= -threshold) animateAndRun("left");
  else resetCard();
}

function onPointerCancel() {
  suppressTap(pointer?.tapTarget);
  pointer = null;
  resetCard();
}

export function resetDrinkingSwipe() {
  pointer = null;
  resetCard();
}

export function initializeDrinkingSwipe(options = {}) {
  callbacks = options;
  el.drinkingCard.addEventListener("click", onClickCapture, true);
  el.drinkingCard.addEventListener("pointerdown", onPointerDown);
  el.drinkingCard.addEventListener("pointermove", onPointerMove);
  el.drinkingCard.addEventListener("pointerup", onPointerEnd);
  el.drinkingCard.addEventListener("pointercancel", onPointerCancel);
}
