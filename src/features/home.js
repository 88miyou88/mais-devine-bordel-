import {
  DIFFICULTY_LABELS,
  MODE_ICONS,
  MODE_ORDER
} from "../config/config.js";
import { el } from "../core/dom.js";
import { modeState, recordError, state } from "../core/state.js";
import { formatDate } from "../core/utils.js";
import { getMixedDrawingPenaltySeconds } from "./drawing/mixed-drawing.js";
import { exportBackup, readBackupFile, restoreBackupData } from "../services/backup.js";
import { copyDiagnostic, openDiagnostic } from "../services/diagnostics.js";
import {
  activeCountForBox,
  checkLibraries,
  getPlayableCards,
  hasLibraryUpdate,
  modeConfig,
  resetLibraries,
  saveAllData,
  saveGlobalSettings,
  saveMode,
  selectedCardsForMode,
  updateLibraries
} from "../services/libraries.js";

let callbacks = {};

export function renderHomeData() {
  renderModeSelection();
  renderAdvancedSettings();
  el.vibrationToggle.checked = state.settings.vibrationEnabled;
  const multiplayer = state.settings.playType === "multiplayer";
  el.freePlayButton.classList.toggle("selected", !multiplayer);
  el.multiplayerPlayButton.classList.toggle("selected", multiplayer);
  el.freePlayButton.setAttribute("aria-pressed", String(!multiplayer));
  el.multiplayerPlayButton.setAttribute("aria-pressed", String(multiplayer));
  el.startButton.textContent = multiplayer ? "Configurer le multijoueur" : "Lancer la partie";
  const drawOnly = state.settings.selectedModeIds.length === 1 && state.settings.selectedModeIds[0] === "draw";
  el.globalTimerSettings.classList.toggle("hidden", drawOnly);
  el.homeScreen.classList.toggle("draw-only-home", drawOnly);
  const count = getPlayableCards().length;
  el.availableCount.textContent = `${count} carte${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`;
  el.startButton.disabled = count === 0;
}

function renderModeSelection() {
  el.modeSelectionList.innerHTML = "";
  el.modeSelectionList.style.setProperty("--mode-count", String(Math.max(1, MODE_ORDER.length)));
  MODE_ORDER.forEach(modeId => {
    const config = modeConfig(modeId);
    const selected = state.settings.selectedModeIds.includes(modeId);
    const playableCount = selectedCardsForMode(modeId).length;
    const tile = document.createElement("article");
    tile.className = `mode-app-tile${selected ? " selected" : ""}`;
    tile.style.setProperty("--mode-color", config.color);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "mode-tile-check";
    checkbox.checked = selected;
    checkbox.setAttribute("aria-label", `Inclure ${config.name}`);
    checkbox.addEventListener("click", event => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      setModeEnabled(modeId, checkbox.checked);
      renderHomeData();
    });

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "mode-tile-open";
    openButton.setAttribute("aria-label", `Configurer le mode ${config.name}`);
    openButton.addEventListener("click", () => openModeConfig(modeId));

    const icon = document.createElement("div");
    icon.className = "mode-tile-icon";
    icon.innerHTML = MODE_ICONS[config.icon] || "";
    const text = document.createElement("div");
    text.className = "mode-tile-text";
    const name = document.createElement("strong");
    name.textContent = config.name;
    const description = document.createElement("small");
    description.textContent = config.description;
    text.append(name, description);

    const footer = document.createElement("div");
    footer.className = "mode-tile-footer";
    const count = document.createElement("span");
    count.className = "mode-tile-count";
    count.textContent = `${playableCount} carte${playableCount > 1 ? "s" : ""}`;
    const arrow = document.createElement("span");
    arrow.className = "mode-tile-chevron";
    arrow.textContent = "Configurer ›";
    footer.append(count, arrow);
    openButton.append(icon, text, footer);
    tile.append(checkbox, openButton);
    el.modeSelectionList.append(tile);
  });
}


function setPlayType(playType) {
  state.settings.playType = playType === "multiplayer" ? "multiplayer" : "free";
  saveGlobalSettings();
  renderHomeData();
}

function setModeEnabled(modeId, enabled) {
  if (enabled) {
    if (!state.settings.selectedModeIds.includes(modeId)) state.settings.selectedModeIds.push(modeId);
  } else {
    state.settings.selectedModeIds = state.settings.selectedModeIds.filter(id => id !== modeId);
  }
  saveGlobalSettings();
}

function openModeConfig(modeId) {
  state.activeModeDialogId = modeId;
  renderModeConfigDialog();
  el.modeConfigDialog.showModal();
}

function closeModeConfig() {
  el.modeConfigDialog.close();
  state.activeModeDialogId = null;
  renderHomeData();
}

function updateModeDialogCount() {
  const modeId = state.activeModeDialogId;
  if (!modeId) return;
  const count = selectedCardsForMode(modeId).length;
  el.modeDialogCount.textContent = `${count} carte${count > 1 ? "s" : ""} sélectionnée${count > 1 ? "s" : ""}`;
}

function renderModeConfigDialog() {
  const modeId = state.activeModeDialogId;
  if (!modeId) return;
  const config = modeConfig(modeId);
  const mode = modeState(modeId);
  el.modeConfigDialog.style.setProperty("--mode-color", config.color);
  el.modeDialogIcon.innerHTML = MODE_ICONS[config.icon] || "";
  el.modeDialogTitle.textContent = config.name;
  el.modeDialogDescription.textContent = config.description;
  el.modeEnabledInput.checked = state.settings.selectedModeIds.includes(modeId);

  el.modeRulesList.innerHTML = "";
  config.rules.forEach(rule => {
    const item = document.createElement("li");
    item.textContent = rule;
    el.modeRulesList.append(item);
  });

  el.modeDifficultyChoices.innerHTML = "";
  ["easy", "medium", "hard"].forEach(difficulty => {
    const label = document.createElement("label");
    label.className = "difficulty-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = mode.selectedDifficultyIds.includes(difficulty);
    input.addEventListener("change", () => {
      if (input.checked) {
        if (!mode.selectedDifficultyIds.includes(difficulty)) mode.selectedDifficultyIds.push(difficulty);
      } else {
        mode.selectedDifficultyIds = mode.selectedDifficultyIds.filter(id => id !== difficulty);
      }
      saveMode(modeId);
      updateModeDialogCount();
      renderModeSelection();
    });
    const span = document.createElement("span");
    span.textContent = DIFFICULTY_LABELS[difficulty];
    label.append(input, span);
    el.modeDifficultyChoices.append(label);
  });

  el.wordsSpecialSettings.classList.toggle("hidden", config.type !== "words");
  el.showForbiddenWordsInput.checked = state.settings.modeOptions.words.showForbiddenWords;
  el.drawSpecialSettings.classList.toggle("hidden", config.type !== "draw");
  const drawOptions = state.settings.modeOptions.draw;
  el.drawAttemptCountInput.value = String(drawOptions.attemptCount);
  el.drawMixedCountInput.value = String(drawOptions.mixedCount);
  el.drawArrivalSoundEnabledInput.checked = drawOptions.arrivalSoundEnabled;
  updateDrawPenaltyPreview();
  el.drawEasySecondsInput.value = String(drawOptions.durations.easy);
  el.drawMediumSecondsInput.value = String(drawOptions.durations.medium);
  el.drawHardSecondsInput.value = String(drawOptions.durations.hard);
  el.drawSoundEnabledInput.checked = drawOptions.soundEnabled;

  el.modeBoxChoices.innerHTML = "";
  mode.boxes.forEach(box => {
    const label = document.createElement("label");
    label.className = "mode-dialog-box-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = mode.selectedBoxIds.includes(box.id);
    input.addEventListener("change", () => {
      if (input.checked) {
        if (!mode.selectedBoxIds.includes(box.id)) mode.selectedBoxIds.push(box.id);
      } else {
        mode.selectedBoxIds = mode.selectedBoxIds.filter(id => id !== box.id);
      }
      saveMode(modeId);
      updateModeDialogCount();
      renderModeSelection();
    });
    const name = document.createElement("span");
    name.textContent = box.name;
    const count = document.createElement("small");
    count.textContent = activeCountForBox(modeId, box.id);
    label.append(input, name, count);
    el.modeBoxChoices.append(label);
  });
  updateModeDialogCount();
}

function selectEverything() {
  state.settings.selectedModeIds = [...MODE_ORDER];
  MODE_ORDER.forEach(modeId => {
    const mode = modeState(modeId);
    mode.selectedBoxIds = mode.boxes.map(box => box.id);
    mode.selectedDifficultyIds = ["easy", "medium", "hard"];
  });
  saveAllData();
  renderHomeData();
}

function selectNothing() {
  state.settings.selectedModeIds = [];
  saveGlobalSettings();
  renderHomeData();
}

export function renderAdvancedSettings(message = "") {
  el.libraryVersionList.innerHTML = "";
  MODE_ORDER.forEach(modeId => {
    const config = modeConfig(modeId);
    const meta = modeState(modeId).libraryMeta;
    const row = document.createElement("div");
    row.className = "library-version-row";
    row.style.setProperty("--mode-color", config.color);
    const name = document.createElement("strong");
    name.textContent = config.name;
    const installed = document.createElement("span");
    installed.innerHTML = `Installée<br><code>${meta.installedVersion || "Inconnue"}</code>`;
    const available = document.createElement("span");
    available.innerHTML = `Disponible<br><code>${meta.availableVersion || "Inconnue"}</code>`;
    row.append(name, installed, available);
    el.libraryVersionList.append(row);
  });

  el.libraryLastChecked.textContent = `Dernière vérification : ${formatDate(state.settings.lastLibraryCheckAt)}`;
  const updateAvailable = hasLibraryUpdate();
  el.updateLibrariesButton.disabled = !updateAvailable;
  el.libraryStatusMessage.className = "library-status-message";
  if (message) {
    el.libraryStatusMessage.textContent = message;
    return;
  }
  if (updateAvailable) {
    el.libraryStatusMessage.classList.add("update-available");
    el.libraryStatusMessage.textContent = "Une ou plusieurs bibliothèques peuvent être mises à jour.";
  } else {
    el.libraryStatusMessage.classList.add("up-to-date");
    el.libraryStatusMessage.textContent = "Toutes les bibliothèques officielles sont à jour.";
  }
}

async function handleCheckLibraries() {
  const originalText = el.checkLibrariesButton.textContent;
  el.checkLibrariesButton.disabled = true;
  el.checkLibrariesButton.textContent = "Vérification…";
  renderAdvancedSettings("Connexion aux bibliothèques GitHub…");
  const { failed } = await checkLibraries();
  el.checkLibrariesButton.disabled = false;
  el.checkLibrariesButton.textContent = originalText;
  if (failed) {
    renderAdvancedSettings(`${failed} bibliothèque${failed > 1 ? "s n’ont" : " n’a"} pas pu être vérifiée${failed > 1 ? "s" : ""}.`);
    el.libraryStatusMessage.classList.add("error");
  } else {
    renderAdvancedSettings();
  }
}

async function handleUpdateLibraries() {
  const originalText = el.updateLibrariesButton.textContent;
  el.updateLibrariesButton.disabled = true;
  el.updateLibrariesButton.textContent = "Mise à jour…";
  const totals = await updateLibraries();
  el.updateLibrariesButton.textContent = originalText;
  renderHomeData();
  callbacks.onDataChanged?.();
  alert(
    `Bibliothèques mises à jour.\n\n` +
    `${totals.cardsAdded} nouvelle(s) carte(s)\n` +
    `${totals.cardsUpdated} carte(s) officielle(s) actualisée(s)\n` +
    `${totals.boxesAdded} nouvelle(s) boîte(s)\n` +
    `${totals.localPreserved} modification(s) locale(s) conservée(s)` +
    (totals.failed ? `\n${totals.failed} échec(s)` : "")
  );
}

async function handleRestoreBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const data = await readBackupFile(file);
    if (!confirm(
      `Restaurer cette sauvegarde du ${formatDate(data.exportedAt)} ?\n\n` +
      "Les données des modes présents dans le fichier remplaceront celles de ce téléphone."
    )) return;
    restoreBackupData(data);
    renderHomeData();
    callbacks.onDataChanged?.();
    alert("Sauvegarde restaurée.");
  } catch (error) {
    recordError(error);
    alert(error.message || "Impossible de restaurer cette sauvegarde.");
  }
}

async function handleResetLibraries() {
  if (!confirm(
    "Réinitialiser toutes les bibliothèques officielles ?\n\n" +
    "Les cartes officielles retrouveront leur version GitHub. " +
    "Les cartes et boîtes personnelles seront conservées."
  )) return;
  try {
    await resetLibraries();
    renderHomeData();
    callbacks.onDataChanged?.();
    alert("Bibliothèques officielles réinitialisées. Les contenus personnels ont été conservés.");
  } catch (error) {
    recordError(error);
    alert("La réinitialisation a échoué. Aucune bibliothèque n’a été remplacée.");
  }
}


function updateDrawPenaltyPreview() {
  const count = Number(el.drawMixedCountInput.value) || state.settings.modeOptions.draw.mixedCount;
  const customSeconds = Number.parseInt(el.customSeconds.value, 10);
  const roundSeconds = Number.isFinite(customSeconds) ? customSeconds : state.selectedSeconds;
  const penalty = getMixedDrawingPenaltySeconds(roundSeconds, count);
  el.drawPenaltyPreview.textContent = `Pénalité prévue : −${penalty} s par dessin pour une manche de ${roundSeconds} s`;
}

function saveDrawOptions() {
  const options = state.settings.modeOptions.draw;
  options.attemptCount = Number(el.drawAttemptCountInput.value) || 3;
  options.mixedCount = Math.min(5, Math.max(1, Number(el.drawMixedCountInput.value) || 2));
  options.arrivalSoundEnabled = el.drawArrivalSoundEnabledInput.checked;
  options.durations.easy = Math.min(120, Math.max(10, Number(el.drawEasySecondsInput.value) || 30));
  options.durations.medium = Math.min(120, Math.max(10, Number(el.drawMediumSecondsInput.value) || 45));
  options.durations.hard = Math.min(180, Math.max(10, Number(el.drawHardSecondsInput.value) || 60));
  options.soundEnabled = el.drawSoundEnabledInput.checked;
  saveGlobalSettings();
  updateDrawPenaltyPreview();
}

function initializeInstallPrompt() {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    state.installPrompt = event;
    el.installButton.classList.remove("hidden");
  });
  el.installButton.addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    el.installButton.classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => el.installButton.classList.add("hidden"));
}

export function initializeHome(options = {}) {
  callbacks = options;
  el.startButton.addEventListener("click", () => callbacks.onStart?.());
  el.freePlayButton.addEventListener("click", () => setPlayType("free"));
  el.multiplayerPlayButton.addEventListener("click", () => setPlayType("multiplayer"));
  el.manageCardsButton.addEventListener("click", () => callbacks.onManage?.());
  el.selectAllButton.addEventListener("click", selectEverything);
  el.selectNoneButton.addEventListener("click", selectNothing);
  el.flipHomeButton.addEventListener("click", () => callbacks.onFlip?.());

  el.modeEnabledInput.addEventListener("change", () => {
    const modeId = state.activeModeDialogId;
    if (!modeId) return;
    setModeEnabled(modeId, el.modeEnabledInput.checked);
    updateModeDialogCount();
    renderModeSelection();
  });
  el.closeModeDialogButton.addEventListener("click", closeModeConfig);
  el.doneModeDialogButton.addEventListener("click", closeModeConfig);
  el.modeSelectAllBoxesButton.addEventListener("click", () => {
    const modeId = state.activeModeDialogId;
    if (!modeId) return;
    const mode = modeState(modeId);
    mode.selectedBoxIds = mode.boxes.map(box => box.id);
    saveMode(modeId);
    renderModeConfigDialog();
    renderModeSelection();
  });
  el.modeSelectNoBoxesButton.addEventListener("click", () => {
    const modeId = state.activeModeDialogId;
    if (!modeId) return;
    modeState(modeId).selectedBoxIds = [];
    saveMode(modeId);
    renderModeConfigDialog();
    renderModeSelection();
  });
  el.showForbiddenWordsInput.addEventListener("change", () => {
    state.settings.modeOptions.words.showForbiddenWords = el.showForbiddenWordsInput.checked;
    saveGlobalSettings();
  });
  [
    el.drawAttemptCountInput,
    el.drawMixedCountInput,
    el.drawArrivalSoundEnabledInput,
    el.drawEasySecondsInput,
    el.drawMediumSecondsInput,
    el.drawHardSecondsInput,
    el.drawSoundEnabledInput
  ].forEach(input => input.addEventListener("change", saveDrawOptions));

  el.vibrationToggle.addEventListener("change", () => {
    state.settings.vibrationEnabled = el.vibrationToggle.checked;
    saveGlobalSettings();
  });
  el.testValidVibrationButton.addEventListener("click", () => callbacks.onTestVibration?.("valid"));
  el.testPassVibrationButton.addEventListener("click", () => callbacks.onTestVibration?.("pass"));

  el.checkLibrariesButton.addEventListener("click", handleCheckLibraries);
  el.updateLibrariesButton.addEventListener("click", handleUpdateLibraries);
  el.exportBackupButton.addEventListener("click", exportBackup);
  el.restoreBackupButton.addEventListener("click", () => el.restoreBackupInput.click());
  el.restoreBackupInput.addEventListener("change", handleRestoreBackup);
  el.resetLibrariesButton.addEventListener("click", handleResetLibraries);
  el.diagnosticButton.addEventListener("click", openDiagnostic);
  el.copyDiagnosticButton.addEventListener("click", copyDiagnostic);
  initializeInstallPrompt();
}
