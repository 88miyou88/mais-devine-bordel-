import { DIFFICULTY_LABELS, MODE_ORDER } from "../../config/config.js";
import { createActionButton, el, showScreen } from "../../core/dom.js";
import { modeState, state } from "../../core/state.js";
import { getBoxName, modeConfig } from "../../services/libraries.js";
import {
  deleteCard,
  duplicateCard,
  initializeCardEditor,
  openCardEditor,
  toggleCard
} from "./card-editor.js";
import { initializeCategoryManager, openBoxesManager } from "./category-manager.js";

let onHomeDataChanged = null;

function renderManageModeTabs() {
  el.manageModeTabs.innerHTML = "";
  MODE_ORDER.forEach(modeId => {
    const config = modeConfig(modeId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mode-tab${state.activeManageModeId === modeId ? " selected" : ""}`;
    button.style.setProperty("--mode-color", config.color);
    button.textContent = config.name;
    button.addEventListener("click", () => {
      state.activeManageModeId = modeId;
      el.cardSearchInput.value = "";
      renderManageScreen();
    });
    el.manageModeTabs.append(button);
  });
}

function renderManageFilters() {
  const mode = modeState(state.activeManageModeId);
  const current = el.manageBoxFilter.value || "all";
  el.manageBoxFilter.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "Toutes les boîtes";
  el.manageBoxFilter.append(all);
  mode.boxes.forEach(box => {
    const option = document.createElement("option");
    option.value = box.id;
    option.textContent = box.name;
    el.manageBoxFilter.append(option);
  });
  el.manageBoxFilter.value = [...el.manageBoxFilter.options].some(option => option.value === current)
    ? current
    : "all";
}

function getFilteredCards() {
  const modeId = state.activeManageModeId;
  const mode = modeState(modeId);
  const search = el.cardSearchInput.value.trim().toLocaleLowerCase("fr");
  const boxId = el.manageBoxFilter.value;
  return mode.cards.filter(card => {
    if (boxId !== "all" && card.boxId !== boxId) return false;
    if (!search) return true;
    const config = modeConfig(modeId);
    let values;
    if (config.type === "lyrics") values = [card.prompt, card.answer, card.title, card.source];
    else if (config.type === "words") values = [card.prompt, ...(card.forbiddenWords || [])];
    else values = [card.prompt];
    values.push(DIFFICULTY_LABELS[card.difficulty], getBoxName(modeId, card.boxId));
    return values.join(" ").toLocaleLowerCase("fr").includes(search);
  });
}

export function renderManageScreen() {
  renderManageModeTabs();
  renderManageFilters();
  renderCardList();
}

function renderCardList() {
  const modeId = state.activeManageModeId;
  const config = modeConfig(modeId);
  const mode = modeState(modeId);
  const cards = getFilteredCards();
  const activeTotal = mode.cards.filter(card => card.active).length;
  el.cardSearchInput.placeholder = config.type === "lyrics"
    ? "Rechercher une chanson, un artiste…"
    : config.type === "words"
      ? "Rechercher un mot ou un interdit…"
      : config.type === "draw"
        ? "Rechercher une consigne à dessiner…"
        : "Rechercher une consigne de mime…";
  el.manageStats.textContent = `${mode.cards.length} carte${mode.cards.length > 1 ? "s" : ""} · ` +
    `${activeTotal} active${activeTotal > 1 ? "s" : ""} · ` +
    `${cards.length} affichée${cards.length > 1 ? "s" : ""}`;
  el.cardList.innerHTML = "";

  if (cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "Aucune carte ne correspond à ce filtre.";
    el.cardList.append(empty);
    return;
  }

  cards.forEach(card => {
    const row = document.createElement("article");
    row.className = `manage-card-row${card.active ? "" : " inactive"}`;
    const main = document.createElement("div");
    main.className = "manage-card-main";
    const title = document.createElement("strong");
    const subtitle = document.createElement("span");
    if (config.type === "lyrics") {
      title.textContent = card.title;
      subtitle.textContent = `${card.prompt} … ${card.answer}`;
    } else if (config.type === "words") {
      title.textContent = card.prompt;
      subtitle.className = "forbidden-preview";
      subtitle.textContent = `Interdits : ${(card.forbiddenWords || []).join(", ") || "aucun"}`;
    } else {
      title.textContent = card.prompt;
      subtitle.textContent = config.name;
    }

    const badges = document.createElement("div");
    badges.className = "card-badges";
    const boxBadge = document.createElement("span");
    boxBadge.className = "box-badge";
    boxBadge.textContent = getBoxName(modeId, card.boxId);
    const difficulty = document.createElement("span");
    difficulty.className = `difficulty-badge ${card.difficulty}`;
    difficulty.textContent = DIFFICULTY_LABELS[card.difficulty];
    badges.append(boxBadge, difficulty);
    main.append(title, subtitle, badges);

    const actions = document.createElement("div");
    actions.className = "manage-card-actions";
    actions.append(
      createActionButton("Modifier", () => openCardEditor(modeId, card.id)),
      createActionButton("Dupliquer", () => duplicateCard(modeId, card.id)),
      createActionButton(card.active ? "Désactiver" : "Activer", () => toggleCard(modeId, card.id)),
      createActionButton("Supprimer", () => deleteCard(modeId, card.id), true)
    );
    row.append(main, actions);
    el.cardList.append(row);
  });
}

function handleChanged() {
  renderManageScreen();
  onHomeDataChanged?.();
}

export function openManageScreen() {
  renderManageScreen();
  showScreen(el.manageScreen);
}

function closeManageScreen() {
  onHomeDataChanged?.();
  showScreen(el.homeScreen);
}

export function initializeCardManager(callbacks = {}) {
  onHomeDataChanged = callbacks.onHomeDataChanged || null;
  initializeCardEditor(handleChanged);
  initializeCategoryManager(handleChanged);
  el.manageBackButton.addEventListener("click", closeManageScreen);
  el.cardSearchInput.addEventListener("input", renderCardList);
  el.manageBoxFilter.addEventListener("change", renderCardList);
  el.addCardButton.addEventListener("click", () => openCardEditor(state.activeManageModeId));
  el.manageBoxesButton.addEventListener("click", openBoxesManager);
}
