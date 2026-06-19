import { el } from "../../core/dom.js";

export function displayDrawingSupport(support) {
  el.drawCanvasArea.classList.toggle("hidden", support !== "phone");
  el.drawPaperArea.classList.toggle("hidden", support !== "paper");
  el.drawColorChoices.classList.toggle("hidden", support !== "phone");
  el.drawToolsPanel.classList.toggle("hidden", support !== "phone");
  el.drawPlayScreen.classList.toggle("draw-paper-mode", support === "paper");
}
