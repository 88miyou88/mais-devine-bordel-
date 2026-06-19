import { el } from "../../core/dom.js";
import { state } from "../../core/state.js";

const DRAW_ERASER_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7.5 17.5-4-4a2 2 0 0 1 0-2.8l7.2-7.2a2 2 0 0 1 2.8 0l7 7a2 2 0 0 1 0 2.8l-4.2 4.2H7.5Z"/>
    <path d="m10 7 7 7M7.5 17.5h12"/>
  </svg>`;

const DRAW_PENCIL_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/>
    <path d="m13.8 7.2 3 3M5.5 16.5l2 2"/>
  </svg>`;

export function initializeDrawingCanvas() {
  el.drawColorChoices.querySelectorAll(".draw-color").forEach(button => {
    button.addEventListener("click", () => chooseDrawColor(button.dataset.color));
  });
  el.drawBrushSize.addEventListener("input", () => {
    if (state.drawRound) state.drawRound.size = Number(el.drawBrushSize.value);
  });
  el.drawEraserButton.addEventListener("click", toggleDrawEraser);
  el.drawUndoButton.addEventListener("click", undoDrawingStroke);
  el.drawClearButton.addEventListener("click", clearDrawingCanvas);
  el.drawingCanvas.addEventListener("pointerdown", onDrawPointerDown);
  el.drawingCanvas.addEventListener("pointermove", onDrawPointerMove);
  el.drawingCanvas.addEventListener("pointerup", onDrawPointerEnd);
  el.drawingCanvas.addEventListener("pointercancel", onDrawPointerEnd);
  window.addEventListener("resize", () => {
    if (state.drawRound?.support === "phone") resizeDrawingCanvas(false);
  });
  updateDrawToolButton();
}

export function resizeDrawingCanvas(clear = false) {
  const canvas = el.drawingCanvas;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const round = state.drawRound;
  if (round) {
    round.canvasWidth = rect.width;
    round.canvasHeight = rect.height;
    if (clear) {
      round.strokes = [];
      round.undoActions = [];
    }
  }
  redrawDrawingCanvas();
}

function redrawDrawingCanvas() {
  const canvas = el.drawingCanvas;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, rect.width, rect.height);
  (state.drawRound?.strokes || []).forEach(stroke => drawStroke(context, stroke));
}

function drawStroke(context, stroke) {
  if (!stroke.points.length) return;
  context.save();
  context.strokeStyle = stroke.eraser ? "#ffffff" : stroke.color;
  context.fillStyle = context.strokeStyle;
  context.lineWidth = stroke.size;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    context.beginPath();
    context.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach(point => context.lineTo(point.x, point.y));
    context.stroke();
  }
  context.restore();
}

function drawingPoint(event) {
  const rect = el.drawingCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function onDrawPointerDown(event) {
  if (!state.drawRound || state.drawRound.support !== "phone") return;
  event.preventDefault();
  const round = state.drawRound;
  round.currentStroke = {
    color: round.color,
    size: round.size,
    eraser: round.eraser,
    points: [drawingPoint(event)]
  };
  round.strokes.push(round.currentStroke);
  round.undoActions.push({ type: "stroke", stroke: round.currentStroke });
  state.drawPointer = event.pointerId;
  el.drawingCanvas.setPointerCapture?.(event.pointerId);
  redrawDrawingCanvas();
}

function onDrawPointerMove(event) {
  if (state.drawPointer !== event.pointerId || !state.drawRound?.currentStroke) return;
  event.preventDefault();
  state.drawRound.currentStroke.points.push(drawingPoint(event));
  redrawDrawingCanvas();
}

function onDrawPointerEnd(event) {
  if (state.drawPointer !== event.pointerId) return;
  state.drawPointer = null;
  if (state.drawRound) state.drawRound.currentStroke = null;
}

export function updateDrawToolButton() {
  const erasing = Boolean(state.drawRound?.eraser);
  el.drawEraserButton.classList.toggle("active", erasing);
  el.drawToolIcon.innerHTML = erasing ? DRAW_PENCIL_ICON : DRAW_ERASER_ICON;
  el.drawEraserButton.setAttribute("aria-label", erasing ? "Repasser au crayon" : "Passer à la gomme");
  el.drawEraserButton.title = erasing ? "Crayon" : "Gomme";
}

function chooseDrawColor(color) {
  const round = state.drawRound;
  if (!round) return;
  round.color = color;
  round.eraser = false;
  updateDrawToolButton();
  el.drawColorChoices.querySelectorAll(".draw-color").forEach(button => {
    button.classList.toggle("selected", button.dataset.color === color);
  });
}

function toggleDrawEraser() {
  if (!state.drawRound) return;
  state.drawRound.eraser = !state.drawRound.eraser;
  updateDrawToolButton();
}

function undoDrawingStroke() {
  const round = state.drawRound;
  if (!round?.undoActions.length) return;
  const action = round.undoActions.pop();
  if (action.type === "stroke") {
    const index = round.strokes.lastIndexOf(action.stroke);
    if (index >= 0) round.strokes.splice(index, 1);
  } else if (action.type === "clear") {
    round.strokes = action.strokes;
  }
  redrawDrawingCanvas();
}

function clearDrawingCanvas() {
  const round = state.drawRound;
  if (!round?.strokes.length) return;
  round.undoActions.push({ type: "clear", strokes: [...round.strokes] });
  round.strokes = [];
  redrawDrawingCanvas();
}
