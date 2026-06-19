import { UNCATEGORIZED_ID } from "../../config/config.js";
import { el } from "../../core/dom.js";
import { modeState, state } from "../../core/state.js";
import { clone, normalizeDifficulty, uniqueId } from "../../core/utils.js";
import { modeConfig, saveMode } from "../../services/libraries.js";

let onChanged = null;

export function initializeCardEditor(callback) {
  onChanged = callback;
  el.cardForm.addEventListener("submit", saveCard);
  el.closeCardDialogButton.addEventListener("click", closeCardEditor);
  el.cancelCardButton.addEventListener("click", closeCardEditor);
}

function populateBoxSelect(modeId, selectedId) {
  const mode = modeState(modeId);
  el.cardBoxInput.innerHTML = "";
  mode.boxes.forEach(box => {
    const option = document.createElement("option");
    option.value = box.id;
    option.textContent = box.name;
    el.cardBoxInput.append(option);
  });
  el.cardBoxInput.value = mode.boxes.some(box => box.id === selectedId)
    ? selectedId
    : UNCATEGORIZED_ID;
}

export function openCardEditor(modeId, cardId = null) {
  const config = modeConfig(modeId);
  const mode = modeState(modeId);
  const card = cardId ? mode.cards.find(item => item.id === cardId) : null;

  el.cardDialogTitle.textContent = `${card ? "Modifier" : "Ajouter"} — ${config.name}`;
  el.cardIdInput.value = card?.id || "";
  el.cardModeInput.value = modeId;
  el.cardActiveInput.checked = card?.active !== false;
  el.cardDifficultyInput.value = normalizeDifficulty(card?.difficulty, modeId, card || {});
  [...el.cardDifficultyInput.options].forEach(option => {
    option.textContent = config.difficultyLabels?.[option.value] || ({ easy: "Facile", medium: "Moyen", hard: "Difficile" }[option.value]);
  });
  el.lyricsEditorFields.classList.toggle("hidden", config.type !== "lyrics");
  el.mimeEditorFields.classList.toggle("hidden", !["mime", "draw", "drinking"].includes(config.type));
  el.wordsEditorFields.classList.toggle("hidden", config.type !== "words");

  if (config.type === "lyrics") {
    el.cardPromptInput.value = card?.prompt || "";
    el.cardAnswerInput.value = card?.answer || "";
    el.cardTitleInput.value = card?.title || "";
    el.cardSourceInput.value = card?.source || "";
  } else if (config.type === "words") {
    el.wordPromptInput.value = card?.prompt || "";
    el.forbiddenWordsInput.value = (card?.forbiddenWords || []).join(", ");
  } else {
    el.simplePromptLabel.textContent = config.type === "draw"
      ? "Consigne à dessiner"
      : config.type === "drinking" ? "Question ou consigne" : "Consigne à mimer";
    el.mimePromptInput.placeholder = config.type === "draw"
      ? "Un cactus portant des moufles"
      : config.type === "drinking" ? "[prénom d'un joueur], raconte ton pire mensonge ridicule." : "Un pigeon qui vole une frite";
    el.mimePromptInput.value = card?.prompt || "";
  }

  populateBoxSelect(modeId, card?.boxId || mode.boxes[0]?.id || UNCATEGORIZED_ID);
  el.cardDialog.showModal();
  setTimeout(() => {
    if (config.type === "lyrics") el.cardPromptInput.focus();
    else if (config.type === "words") el.wordPromptInput.focus();
    else el.mimePromptInput.focus();
  }, 50);
}

function closeCardEditor() {
  el.cardDialog.close();
}

function cardForDefaults(mode, id) {
  return id ? mode.cards.find(card => card.id === id) : null;
}

function saveCard(event) {
  event.preventDefault();
  const modeId = el.cardModeInput.value;
  const config = modeConfig(modeId);
  const mode = modeState(modeId);
  const common = {
    difficulty: el.cardDifficultyInput.value,
    boxId: el.cardBoxInput.value,
    active: el.cardActiveInput.checked
  };
  let data;

  if (config.type === "lyrics") {
    data = {
      ...common,
      prompt: el.cardPromptInput.value.trim(),
      answer: el.cardAnswerInput.value.trim(),
      title: el.cardTitleInput.value.trim(),
      source: el.cardSourceInput.value.trim()
    };
    if (!data.prompt || !data.answer || !data.title || !data.source) {
      alert("Remplis tous les champs de la carte.");
      return;
    }
  } else if (config.type === "words") {
    data = {
      ...common,
      prompt: el.wordPromptInput.value.trim(),
      forbiddenWords: el.forbiddenWordsInput.value
        .split(/[,;\n]+/)
        .map(word => word.trim())
        .filter(Boolean)
    };
    if (!data.prompt) {
      alert("Écris le mot ou l’expression à faire deviner.");
      return;
    }
  } else {
    data = { ...common, prompt: el.mimePromptInput.value.trim() };
    if (config.type === "drinking") {
      data = {
        ...data,
        mechanic: cardForDefaults(mode, el.cardIdInput.value)?.mechanic || "manual",
        targetType: cardForDefaults(mode, el.cardIdInput.value)?.targetType || "group_vote",
        penalty: cardForDefaults(mode, el.cardIdInput.value)?.penalty || { intensity: "medium", scoreMultiplier: 1 },
        resolution: cardForDefaults(mode, el.cardIdInput.value)?.resolution || { kind: "manual", supports: ["drink", "points", "tokens", "mini_challenge", "joker"] },
        durationSeconds: cardForDefaults(mode, el.cardIdInput.value)?.durationSeconds || null,
        ruleDurationCards: cardForDefaults(mode, el.cardIdInput.value)?.ruleDurationCards || null,
        adult: cardForDefaults(mode, el.cardIdInput.value)?.adult === true,
        minPlayers: cardForDefaults(mode, el.cardIdInput.value)?.minPlayers || 2
      };
    }
    if (!data.prompt) {
      alert(config.type === "draw" ? "Écris une consigne à dessiner." : config.type === "drinking" ? "Écris une question ou une consigne." : "Écris une consigne à mimer.");
      return;
    }
  }

  const id = el.cardIdInput.value;
  if (id) {
    const index = mode.cards.findIndex(card => card.id === id);
    if (index >= 0) mode.cards[index] = { ...mode.cards[index], ...data, locallyModified: true };
  } else {
    mode.cards.unshift({
      id: uniqueId(modeId),
      ...data,
      origin: "personal",
      locallyModified: true
    });
  }

  saveMode(modeId);
  closeCardEditor();
  onChanged?.();
}

export function duplicateCard(modeId, cardId) {
  const mode = modeState(modeId);
  const card = mode.cards.find(item => item.id === cardId);
  if (!card) return;
  const copy = {
    ...clone(card),
    id: uniqueId(modeId),
    origin: "personal",
    locallyModified: true
  };
  if (modeConfig(modeId).type === "lyrics") copy.title = `${card.title} — copie`;
  else copy.prompt = `${card.prompt} — copie`;
  mode.cards.unshift(copy);
  saveMode(modeId);
  onChanged?.();
}

export function toggleCard(modeId, cardId) {
  const mode = modeState(modeId);
  const card = mode.cards.find(item => item.id === cardId);
  if (!card) return;
  card.active = !card.active;
  card.locallyModified = true;
  saveMode(modeId);
  onChanged?.();
}

export function deleteCard(modeId, cardId) {
  const mode = modeState(modeId);
  const card = mode.cards.find(item => item.id === cardId);
  if (!card) return;
  const label = modeConfig(modeId).type === "lyrics" ? card.title : card.prompt;
  if (!confirm(`Supprimer définitivement « ${label} » ?`)) return;
  if (card.origin === "official" && !mode.libraryMeta.deletedOfficialCardIds.includes(card.id)) {
    mode.libraryMeta.deletedOfficialCardIds.push(card.id);
  }
  mode.cards = mode.cards.filter(item => item.id !== cardId);
  saveMode(modeId);
  onChanged?.();
}
