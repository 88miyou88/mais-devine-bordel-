import { DIFFICULTY_LABELS } from "../../config/config.js";
import { el } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { getBoxName, modeConfig } from "../../services/libraries.js";

export function resetResultLabels() {
  el.resultValidLabel.textContent = "validées";
  el.resultPassedLabel.textContent = "passées";
  el.resultTotalLabel.textContent = "jouées";
  el.resultBreakdown.classList.add("hidden");
  el.resultBreakdown.innerHTML = "";
}

function addBreakdownItem(label, value, tone = "") {
  const item = document.createElement("div");
  item.className = `result-breakdown-item${tone ? ` ${tone}` : ""}`;
  const strong = document.createElement("strong");
  strong.textContent = String(value);
  const span = document.createElement("span");
  span.textContent = label;
  item.append(strong, span);
  el.resultBreakdown.append(item);
}

function renderMixedBreakdown() {
  const drawing = state.mixedDrawing;
  if (!drawing) return;
  el.resultBreakdown.classList.remove("hidden");
  addBreakdownItem("cartes validées", state.valid, "positive");
  addBreakdownItem("cartes passées", state.passed, "negative");
  addBreakdownItem("dessins trouvés", drawing.found, "draw");
  addBreakdownItem("dessins passés", drawing.passed, "negative");
  addBreakdownItem("dessins expirés", drawing.expired, "negative");
  addBreakdownItem("points dessin", drawing.points, "draw");
  addBreakdownItem("pénalité totale", `−${Math.round(drawing.totalPenaltyMs / 1000)} s`, "neutral");
  if (drawing.skippedForTime) {
    addBreakdownItem("non déclenchés faute de temps", drawing.skippedForTime, "neutral");
  }
  if (drawing.cancelledCount) {
    addBreakdownItem("non joués après fin manuelle", drawing.cancelledCount, "neutral");
  }
}

function createResultRow(entry) {
  const card = entry.card;
  const isDrawing = entry.kind === "draw";
  const valid = entry.result === "valid";
  const row = document.createElement("div");
  row.className = `result-row ${valid ? "valid" : "passed"}${isDrawing ? " drawing" : ""}`;

  const status = document.createElement("span");
  status.className = "status";
  status.textContent = valid ? "✓" : entry.result === "expired" ? "⌛" : "✕";

  const details = document.createElement("div");
  details.className = "details";
  const title = document.createElement("strong");
  const source = document.createElement("small");

  if (isDrawing) {
    title.textContent = card.prompt;
    const seconds = (entry.usedMs / 1000).toFixed(1).replace(".0", "");
    const support = entry.support === "phone" ? "téléphone" : entry.support === "paper" ? "papier" : "passé avant dessin";
    source.textContent = `Dessin · ${DIFFICULTY_LABELS[card.difficulty]} · ${entry.points} pt · ${seconds} s · ${support} · −${entry.penaltySeconds} s`;
  } else {
    const config = modeConfig(card.modeId);
    if (config.type === "lyrics") {
      title.textContent = card.title;
      source.textContent = `${config.name} · ${card.source}`;
    } else {
      title.textContent = card.prompt;
      source.textContent = `${config.name} · ${getBoxName(card.modeId, card.boxId)} · ${DIFFICULTY_LABELS[card.difficulty]}`;
    }
  }

  details.append(title, source);
  const word = document.createElement("span");
  word.className = "result-word";
  if (isDrawing) {
    word.textContent = valid ? "TROUVÉ" : entry.result === "expired" ? "EXPIRÉ" : "PASSÉ";
  } else {
    word.textContent = valid ? "VALIDÉE" : "PASSÉE";
  }
  row.append(status, details, word);
  return row;
}

export function renderGameResults(reason) {
  resetResultLabels();
  const mixed = Boolean(state.mixedDrawing);
  if (mixed) {
    const drawing = state.mixedDrawing;
    el.resultValid.textContent = String(state.score);
    el.resultPassed.textContent = String(state.valid + drawing.found);
    el.resultTotal.textContent = String(state.history.length);
    el.resultValidLabel.textContent = "points";
    el.resultPassedLabel.textContent = "réussites";
    el.resultTotalLabel.textContent = "jouées";
    renderMixedBreakdown();
  } else {
    el.resultValid.textContent = String(state.valid);
    el.resultPassed.textContent = String(state.passed);
    el.resultTotal.textContent = String(state.history.length);
  }
  el.resultDetails.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("p");
    empty.style.padding = "18px";
    empty.style.margin = "0";
    empty.style.color = "var(--muted)";
    empty.textContent = reason === "time"
      ? "Le temps est écoulé avant la première réponse."
      : "Aucune carte jouée.";
    el.resultDetails.append(empty);
    return;
  }

  state.history.forEach(entry => el.resultDetails.append(createResultRow(entry)));
}
