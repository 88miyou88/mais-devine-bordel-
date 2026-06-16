import { recordError, state } from "./state.js";

export const el = {
  app: document.querySelector("#app"),
  screens: [...document.querySelectorAll(".screen")],
  homeScreen: document.querySelector("#homeScreen"),
  globalTimerSettings: document.querySelector("#globalTimerSettings"),
  manageScreen: document.querySelector("#manageScreen"),
  countdownScreen: document.querySelector("#countdownScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  resultsScreen: document.querySelector("#resultsScreen"),
  drawTransitionScreen: document.querySelector("#drawTransitionScreen"),
  drawRevealScreen: document.querySelector("#drawRevealScreen"),
  drawPlayScreen: document.querySelector("#drawPlayScreen"),

  startButton: document.querySelector("#startButton"),
  manageCardsButton: document.querySelector("#manageCardsButton"),
  installButton: document.querySelector("#installButton"),
  durationButtons: [...document.querySelectorAll(".duration-btn")],
  customSeconds: document.querySelector("#customSeconds"),
  availableCount: document.querySelector("#availableCount"),
  selectAllButton: document.querySelector("#selectAllButton"),
  selectNoneButton: document.querySelector("#selectNoneButton"),
  modeSelectionList: document.querySelector("#modeSelectionList"),

  vibrationToggle: document.querySelector("#vibrationToggle"),
  testValidVibrationButton: document.querySelector("#testValidVibrationButton"),
  testPassVibrationButton: document.querySelector("#testPassVibrationButton"),
  libraryVersionList: document.querySelector("#libraryVersionList"),
  libraryLastChecked: document.querySelector("#libraryLastChecked"),
  libraryStatusMessage: document.querySelector("#libraryStatusMessage"),
  checkLibrariesButton: document.querySelector("#checkLibrariesButton"),
  updateLibrariesButton: document.querySelector("#updateLibrariesButton"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  restoreBackupButton: document.querySelector("#restoreBackupButton"),
  restoreBackupInput: document.querySelector("#restoreBackupInput"),
  resetLibrariesButton: document.querySelector("#resetLibrariesButton"),
  diagnosticButton: document.querySelector("#diagnosticButton"),
  flipHomeButton: document.querySelector("#flipHomeButton"),

  manageBackButton: document.querySelector("#manageBackButton"),
  manageModeTabs: document.querySelector("#manageModeTabs"),
  cardSearchInput: document.querySelector("#cardSearchInput"),
  manageBoxFilter: document.querySelector("#manageBoxFilter"),
  addCardButton: document.querySelector("#addCardButton"),
  manageBoxesButton: document.querySelector("#manageBoxesButton"),
  manageStats: document.querySelector("#manageStats"),
  cardList: document.querySelector("#cardList"),

  countdownValue: document.querySelector("#countdownValue"),
  timeDisplay: document.querySelector("#timeDisplay"),
  validScoreLabel: document.querySelector("#validScoreLabel"),
  validScore: document.querySelector("#validScore"),
  passScoreLabel: document.querySelector("#passScoreLabel"),
  passScore: document.querySelector("#passScore"),
  gameCard: document.querySelector("#gameCard"),
  leftSwipeGuide: document.querySelector("#leftSwipeGuide"),
  rightSwipeGuide: document.querySelector("#rightSwipeGuide"),
  gameModeLabel: document.querySelector("#gameModeLabel"),
  lyricsGameContent: document.querySelector("#lyricsGameContent"),
  mimeGameContent: document.querySelector("#mimeGameContent"),
  wordsGameContent: document.querySelector("#wordsGameContent"),
  promptText: document.querySelector("#promptText"),
  answerText: document.querySelector("#answerText"),
  mimePromptText: document.querySelector("#mimePromptText"),
  wordPromptText: document.querySelector("#wordPromptText"),
  forbiddenWordsBlock: document.querySelector("#forbiddenWordsBlock"),
  forbiddenWordsList: document.querySelector("#forbiddenWordsList"),
  cardMeta: document.querySelector("#cardMeta"),
  cardMetaPrimary: document.querySelector("#cardMetaPrimary"),
  cardMetaSecondary: document.querySelector("#cardMetaSecondary"),
  undoButton: document.querySelector("#undoButton"),
  pauseButton: document.querySelector("#pauseButton"),
  flipGameButton: document.querySelector("#flipGameButton"),
  endButton: document.querySelector("#endButton"),
  pauseOverlay: document.querySelector("#pauseOverlay"),
  resumeOverlayButton: document.querySelector("#resumeOverlayButton"),

  resultValid: document.querySelector("#resultValid"),
  resultValidLabel: document.querySelector("#resultValidLabel"),
  resultPassed: document.querySelector("#resultPassed"),
  resultPassedLabel: document.querySelector("#resultPassedLabel"),
  resultTotal: document.querySelector("#resultTotal"),
  resultTotalLabel: document.querySelector("#resultTotalLabel"),
  resultBreakdown: document.querySelector("#resultBreakdown"),
  resultDetails: document.querySelector("#resultDetails"),
  replayButton: document.querySelector("#replayButton"),
  homeButton: document.querySelector("#homeButton"),

  modeConfigDialog: document.querySelector("#modeConfigDialog"),
  modeDialogHero: document.querySelector("#modeDialogHero"),
  modeDialogIcon: document.querySelector("#modeDialogIcon"),
  modeDialogTitle: document.querySelector("#modeDialogTitle"),
  modeDialogDescription: document.querySelector("#modeDialogDescription"),
  closeModeDialogButton: document.querySelector("#closeModeDialogButton"),
  doneModeDialogButton: document.querySelector("#doneModeDialogButton"),
  modeEnabledInput: document.querySelector("#modeEnabledInput"),
  modeDialogCount: document.querySelector("#modeDialogCount"),
  modeRulesList: document.querySelector("#modeRulesList"),
  modeDifficultyChoices: document.querySelector("#modeDifficultyChoices"),
  wordsSpecialSettings: document.querySelector("#wordsSpecialSettings"),
  showForbiddenWordsInput: document.querySelector("#showForbiddenWordsInput"),
  drawSpecialSettings: document.querySelector("#drawSpecialSettings"),
  drawAttemptCountInput: document.querySelector("#drawAttemptCountInput"),
  drawMixedCountInput: document.querySelector("#drawMixedCountInput"),
  drawPenaltyPreview: document.querySelector("#drawPenaltyPreview"),
  drawArrivalSoundEnabledInput: document.querySelector("#drawArrivalSoundEnabledInput"),
  drawEasySecondsInput: document.querySelector("#drawEasySecondsInput"),
  drawMediumSecondsInput: document.querySelector("#drawMediumSecondsInput"),
  drawHardSecondsInput: document.querySelector("#drawHardSecondsInput"),
  drawSoundEnabledInput: document.querySelector("#drawSoundEnabledInput"),
  modeSelectAllBoxesButton: document.querySelector("#modeSelectAllBoxesButton"),
  modeSelectNoBoxesButton: document.querySelector("#modeSelectNoBoxesButton"),
  modeBoxChoices: document.querySelector("#modeBoxChoices"),

  cardDialog: document.querySelector("#cardDialog"),
  cardForm: document.querySelector("#cardForm"),
  cardDialogTitle: document.querySelector("#cardDialogTitle"),
  closeCardDialogButton: document.querySelector("#closeCardDialogButton"),
  cancelCardButton: document.querySelector("#cancelCardButton"),
  cardIdInput: document.querySelector("#cardIdInput"),
  cardModeInput: document.querySelector("#cardModeInput"),
  lyricsEditorFields: document.querySelector("#lyricsEditorFields"),
  mimeEditorFields: document.querySelector("#mimeEditorFields"),
  wordsEditorFields: document.querySelector("#wordsEditorFields"),
  cardPromptInput: document.querySelector("#cardPromptInput"),
  cardAnswerInput: document.querySelector("#cardAnswerInput"),
  cardTitleInput: document.querySelector("#cardTitleInput"),
  cardSourceInput: document.querySelector("#cardSourceInput"),
  mimePromptInput: document.querySelector("#mimePromptInput"),
  simplePromptLabel: document.querySelector("#simplePromptLabel"),
  wordPromptInput: document.querySelector("#wordPromptInput"),
  forbiddenWordsInput: document.querySelector("#forbiddenWordsInput"),
  cardDifficultyInput: document.querySelector("#cardDifficultyInput"),
  cardBoxInput: document.querySelector("#cardBoxInput"),
  cardActiveInput: document.querySelector("#cardActiveInput"),

  boxesDialog: document.querySelector("#boxesDialog"),
  boxesDialogTitle: document.querySelector("#boxesDialogTitle"),
  closeBoxesDialogButton: document.querySelector("#closeBoxesDialogButton"),
  doneBoxesButton: document.querySelector("#doneBoxesButton"),
  newBoxNameInput: document.querySelector("#newBoxNameInput"),
  addBoxButton: document.querySelector("#addBoxButton"),
  boxesList: document.querySelector("#boxesList"),

  diagnosticDialog: document.querySelector("#diagnosticDialog"),
  diagnosticOutput: document.querySelector("#diagnosticOutput"),
  copyDiagnosticButton: document.querySelector("#copyDiagnosticButton"),

  drawTransitionKicker: document.querySelector("#drawTransitionKicker"),
  drawTransitionTitle: document.querySelector("#drawTransitionTitle"),
  drawTransitionText: document.querySelector("#drawTransitionText"),
  drawTransitionCountdown: document.querySelector("#drawTransitionCountdown"),
  drawTransitionButton: document.querySelector("#drawTransitionButton"),
  drawPromptPanel: document.querySelector("#drawPromptPanel"),
  drawAttemptLabel: document.querySelector("#drawAttemptLabel"),
  drawRevealPromptButton: document.querySelector("#drawRevealPromptButton"),
  drawRevealPrompt: document.querySelector("#drawRevealPrompt"),
  drawRevealMeta: document.querySelector("#drawRevealMeta"),
  drawSkipRevealButton: document.querySelector("#drawSkipRevealButton"),
  drawOnPhoneButton: document.querySelector("#drawOnPhoneButton"),
  drawOnPaperButton: document.querySelector("#drawOnPaperButton"),
  drawPlayProgress: document.querySelector("#drawPlayProgress"),
  drawLiveScore: document.querySelector("#drawLiveScore"),
  drawTimerDisplay: document.querySelector("#drawTimerDisplay"),
  drawPauseButton: document.querySelector("#drawPauseButton"),
  drawEndButton: document.querySelector("#drawEndButton"),
  drawPauseOverlay: document.querySelector("#drawPauseOverlay"),
  drawResumeButton: document.querySelector("#drawResumeButton"),
  drawCanvasArea: document.querySelector("#drawCanvasArea"),
  drawPaperArea: document.querySelector("#drawPaperArea"),
  drawingCanvas: document.querySelector("#drawingCanvas"),
  drawColorChoices: document.querySelector("#drawColorChoices"),
  drawToolsPanel: document.querySelector("#drawToolsPanel"),
  drawBrushSize: document.querySelector("#drawBrushSize"),
  drawEraserButton: document.querySelector("#drawEraserButton"),
  drawToolIcon: document.querySelector("#drawToolIcon"),
  drawUndoButton: document.querySelector("#drawUndoButton"),
  drawClearButton: document.querySelector("#drawClearButton"),
  drawFoundButton: document.querySelector("#drawFoundButton"),
  drawPassButton: document.querySelector("#drawPassButton")
};


export function showScreen(target) {
  el.screens.forEach(screen => screen.classList.toggle("active", screen === target));
}

export function getSwipeThreshold() {
  return Math.min(105, Math.max(60, window.innerWidth * 0.12));
}

export function createActionButton(text, handler, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button${danger ? " danger" : ""}`;
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

export function assertRequiredDom() {
  const missing = Object.entries(el)
    .filter(([, value]) => value == null)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Éléments HTML introuvables : ${missing.join(", ")}`);
  }
}

export async function requestGameDisplay() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
  } catch (_) {}
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
  } catch (_) {}
  await requestWakeLock();
}

export async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator && document.visibilityState === "visible") {
      state.wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (error) {
    recordError(error);
  }
}

export async function releaseWakeLock() {
  try {
    if (state.wakeLock) await state.wakeLock.release();
  } catch (_) {
  } finally {
    state.wakeLock = null;
  }
}

export function vibrateForResult(result, force = false) {
  if (!("vibrate" in navigator)) return;
  if (!force && !state.settings.vibrationEnabled) return;
  try {
    navigator.vibrate(0);
    navigator.vibrate(result === "valid" ? [45, 45, 45, 45, 45] : 425);
  } catch (error) {
    recordError(error);
  }
}
