import { DIFFICULTY_LABELS } from "../../config/config.js";
import { el } from "../../core/dom.js";
import { state } from "../../core/state.js";
import { getBoxName, modeConfig } from "../../services/libraries.js";

export function resetResultLabels() {
  el.resultValidLabel.textContent = "validées";
  el.resultPassedLabel.textContent = "passées";
  el.resultTotalLabel.textContent = "jouées";
}

export function renderGameResults(reason) {
  resetResultLabels();
  el.resultValid.textContent = String(state.valid);
  el.resultPassed.textContent = String(state.passed);
  el.resultTotal.textContent = String(state.history.length);
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

  state.history.forEach(entry => {
    const card = entry.card;
    const config = modeConfig(card.modeId);
    const row = document.createElement("div");
    row.className = `result-row ${entry.result === "valid" ? "valid" : "passed"}`;
    const status = document.createElement("span");
    status.className = "status";
    status.textContent = entry.result === "valid" ? "✓" : "✕";
    const details = document.createElement("div");
    details.className = "details";
    const title = document.createElement("strong");
    const source = document.createElement("small");

    if (config.type === "lyrics") {
      title.textContent = card.title;
      source.textContent = `${config.name} · ${card.source}`;
    } else {
      title.textContent = card.prompt;
      source.textContent = `${config.name} · ${getBoxName(card.modeId, card.boxId)} · ${DIFFICULTY_LABELS[card.difficulty]}`;
    }

    details.append(title, source);
    const word = document.createElement("span");
    word.className = "result-word";
    word.textContent = entry.result === "valid" ? "VALIDÉE" : "PASSÉE";
    row.append(status, details, word);
    el.resultDetails.append(row);
  });
}
