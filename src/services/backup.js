import { APP_VERSION, MODE_ORDER } from "../config/config.js";
import { modeState, state } from "../core/state.js";
import { clone } from "../core/utils.js";
import { sanitizeMode, saveAllData } from "./libraries.js";

export function createBackupData() {
  return {
    backupSchemaVersion: 4,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: clone(state.settings),
    modes: Object.fromEntries(MODE_ORDER.map(modeId => {
      const mode = modeState(modeId);
      return [modeId, {
        boxes: clone(mode.boxes),
        cards: clone(mode.cards),
        selectedBoxIds: clone(mode.selectedBoxIds),
        selectedDifficultyIds: clone(mode.selectedDifficultyIds),
        libraryMeta: clone(mode.libraryMeta)
      }];
    }))
  };
}

export function exportBackup() {
  const backup = createBackupData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mdb-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validBackup(data) {
  if ([2, 3, 4].includes(Number(data?.backupSchemaVersion))) {
    return data.settings && data.modes && Object.values(data.modes).some(mode =>
      Array.isArray(mode?.boxes) && Array.isArray(mode?.cards)
    );
  }
  if (Number(data?.backupSchemaVersion) === 1) {
    return Array.isArray(data.boxes) && Array.isArray(data.cards) && data.settings && data.libraryMeta;
  }
  return false;
}

function mergeRestoredSettings(settings = {}) {
  state.settings = {
    ...state.settings,
    ...clone(settings),
    selectedModeIds: Array.isArray(settings.selectedModeIds)
      ? clone(settings.selectedModeIds)
      : state.settings.selectedModeIds,
    playType: settings.playType === "multiplayer" ? "multiplayer" : state.settings.playType,
    multiplayer: {
      players: Array.isArray(settings.multiplayer?.players)
        ? clone(settings.multiplayer.players)
        : clone(state.settings.multiplayer.players),
      cycles: Math.min(10, Math.max(1, Number(settings.multiplayer?.cycles) || state.settings.multiplayer.cycles)),
      orderType: settings.multiplayer?.orderType === "common" ? "common" : state.settings.multiplayer.orderType
    },
    modeOptions: {
      words: {
        showForbiddenWords: settings.modeOptions?.words?.showForbiddenWords !== false
      },
      draw: {
        attemptCount: [3, 5, 7, 10].includes(Number(settings.modeOptions?.draw?.attemptCount))
          ? Number(settings.modeOptions.draw.attemptCount)
          : state.settings.modeOptions.draw.attemptCount,
        durations: {
          easy: Number(settings.modeOptions?.draw?.durations?.easy) || state.settings.modeOptions.draw.durations.easy,
          medium: Number(settings.modeOptions?.draw?.durations?.medium) || state.settings.modeOptions.draw.durations.medium,
          hard: Number(settings.modeOptions?.draw?.durations?.hard) || state.settings.modeOptions.draw.durations.hard
        },
        soundEnabled: settings.modeOptions?.draw?.soundEnabled !== false,
        mixedCount: Math.min(5, Math.max(1, Number(settings.modeOptions?.draw?.mixedCount) || state.settings.modeOptions.draw.mixedCount)),
        arrivalSoundEnabled: typeof settings.modeOptions?.draw?.arrivalSoundEnabled === "boolean"
          ? settings.modeOptions.draw.arrivalSoundEnabled
          : state.settings.modeOptions.draw.arrivalSoundEnabled
      }
    }
  };
}

export async function readBackupFile(file) {
  if (!file) throw new Error("Aucun fichier de sauvegarde sélectionné.");
  const data = JSON.parse(await file.text());
  if (!validBackup(data)) {
    throw new Error("Ce fichier n’est pas une sauvegarde MDB valide.");
  }
  return data;
}

export function restoreBackupData(data) {
  if (!validBackup(data)) {
    throw new Error("Ce fichier n’est pas une sauvegarde MDB valide.");
  }

  if ([2, 3, 4].includes(Number(data.backupSchemaVersion))) {
    mergeRestoredSettings(data.settings);
    MODE_ORDER.forEach(modeId => {
      const restored = data.modes[modeId];
      if (!restored) return;
      const mode = modeState(modeId);
      mode.boxes = clone(restored.boxes);
      mode.cards = clone(restored.cards);
      mode.selectedBoxIds = clone(restored.selectedBoxIds || []);
      mode.selectedDifficultyIds = clone(restored.selectedDifficultyIds || ["easy", "medium", "hard"]);
      mode.libraryMeta = clone(restored.libraryMeta || {});
      sanitizeMode(modeId, mode, mode.officialLibrary);
    });
  } else {
    const lyricsMode = modeState("lyrics");
    lyricsMode.boxes = clone(data.boxes);
    lyricsMode.cards = clone(data.cards);
    lyricsMode.selectedBoxIds = clone(data.settings.selectedBoxIds || []);
    lyricsMode.selectedDifficultyIds = ["easy", "medium", "hard"];
    lyricsMode.libraryMeta = clone(data.libraryMeta);
    sanitizeMode("lyrics", lyricsMode, lyricsMode.officialLibrary);
    state.settings.vibrationEnabled = data.settings.vibrationEnabled !== false;
  }

  saveAllData();
}
