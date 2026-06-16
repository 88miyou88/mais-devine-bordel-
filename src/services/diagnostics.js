import { APP_CACHE_NAME, APP_VERSION, MODE_ORDER } from "../config/config.js";
import { el, getSwipeThreshold } from "../core/dom.js";
import { modeState, recordError, state } from "../core/state.js";
import { getPlayableCards, modeConfig } from "./libraries.js";

async function serviceWorkerStatus() {
  if (!("serviceWorker" in navigator)) return "Non pris en charge";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "Non enregistré";
    if (registration.active) return "Actif";
    if (registration.waiting) return "En attente";
    if (registration.installing) return "Installation";
    return "Enregistré";
  } catch (error) {
    recordError(error);
    return "Erreur";
  }
}

export async function buildDiagnostic() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const modeLines = MODE_ORDER.flatMap(modeId => {
    const config = modeConfig(modeId);
    const mode = modeState(modeId);
    return [
      `${config.name} — cartes : ${mode.cards.length}`,
      `${config.name} — boîtes : ${mode.boxes.length}`,
      `${config.name} — difficultés : ${mode.selectedDifficultyIds.join(", ")}`,
      `${config.name} — bibliothèque installée : ${mode.libraryMeta.installedVersion}`,
      `${config.name} — bibliothèque disponible : ${mode.libraryMeta.availableVersion}`
    ];
  });

  return [
    "Application : Mais devine, bordel !",
    `Version : ${APP_VERSION}`,
    `Cache attendu : ${APP_CACHE_NAME}`,
    `Date : ${new Date().toISOString()}`,
    `Navigateur : ${navigator.userAgent}`,
    `En ligne : ${navigator.onLine ? "Oui" : "Non"}`,
    `Affichage autonome/installé : ${standalone ? "Oui" : "Non"}`,
    `Service worker : ${await serviceWorkerStatus()}`,
    `Orientation : ${screen.orientation?.type || "Inconnue"}`,
    `Fenêtre : ${window.innerWidth} × ${window.innerHeight}`,
    `Pointer Events : ${"PointerEvent" in window ? "Oui" : "Non"}`,
    `Vibrations : ${"vibrate" in navigator ? "Prises en charge" : "Non prises en charge"}`,
    `Vibrations activées : ${state.settings.vibrationEnabled ? "Oui" : "Non"}`,
    `Wake Lock : ${"wakeLock" in navigator ? "Pris en charge" : "Non pris en charge"}`,
    `Plein écran : ${document.fullscreenEnabled ? "Pris en charge" : "Non pris en charge"}`,
    `Mots interdits affichés : ${state.settings.modeOptions.words.showForbiddenWords ? "Oui" : "Non"}`,
    `Dessins mélangés par manche : ${state.settings.modeOptions.draw.mixedCount}`,
    `Signal sonore d’arrivée Dessin : ${state.settings.modeOptions.draw.arrivalSoundEnabled ? "Oui" : "Non"}`,
    ...modeLines,
    `Cartes jouables : ${getPlayableCards().length}`,
    `Seuil du swipe : ${Math.round(getSwipeThreshold())} px`,
    `Affichage retourné : ${state.flipped ? "Oui" : "Non"}`,
    `Dernière erreur : ${state.lastError}`
  ].join("\n");
}

export async function openDiagnostic() {
  el.diagnosticOutput.textContent = await buildDiagnostic();
  if (typeof el.diagnosticDialog.showModal === "function") {
    el.diagnosticDialog.showModal();
  } else {
    alert(el.diagnosticOutput.textContent);
  }
}

export async function copyDiagnostic() {
  const text = el.diagnosticOutput.textContent;
  try {
    await navigator.clipboard.writeText(text);
    el.copyDiagnosticButton.textContent = "Copié !";
    setTimeout(() => {
      el.copyDiagnosticButton.textContent = "Copier le diagnostic";
    }, 1200);
  } catch (error) {
    recordError(error);
    const range = document.createRange();
    range.selectNodeContents(el.diagnosticOutput);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (error) {
    recordError(error);
  }
}
