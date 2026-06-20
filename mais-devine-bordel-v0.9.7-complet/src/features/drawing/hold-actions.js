import { DRAW_HOLD_MS } from "../../config/config.js";
import { el } from "../../core/dom.js";
import { state } from "../../core/state.js";

export function resetDrawHoldButtons() {
  [el.drawFoundButton, el.drawPassButton].forEach(button => {
    button.classList.remove("holding", "hold-complete");
    button.style.removeProperty("--hold-duration");
  });
}

export function initializeHoldActions({ onFound, onPass }) {
  attachHoldAction(el.drawFoundButton, onFound);
  attachHoldAction(el.drawPassButton, onPass);
}

function attachHoldAction(button, action) {
  let timer = 0;
  let activePointer = null;
  let fired = false;
  let pointerInside = false;

  const clearVisualState = () => {
    button.classList.remove("holding", "hold-complete");
    button.style.removeProperty("--hold-duration");
  };

  const cancel = event => {
    window.clearTimeout(timer);
    timer = 0;
    if (event?.pointerId !== undefined && button.hasPointerCapture?.(event.pointerId)) {
      button.releasePointerCapture?.(event.pointerId);
    }
    activePointer = null;
    pointerInside = false;
    fired = false;
    clearVisualState();
  };

  const isInsideButton = event => {
    if (event?.clientX === undefined || event?.clientY === undefined) return true;
    const rect = button.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
  };

  const begin = event => {
    if (button.disabled || !state.drawRound?.currentCard) return;
    event.preventDefault();
    cancel();
    fired = false;
    pointerInside = true;
    activePointer = event.pointerId ?? "keyboard";
    if (event.pointerId !== undefined) button.setPointerCapture?.(event.pointerId);
    button.style.setProperty("--hold-duration", `${DRAW_HOLD_MS}ms`);
    button.classList.add("holding");
    timer = window.setTimeout(() => {
      if (!pointerInside || activePointer === null) return;
      fired = true;
      button.classList.remove("holding");
      button.classList.add("hold-complete");
      if (state.settings.vibrationEnabled && "vibrate" in navigator) navigator.vibrate(28);
      action();
      activePointer = null;
      pointerInside = false;
      window.setTimeout(clearVisualState, 120);
    }, DRAW_HOLD_MS);
  };

  const move = event => {
    if (activePointer === null) return;
    if (event.pointerId !== undefined && activePointer !== event.pointerId) return;
    pointerInside = isInsideButton(event);
    if (!pointerInside && !fired) cancel(event);
  };

  const end = event => {
    if (activePointer === null) return;
    if (event?.pointerId !== undefined && activePointer !== event.pointerId) return;
    if (!fired || !isInsideButton(event)) cancel(event);
  };

  button.addEventListener("pointerdown", begin);
  button.addEventListener("pointermove", move);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("lostpointercapture", () => {
    if (!fired) cancel();
  });
  button.addEventListener("contextmenu", event => event.preventDefault());
  button.addEventListener("click", event => event.preventDefault());
  button.addEventListener("keydown", event => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) begin(event);
  });
  button.addEventListener("keyup", event => {
    if (event.key === " " || event.key === "Enter") end(event);
  });
}
