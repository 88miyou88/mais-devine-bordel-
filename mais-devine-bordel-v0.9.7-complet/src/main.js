import { APP_VERSION } from "./config/config.js";
import {
  assertRequiredDom,
  el,
  initializeOrientationGuard,
  releaseWakeLock,
  requestGameDisplay,
  showScreen,
  vibrateForResult
} from "./core/dom.js";
import { recordError, state } from "./core/state.js";
import { initializeHome, renderHomeData } from "./features/home.js";
import { initializeAudit, openAuditSetup } from "./features/audit/audit-controller.js";
import {
  initializeCardManager,
  openManageScreen,
  renderManageScreen
} from "./features/card-manager/manager-controller.js";
import {
  initializeDrawing,
  startDrawingRound,
  stopDrawingRound
} from "./features/drawing/drawing-controller.js";
import {
  finishGame,
  initializeGame,
  startClassicRound,
  stopClassicGame
} from "./features/game/game-controller.js";
import { setFlipped, toggleFlipped } from "./features/game/swipe.js";
import {
  initializeMultiplayer,
  openMultiplayerSetup
} from "./features/multiplayer/multiplayer-controller.js";
import {
  initializeDrinkingGame,
  openDrinkingSetup,
  stopDrinkingGame
} from "./features/drinking-game/drinking-controller.js";
import { registerServiceWorker } from "./services/diagnostics.js";
import { getPlayableCards, loadContent } from "./services/libraries.js";

async function startFlow() {
  if (getPlayableCards().length === 0) {
    alert("Sélectionne au moins un mode contenant une boîte et une carte active.");
    return;
  }

  const drinkingOnly = state.settings.selectedModeIds.length === 1 && state.settings.selectedModeIds[0] === "drinking";
  if (drinkingOnly) {
    // Afficher immédiatement la préparation : certains navigateurs peuvent tarder
    // à résoudre la demande de plein écran ou de verrouillage d’orientation.
    const setupPromise = openDrinkingSetup();
    await requestGameDisplay();
    await setupPromise;
    return;
  }

  if (state.settings.playType === "multiplayer") {
    await requestGameDisplay();
    openMultiplayerSetup();
    return;
  }

  const drawSelected = state.settings.selectedModeIds.includes("draw");
  const drawOnly = drawSelected && state.settings.selectedModeIds.length === 1;
  if (drawOnly) await startDrawingRound();
  else await startClassicRound();
}

function returnHome() {
  stopDrawingRound();
  stopClassicGame();
  stopDrinkingGame();
  releaseWakeLock();
  renderHomeData();
  showScreen(el.homeScreen);
}

function handleDataChanged() {
  renderManageScreen();
}

function bindGlobalErrorHandling() {
  window.addEventListener("error", event => recordError(event.error || event.message));
  window.addEventListener("unhandledrejection", event => recordError(event.reason));
}

async function init() {
  assertRequiredDom();
  initializeOrientationGuard();
  bindGlobalErrorHandling();
  await loadContent();
  setFlipped(state.flipped);

  initializeCardManager({ onHomeDataChanged: renderHomeData });
  initializeAudit({ onHomeDataChanged: renderHomeData });
  initializeDrawing({ onAbortMixed: () => finishGame("manual") });
  initializeGame({ onReplay: startFlow, onHome: returnHome });
  el.flipGameButton.addEventListener("click", toggleFlipped);
  initializeMultiplayer({ onHome: returnHome });
  initializeDrinkingGame({ onHome: returnHome });
  initializeHome({
    onStart: startFlow,
    onManage: openManageScreen,
    onAudit: openAuditSetup,
    onFlip: toggleFlipped,
    onTestVibration: result => vibrateForResult(result, true),
    onDataChanged: handleDataChanged
  });

  renderHomeData();
  renderManageScreen();
  registerServiceWorker();
}

init()
  .then(() => {
    document.documentElement.dataset.mdbReady = "1";
    document.documentElement.dataset.mdbVersion = APP_VERSION;
    window.dispatchEvent(new CustomEvent("mdb:ready", { detail: { version: APP_VERSION } }));
  })
  .catch(error => {
    recordError(error);
    console.error(error);
    if (typeof window.MDB_BOOT_FAILURE === "function") {
      window.MDB_BOOT_FAILURE(error);
    } else {
      alert("L’application n’a pas pu démarrer. Recharge la page.");
    }
  });
