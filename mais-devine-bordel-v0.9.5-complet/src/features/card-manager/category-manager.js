import { UNCATEGORIZED_ID } from "../../config/config.js";
import { createActionButton, el } from "../../core/dom.js";
import { modeState, state } from "../../core/state.js";
import { uniqueId } from "../../core/utils.js";
import { modeConfig, saveMode } from "../../services/libraries.js";

let onChanged = null;

export function initializeCategoryManager(callback) {
  onChanged = callback;
  el.closeBoxesDialogButton.addEventListener("click", closeBoxesManager);
  el.doneBoxesButton.addEventListener("click", closeBoxesManager);
  el.addBoxButton.addEventListener("click", addBox);
  el.newBoxNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addBox();
    }
  });
}

export function openBoxesManager() {
  const config = modeConfig(state.activeManageModeId);
  el.boxesDialogTitle.textContent = `Boîtes — ${config.name}`;
  el.newBoxNameInput.value = "";
  renderBoxesList();
  el.boxesDialog.showModal();
}

function closeBoxesManager() {
  el.boxesDialog.close();
  onChanged?.();
}

function renderBoxesList() {
  const modeId = state.activeManageModeId;
  const mode = modeState(modeId);
  el.boxesList.innerHTML = "";
  mode.boxes.forEach(box => {
    const row = document.createElement("div");
    row.className = "box-row";
    const main = document.createElement("div");
    main.className = "box-row-main";
    const name = document.createElement("strong");
    name.textContent = box.name;
    const count = document.createElement("small");
    const cardCount = mode.cards.filter(card => card.boxId === box.id).length;
    count.textContent = `${cardCount} carte${cardCount > 1 ? "s" : ""}`;
    main.append(name, count);

    const actions = document.createElement("div");
    actions.className = "box-row-actions";
    actions.append(createActionButton("Renommer", () => renameBox(modeId, box.id)));
    if (!box.protected && box.id !== UNCATEGORIZED_ID) {
      actions.append(createActionButton("Supprimer", () => deleteBox(modeId, box.id), true));
    }
    row.append(main, actions);
    el.boxesList.append(row);
  });
}

function addBox() {
  const modeId = state.activeManageModeId;
  const mode = modeState(modeId);
  const name = el.newBoxNameInput.value.trim();
  if (!name) return;
  if (mode.boxes.some(box => box.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"))) {
    alert("Une boîte porte déjà ce nom.");
    return;
  }
  const box = {
    id: uniqueId(`${modeId}-box`),
    name,
    origin: "personal",
    locallyModified: true
  };
  mode.boxes.splice(Math.max(0, mode.boxes.length - 1), 0, box);
  mode.selectedBoxIds.push(box.id);
  el.newBoxNameInput.value = "";
  saveMode(modeId);
  renderBoxesList();
  onChanged?.();
}

function renameBox(modeId, boxId) {
  const mode = modeState(modeId);
  const box = mode.boxes.find(item => item.id === boxId);
  if (!box) return;
  const name = prompt("Nouveau nom de la boîte :", box.name)?.trim();
  if (!name || name === box.name) return;
  if (mode.boxes.some(item =>
    item.id !== boxId && item.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr")
  )) {
    alert("Une autre boîte porte déjà ce nom.");
    return;
  }
  box.name = name;
  box.locallyModified = true;
  saveMode(modeId);
  renderBoxesList();
  onChanged?.();
}

function deleteBox(modeId, boxId) {
  const mode = modeState(modeId);
  const box = mode.boxes.find(item => item.id === boxId);
  if (!box || box.protected || boxId === UNCATEGORIZED_ID) return;
  const cardCount = mode.cards.filter(card => card.boxId === boxId).length;
  const message = cardCount
    ? `Supprimer « ${box.name} » ? Ses ${cardCount} carte${cardCount > 1 ? "s" : ""} seront déplacées dans « Sans catégorie ».`
    : `Supprimer la boîte « ${box.name} » ?`;
  if (!confirm(message)) return;

  mode.cards.forEach(card => {
    if (card.boxId === boxId) {
      card.boxId = UNCATEGORIZED_ID;
      card.locallyModified = true;
    }
  });
  if (box.origin === "official" && !mode.libraryMeta.deletedOfficialBoxIds.includes(box.id)) {
    mode.libraryMeta.deletedOfficialBoxIds.push(box.id);
  }
  mode.boxes = mode.boxes.filter(item => item.id !== boxId);
  mode.selectedBoxIds = mode.selectedBoxIds.filter(id => id !== boxId);
  if (!mode.selectedBoxIds.includes(UNCATEGORIZED_ID)) mode.selectedBoxIds.push(UNCATEGORIZED_ID);
  saveMode(modeId);
  renderBoxesList();
  onChanged?.();
}
