import {
  DIFFICULTY_ORDER,
  GLOBAL_SETTINGS_KEY,
  LEGACY_SETTINGS_KEY,
  MODE_CONFIG,
  MODE_ORDER,
  MIN_MULTIPLAYER_PLAYERS,
  MAX_MULTIPLAYER_PLAYERS,
  UNCATEGORIZED_ID
} from "../config/config.js";
import { modeState, recordError, state } from "../core/state.js";
import {
  cleanIdList,
  clone,
  normalizeDifficulty
} from "../core/utils.js";
import {
  readJsonStorage,
  readTextStorage,
  writeJsonStorage
} from "../core/storage.js";

export function modeConfig(modeId) {
  return MODE_CONFIG[modeId];
}

export function normalizeLibrary(modeId, raw) {
  const config = modeConfig(modeId);
  if (!raw || raw.modeId !== modeId || !Array.isArray(raw.boxes) || !Array.isArray(raw.cards) || !raw.libraryVersion) {
    throw new Error(`Bibliothèque invalide pour le mode ${config.name}.`);
  }

  const boxes = raw.boxes.map(box => ({
    id: String(box.id),
    name: String(box.name),
    protected: box.id === UNCATEGORIZED_ID || box.protected === true,
    adult: box.adult === true
  }));
  const boxIds = new Set(boxes.map(box => box.id));

  const cards = raw.cards.map(card => {
    const common = {
      id: String(card.id),
      boxId: boxIds.has(String(card.boxId)) ? String(card.boxId) : UNCATEGORIZED_ID,
      active: card.active !== false,
      difficulty: normalizeDifficulty(card.difficulty, modeId, card)
    };

    if (config.type === "lyrics") {
      return {
        ...common,
        prompt: String(card.prompt || ""),
        answer: String(card.answer || ""),
        title: String(card.title || ""),
        source: String(card.source || ""),
        context: String(card.context || "")
      };
    }

    if (config.type === "words") {
      return {
        ...common,
        prompt: String(card.prompt || ""),
        forbiddenWords: Array.isArray(card.forbiddenWords)
          ? card.forbiddenWords.map(String).filter(Boolean)
          : []
      };
    }

    if (config.type === "drinking") {
      return {
        ...common,
        prompt: String(card.prompt || ""),
        mechanic: String(card.mechanic || "manual"),
        targetType: String(card.targetType || "group"),
        penalty: {
          intensity: ["light", "medium", "strong"].includes(card.penalty?.intensity)
            ? card.penalty.intensity : "medium",
          scoreMultiplier: Number(card.penalty?.scoreMultiplier) || 1
        },
        resolution: {
          kind: String(card.resolution?.kind || "manual"),
          supports: Array.isArray(card.resolution?.supports)
            ? card.resolution.supports.map(String)
            : ["drink", "points"]
        },
        durationSeconds: Number(card.durationSeconds) || null,
        ruleDurationCards: Number(card.ruleDurationCards) || null,
        adult: card.adult === true,
        minPlayers: Math.max(2, Number(card.minPlayers) || 2)
      };
    }

    return { ...common, prompt: String(card.prompt || "") };
  });

  return {
    schemaVersion: Number(raw.schemaVersion) || 1,
    libraryVersion: String(raw.libraryVersion),
    updatedAt: String(raw.updatedAt || ""),
    modeId,
    modeName: String(raw.modeName || config.name),
    boxes,
    cards
  };
}

export async function fetchOfficialLibrary(modeId, { forceNetwork = false, allowFallback = true } = {}) {
  const config = modeConfig(modeId);
  const suffix = forceNetwork ? `?v=${Date.now()}` : "";

  try {
    const response = await fetch(`${config.libraryUrl}${suffix}`, {
      cache: forceNetwork ? "no-store" : "default"
    });
    if (!response.ok) throw new Error(`${config.name} indisponible (${response.status}).`);
    return normalizeLibrary(modeId, await response.json());
  } catch (error) {
    recordError(error);
    if (!allowFallback) throw error;

    const storedBoxes = readJsonStorage(config.storage.boxes, null, recordError);
    const storedCards = readJsonStorage(config.storage.cards, null, recordError);
    const storedMeta = readJsonStorage(config.storage.meta, null, recordError);

    if (Array.isArray(storedBoxes) && storedBoxes.length && Array.isArray(storedCards)) {
      return normalizeLibrary(modeId, {
        schemaVersion: 1,
        libraryVersion: String(storedMeta?.installedVersion || "local-offline"),
        updatedAt: "",
        modeId,
        modeName: config.name,
        boxes: storedBoxes.map(({ origin, locallyModified, ...box }) => box),
        cards: storedCards.map(({ origin, locallyModified, ...card }) => card)
      });
    }

    throw error;
  }
}

export function officialBoxFrom(box) {
  return {
    ...clone(box),
    origin: "official",
    locallyModified: false,
    protected: box.id === UNCATEGORIZED_ID || box.protected === true
  };
}

export function officialCardFrom(card) {
  return {
    ...clone(card),
    origin: "official",
    locallyModified: false,
    active: card.active !== false
  };
}

function sameBoxAsOfficial(localBox, officialBox) {
  return localBox.name === officialBox.name &&
    Boolean(localBox.protected) === Boolean(officialBox.protected) &&
    Boolean(localBox.adult) === Boolean(officialBox.adult);
}

function sameCardAsOfficial(modeId, localCard, officialCard) {
  const config = modeConfig(modeId);
  if (
    localCard.boxId !== officialCard.boxId ||
    Boolean(localCard.active) !== Boolean(officialCard.active !== false) ||
    localCard.prompt !== officialCard.prompt ||
    normalizeDifficulty(localCard.difficulty, modeId, localCard) !== officialCard.difficulty
  ) return false;

  if (config.type === "lyrics") {
    return localCard.answer === officialCard.answer &&
      localCard.title === officialCard.title &&
      localCard.source === officialCard.source &&
      String(localCard.context || "") === String(officialCard.context || "");
  }

  if (config.type === "words") {
    return JSON.stringify(localCard.forbiddenWords || []) ===
      JSON.stringify(officialCard.forbiddenWords || []);
  }

  if (config.type === "drinking") {
    return localCard.mechanic === officialCard.mechanic &&
      localCard.targetType === officialCard.targetType &&
      JSON.stringify(localCard.penalty || {}) === JSON.stringify(officialCard.penalty || {}) &&
      JSON.stringify(localCard.resolution || {}) === JSON.stringify(officialCard.resolution || {}) &&
      Number(localCard.durationSeconds || 0) === Number(officialCard.durationSeconds || 0) &&
      Number(localCard.ruleDurationCards || 0) === Number(officialCard.ruleDurationCards || 0) &&
      Boolean(localCard.adult) === Boolean(officialCard.adult) &&
      Number(localCard.minPlayers || 2) === Number(officialCard.minPlayers || 2);
  }

  return true;
}

const AUTO_LIBRARY_MIGRATIONS = {
  lyrics: {
    target: "2026.06.20-final-revise",
    from: new Set(["2026.06.15-3"])
  },
  mime: {
    target: "2026.06.19-1",
    from: new Set(["2026.06.15-1", "0.9.4-content-mimes-1000-final"])
  },
  drinking: {
    target: "2026.06.19-1",
    from: new Set(["2026.06.17-1", "2026.06.17-2"])
  }
};

function shouldAutoMigrateLibrary(modeId, installedVersion, libraryVersion) {
  if (!installedVersion || installedVersion === libraryVersion) return false;
  const migration = AUTO_LIBRARY_MIGRATIONS[modeId];
  return Boolean(
    migration &&
    migration.from.has(String(installedVersion)) &&
    String(libraryVersion) === migration.target
  );
}

const MIME_LEGACY_CARD_COUNT = 395;
const MIME_REPAIR_LIBRARY_VERSION = "2026.06.19-1";

function legacyMimeRepairPlan(modeId, storedCards, storedMeta, library) {
  if (
    modeId !== "mime" ||
    String(library.libraryVersion) !== MIME_REPAIR_LIBRARY_VERSION ||
    !Array.isArray(storedCards)
  ) return { needed: false, deletedCardIds: [], deletedBoxIds: [] };

  const officialIds = new Set(library.cards.map(card => card.id));
  const legacyCards = library.cards.slice(0, MIME_LEGACY_CARD_COUNT);
  const legacyIds = new Set(legacyCards.map(card => card.id));
  const legacyBoxIds = new Set([
    ...legacyCards.map(card => card.boxId),
    UNCATEGORIZED_ID
  ]);
  const storedOfficialIds = new Set(
    storedCards.map(card => String(card.id)).filter(id => officialIds.has(id))
  );
  const storedNewOfficialIds = [...storedOfficialIds].filter(id => !legacyIds.has(id));
  const missingNewOfficialCount = library.cards
    .slice(MIME_LEGACY_CARD_COUNT)
    .filter(card => !storedOfficialIds.has(card.id))
    .length;

  // Répare l’état intermédiaire observé sur certains téléphones : la version
  // 2026.06.19-1 a été mémorisée alors que seules les 395 anciennes cartes
  // étaient encore présentes, parfois avec les 605 nouveautés marquées à tort
  // comme supprimées.
  const needed = storedOfficialIds.size <= MIME_LEGACY_CARD_COUNT &&
    storedNewOfficialIds.length === 0 &&
    missingNewOfficialCount >= 500;
  if (!needed) return { needed: false, deletedCardIds: [], deletedBoxIds: [] };

  const explicitlyDeletedCards = new Set(cleanIdList(storedMeta?.deletedOfficialCardIds));
  const deletedCardIds = legacyCards
    .filter(card => !storedOfficialIds.has(card.id) || explicitlyDeletedCards.has(card.id))
    .map(card => card.id);
  const deletedBoxIds = cleanIdList(storedMeta?.deletedOfficialBoxIds)
    .filter(id => legacyBoxIds.has(id));

  return { needed: true, deletedCardIds, deletedBoxIds };
}

function freshModeState(library) {
  return {
    officialLibrary: library,
    boxes: library.boxes.map(officialBoxFrom),
    cards: library.cards.map(officialCardFrom),
    selectedBoxIds: library.modeId === "drinking"
      ? library.boxes.filter(box => box.adult !== true).map(box => box.id)
      : library.boxes.map(box => box.id),
    selectedDifficultyIds: ["easy", "medium", "hard"],
    libraryMeta: {
      installedVersion: library.libraryVersion,
      availableVersion: library.libraryVersion,
      lastCheckedAt: new Date().toISOString(),
      deletedOfficialCardIds: [],
      deletedOfficialBoxIds: []
    }
  };
}

export function sanitizeMode(modeId, mode, library) {
  const officialBoxIds = new Set(library.boxes.map(box => box.id));
  const officialCardIds = new Set(library.cards.map(card => card.id));
  const config = modeConfig(modeId);

  mode.boxes = (Array.isArray(mode.boxes) ? mode.boxes : []).map(box => ({
    ...box,
    id: String(box.id),
    name: String(box.name || "Sans catégorie"),
    protected: box.id === UNCATEGORIZED_ID || box.protected === true,
    origin: box.origin || (officialBoxIds.has(String(box.id)) ? "official" : "personal"),
    locallyModified: box.locallyModified === true
  }));

  if (!mode.boxes.some(box => box.id === UNCATEGORIZED_ID)) {
    const fallback = library.boxes.find(box => box.id === UNCATEGORIZED_ID) ||
      { id: UNCATEGORIZED_ID, name: "Sans catégorie", protected: true };
    mode.boxes.push(officialBoxFrom(fallback));
  }

  const boxIds = new Set(mode.boxes.map(box => box.id));
  mode.cards = (Array.isArray(mode.cards) ? mode.cards : []).map(card => {
    const normalized = {
      ...card,
      id: String(card.id),
      boxId: boxIds.has(String(card.boxId)) ? String(card.boxId) : UNCATEGORIZED_ID,
      active: card.active !== false,
      difficulty: normalizeDifficulty(card.difficulty, modeId, card),
      origin: card.origin || (officialCardIds.has(String(card.id)) ? "official" : "personal"),
      locallyModified: card.locallyModified === true
    };
    if (config.type === "lyrics") {
      normalized.prompt = String(card.prompt || "");
      normalized.answer = String(card.answer || "");
      normalized.title = String(card.title || "");
      normalized.source = String(card.source || "");
      normalized.context = String(card.context || "");
    }
    if (config.type === "words") {
      normalized.forbiddenWords = Array.isArray(card.forbiddenWords)
        ? card.forbiddenWords.map(String).filter(Boolean)
        : [];
    }
    if (config.type === "drinking") {
      normalized.mechanic = String(card.mechanic || "manual");
      normalized.targetType = String(card.targetType || "group");
      normalized.penalty = {
        intensity: ["light", "medium", "strong"].includes(card.penalty?.intensity)
          ? card.penalty.intensity : "medium",
        scoreMultiplier: Number(card.penalty?.scoreMultiplier) || 1
      };
      normalized.resolution = {
        kind: String(card.resolution?.kind || "manual"),
        supports: Array.isArray(card.resolution?.supports)
          ? card.resolution.supports.map(String)
          : ["drink", "points"]
      };
      normalized.durationSeconds = Number(card.durationSeconds) || null;
      normalized.ruleDurationCards = Number(card.ruleDurationCards) || null;
      normalized.adult = card.adult === true;
      normalized.minPlayers = Math.max(2, Number(card.minPlayers) || 2);
    }
    return normalized;
  });

  mode.selectedBoxIds = cleanIdList(mode.selectedBoxIds).filter(id => boxIds.has(id));
  mode.selectedDifficultyIds = cleanIdList(mode.selectedDifficultyIds)
    .filter(id => ["easy", "medium", "hard"].includes(id));
  if (!mode.selectedDifficultyIds.length) {
    mode.selectedDifficultyIds = ["easy", "medium", "hard"];
  }

  mode.libraryMeta = {
    installedVersion: String(mode.libraryMeta?.installedVersion || library.libraryVersion),
    availableVersion: String(mode.libraryMeta?.availableVersion || library.libraryVersion),
    lastCheckedAt: String(mode.libraryMeta?.lastCheckedAt || ""),
    deletedOfficialCardIds: cleanIdList(mode.libraryMeta?.deletedOfficialCardIds),
    deletedOfficialBoxIds: cleanIdList(mode.libraryMeta?.deletedOfficialBoxIds)
  };
  mode.officialLibrary = library;
}

async function loadMode(modeId, legacySettings) {
  const config = modeConfig(modeId);
  const library = await fetchOfficialLibrary(modeId);
  const storedBoxes = readJsonStorage(config.storage.boxes, null, recordError);
  const storedCards = readJsonStorage(config.storage.cards, null, recordError);
  const storedMeta = readJsonStorage(config.storage.meta, null, recordError);
  const storedSelection = readJsonStorage(config.storage.selection, null, recordError);

  if (!Array.isArray(storedBoxes) || !storedBoxes.length || !Array.isArray(storedCards)) {
    state.modes[modeId] = freshModeState(library);
    return { fresh: true };
  }

  const officialBoxes = new Map(library.boxes.map(box => [box.id, box]));
  const officialCards = new Map(library.cards.map(card => [card.id, card]));
  const installedVersion = String(storedMeta?.installedVersion || "");
  const mimeRepair = legacyMimeRepairPlan(modeId, storedCards, storedMeta, library);
  const autoMigrateOfficialContent = mimeRepair.needed || shouldAutoMigrateLibrary(
    modeId,
    installedVersion,
    library.libraryVersion
  );

  const boxes = storedBoxes.map(box => {
    const official = officialBoxes.get(box.id);
    if (!official) return {
      ...box,
      origin: box.origin || "personal",
      locallyModified: true,
      protected: box.id === UNCATEGORIZED_ID || box.protected === true
    };
    return {
      ...box,
      origin: "official",
      locallyModified: box.locallyModified === true ||
        (!autoMigrateOfficialContent && !sameBoxAsOfficial(box, official)),
      protected: box.id === UNCATEGORIZED_ID || box.protected === true
    };
  });

  const cards = storedCards.map(card => {
    const official = officialCards.get(card.id);
    const normalizedCard = {
      ...card,
      difficulty: normalizeDifficulty(card.difficulty, modeId, card)
    };
    if (!official) return {
      ...normalizedCard,
      active: card.active !== false,
      origin: card.origin || "personal",
      locallyModified: true
    };
    return {
      ...normalizedCard,
      active: card.active !== false,
      origin: "official",
      locallyModified: card.locallyModified === true ||
        (!autoMigrateOfficialContent && !sameCardAsOfficial(modeId, normalizedCard, official))
    };
  });

  const localBoxIds = new Set(boxes.map(box => box.id));
  const localCardIds = new Set(cards.map(card => card.id));
  const selectionObject = storedSelection && !Array.isArray(storedSelection) ? storedSelection : null;
  const selectedBoxIds = Array.isArray(storedSelection)
    ? storedSelection
    : (
        Array.isArray(selectionObject?.boxIds)
          ? selectionObject.boxIds
          : (modeId === "lyrics" && Array.isArray(legacySettings?.selectedBoxIds)
              ? legacySettings.selectedBoxIds
              : (modeId === "drinking" ? boxes.filter(box => box.adult !== true).map(box => box.id) : boxes.map(box => box.id)))
      );

  state.modes[modeId] = {
    officialLibrary: library,
    boxes,
    cards,
    selectedBoxIds,
    selectedDifficultyIds: Array.isArray(selectionObject?.difficultyIds)
      ? selectionObject.difficultyIds
      : ["easy", "medium", "hard"],
    libraryMeta: {
      installedVersion: storedMeta?.installedVersion || library.libraryVersion,
      availableVersion: library.libraryVersion,
      lastCheckedAt: storedMeta?.lastCheckedAt || "",
      deletedOfficialCardIds: mimeRepair.needed
        ? mimeRepair.deletedCardIds
        : (autoMigrateOfficialContent
            ? cleanIdList(storedMeta?.deletedOfficialCardIds)
            : cleanIdList(
                storedMeta?.deletedOfficialCardIds ||
                library.cards.filter(card => !localCardIds.has(card.id)).map(card => card.id)
              )),
      deletedOfficialBoxIds: mimeRepair.needed
        ? mimeRepair.deletedBoxIds
        : (autoMigrateOfficialContent
            ? cleanIdList(storedMeta?.deletedOfficialBoxIds)
            : cleanIdList(
                storedMeta?.deletedOfficialBoxIds ||
                library.boxes.filter(box => box.id !== UNCATEGORIZED_ID && !localBoxIds.has(box.id)).map(box => box.id)
              ))
    }
  };

  sanitizeMode(modeId, state.modes[modeId], library);
  if (autoMigrateOfficialContent) mergeModeLibrary(modeId, library);
  return { fresh: false };
}


function normalizeDifficultyIds(difficultyIds, fallback = DIFFICULTY_ORDER) {
  const normalized = cleanIdList(difficultyIds).filter(id => DIFFICULTY_ORDER.includes(id));
  return normalized.length ? DIFFICULTY_ORDER.filter(id => normalized.includes(id)) : [...fallback];
}

function sameDifficultySelection(first, second) {
  return normalizeDifficultyIds(first).join("|") === normalizeDifficultyIds(second).join("|");
}

function defaultPlayerName(index) {
  return index === 0 ? "Camille" : `Joueur ${index + 1}`;
}

function normalizedPlayerName(value, index) {
  const fallback = defaultPlayerName(index);
  const cleaned = String(value || fallback).trim().slice(0, 24) || fallback;
  return index === 0 && cleaned === "Joueur 1" ? "Camille" : cleaned;
}

function normalizeMultiplayerPlayers(players) {
  const source = Array.isArray(players) ? players : [];
  const normalized = source
    .slice(0, MAX_MULTIPLAYER_PLAYERS)
    .map((player, index) => ({
      id: String(player?.id || `player-${index + 1}`),
      name: normalizedPlayerName(player?.name, index)
    }));
  while (normalized.length < MIN_MULTIPLAYER_PLAYERS) {
    const index = normalized.length;
    normalized.push({ id: `player-${index + 1}`, name: defaultPlayerName(index) });
  }
  const usedIds = new Set();
  normalized.forEach((player, index) => {
    let id = player.id;
    while (usedIds.has(id)) id = `player-${index + 1}-${usedIds.size + 1}`;
    player.id = id;
    usedIds.add(id);
  });
  return normalized;
}

function normalizeDrinkingPlayers(players) {
  const source = Array.isArray(players) ? players : [];
  const normalized = source.slice(0, 12).map((player, index) => ({
    id: String(player?.id || `drink-player-${index + 1}`),
    name: normalizedPlayerName(player?.name, index),
    teamSoft: player?.teamSoft === true
  }));
  while (normalized.length < 2) {
    const index = normalized.length;
    normalized.push({ id: `drink-player-${index + 1}`, name: defaultPlayerName(index), teamSoft: false });
  }
  return normalized;
}

export async function loadContent() {
  const legacySettings = readJsonStorage(LEGACY_SETTINGS_KEY, null, recordError);
  const globalSettings = readJsonStorage(GLOBAL_SETTINGS_KEY, null, recordError);

  state.settings = {
    selectedModeIds: Array.isArray(globalSettings?.selectedModeIds)
      ? globalSettings.selectedModeIds.filter(id => MODE_ORDER.includes(id))
      : MODE_ORDER.filter(id => !["draw", "drinking"].includes(id)),
    vibrationEnabled: globalSettings?.vibrationEnabled ?? legacySettings?.vibrationEnabled ?? true,
    playType: globalSettings?.playType === "multiplayer" ? "multiplayer" : "free",
    globalDifficultyIds: normalizeDifficultyIds(globalSettings?.globalDifficultyIds),
    multiplayer: {
      players: normalizeMultiplayerPlayers(globalSettings?.multiplayer?.players),
      cycles: Math.min(10, Math.max(1, Number(globalSettings?.multiplayer?.cycles) || 1)),
      flowType: globalSettings?.multiplayer?.flowType === "mode-blocks" ? "mode-blocks" : "continuous",
      orderType: globalSettings?.multiplayer?.orderType === "common" ? "common" : "balanced"
    },
    lastLibraryCheckAt: String(globalSettings?.lastLibraryCheckAt || ""),
    modeOptions: {
      words: {
        showForbiddenWords: globalSettings?.modeOptions?.words?.showForbiddenWords !== false
      },
      draw: {
        attemptCount: [3, 5, 7, 10].includes(Number(globalSettings?.modeOptions?.draw?.attemptCount))
          ? Number(globalSettings.modeOptions.draw.attemptCount) : 3,
        durations: {
          easy: Math.min(120, Math.max(10, Number(globalSettings?.modeOptions?.draw?.durations?.easy) || 30)),
          medium: Math.min(120, Math.max(10, Number(globalSettings?.modeOptions?.draw?.durations?.medium) || 45)),
          hard: Math.min(180, Math.max(10, Number(globalSettings?.modeOptions?.draw?.durations?.hard) || 60))
        },
        soundEnabled: globalSettings?.modeOptions?.draw?.soundEnabled !== false,
        mixedCount: Math.min(5, Math.max(1, Number(globalSettings?.modeOptions?.draw?.mixedCount) || 2)),
        arrivalSoundEnabled: globalSettings?.modeOptions?.draw?.arrivalSoundEnabled !== false
      },
      drinking: {
        adultMode: globalSettings?.modeOptions?.drinking?.adultMode === true,
        maxPenalty: Math.min(10, Math.max(1, Number(globalSettings?.modeOptions?.drinking?.maxPenalty) || 3)),
        softPenaltyMode: ["points", "tokens", "mini_challenge", "joker"].includes(globalSettings?.modeOptions?.drinking?.softPenaltyMode)
          ? globalSettings.modeOptions.drinking.softPenaltyMode : "points",
        endType: globalSettings?.modeOptions?.drinking?.endType === "minutes" ? "minutes" : "cards",
        cardLimit: Math.min(250, Math.max(5, Number(globalSettings?.modeOptions?.drinking?.cardLimit) || 30)),
        durationMinutes: [15, 30, 45, 60].includes(Number(globalSettings?.modeOptions?.drinking?.durationMinutes))
          ? Number(globalSettings.modeOptions.drinking.durationMinutes) : 30,
        players: normalizeDrinkingPlayers(globalSettings?.modeOptions?.drinking?.players)
      }
    }
  };

  const freshModes = {};
  for (const modeId of MODE_ORDER) {
    freshModes[modeId] = (await loadMode(modeId, legacySettings)).fresh;
  }

  if (freshModes.words && !state.settings.selectedModeIds.includes("words")) {
    state.settings.selectedModeIds.push("words");
  }

  const drinkingMode = modeState("drinking");
  const adultBoxId = drinkingMode.boxes.find(box => box.adult === true)?.id || "apres_minuit";
  if (state.settings.modeOptions.drinking.adultMode) {
    if (!drinkingMode.selectedBoxIds.includes(adultBoxId)) drinkingMode.selectedBoxIds.push(adultBoxId);
  } else {
    drinkingMode.selectedBoxIds = drinkingMode.selectedBoxIds.filter(id => id !== adultBoxId);
  }

  if (!Array.isArray(globalSettings?.globalDifficultyIds) || !globalSettings.globalDifficultyIds.length) {
    const selections = MODE_ORDER.map(modeId => normalizeDifficultyIds(modeState(modeId).selectedDifficultyIds));
    state.settings.globalDifficultyIds = selections.every(selection => sameDifficultySelection(selection, selections[0]))
      ? [...selections[0]]
      : [...DIFFICULTY_ORDER];
  }

  state.flipped = readTextStorage("mdb-flipped") === "1";
  saveAllData();
}

export function saveMode(modeId) {
  const config = modeConfig(modeId);
  const mode = modeState(modeId);
  writeJsonStorage(config.storage.boxes, mode.boxes);
  writeJsonStorage(config.storage.cards, mode.cards);
  writeJsonStorage(config.storage.meta, mode.libraryMeta);
  writeJsonStorage(config.storage.selection, {
    boxIds: mode.selectedBoxIds,
    difficultyIds: mode.selectedDifficultyIds
  });
}

export function saveGlobalSettings() {
  writeJsonStorage(GLOBAL_SETTINGS_KEY, state.settings);
}

export function saveAllData() {
  MODE_ORDER.forEach(saveMode);
  saveGlobalSettings();
}

export function getBoxName(modeId, boxId) {
  return modeState(modeId).boxes.find(box => box.id === boxId)?.name || "Sans catégorie";
}

export function activeCountForBox(modeId, boxId) {
  return modeState(modeId).cards.filter(card => card.boxId === boxId && card.active).length;
}

export function filteredCardsForMode(modeId) {
  const mode = modeState(modeId);
  const selectedBoxes = new Set(mode.selectedBoxIds);
  const selectedDifficulties = new Set(normalizeDifficultyIds(mode.selectedDifficultyIds));
  return mode.cards
    .filter(card =>
      card.active &&
      selectedBoxes.has(card.boxId) &&
      selectedDifficulties.has(normalizeDifficulty(card.difficulty, modeId, card))
    )
    .map(card => ({ ...card, modeId }));
}

export function selectedCardsForMode(modeId) {
  return state.settings.selectedModeIds.includes(modeId) ? filteredCardsForMode(modeId) : [];
}

export function activeCardCountForMode(modeId) {
  return modeState(modeId).cards.filter(card => card.active).length;
}

export function selectedCardTotals() {
  return state.settings.selectedModeIds.reduce((totals, modeId) => ({
    selected: totals.selected + filteredCardsForMode(modeId).length,
    total: totals.total + activeCardCountForMode(modeId)
  }), { selected: 0, total: 0 });
}

export function getPlayableCards({ excludeModeIds = [] } = {}) {
  const excluded = new Set(excludeModeIds);
  return MODE_ORDER.filter(modeId => !excluded.has(modeId)).flatMap(selectedCardsForMode);
}

export function hasLibraryUpdate() {
  return MODE_ORDER.some(modeId => {
    const meta = modeState(modeId).libraryMeta;
    return meta.installedVersion !== meta.availableVersion;
  });
}

export async function checkLibraries() {
  let failed = 0;
  for (const modeId of MODE_ORDER) {
    try {
      const library = await fetchOfficialLibrary(modeId, {
        forceNetwork: true,
        allowFallback: false
      });
      const mode = modeState(modeId);
      mode.officialLibrary = library;
      mode.libraryMeta.availableVersion = library.libraryVersion;
      mode.libraryMeta.lastCheckedAt = new Date().toISOString();
      saveMode(modeId);
    } catch {
      failed += 1;
    }
  }
  state.settings.lastLibraryCheckAt = new Date().toISOString();
  saveGlobalSettings();
  return { failed };
}

export function mergeModeLibrary(modeId, library) {
  const mode = modeState(modeId);
  const deletedBoxIds = new Set(mode.libraryMeta.deletedOfficialBoxIds);
  const deletedCardIds = new Set(mode.libraryMeta.deletedOfficialCardIds);
  const localBoxes = new Map(mode.boxes.map(box => [box.id, box]));
  const localCards = new Map(mode.cards.map(card => [card.id, card]));
  const stats = { boxesAdded: 0, boxesUpdated: 0, cardsAdded: 0, cardsUpdated: 0, localPreserved: 0 };

  library.boxes.forEach(officialBox => {
    if (deletedBoxIds.has(officialBox.id)) return;
    const existing = localBoxes.get(officialBox.id);
    if (!existing) {
      const created = officialBoxFrom(officialBox);
      mode.boxes.splice(Math.max(0, mode.boxes.length - 1), 0, created);
      localBoxes.set(created.id, created);
      if (!(modeId === "drinking" && created.adult === true && !state.settings.modeOptions.drinking.adultMode) &&
          !mode.selectedBoxIds.includes(created.id)) mode.selectedBoxIds.push(created.id);
      stats.boxesAdded += 1;
    } else if (existing.origin === "official" && !existing.locallyModified) {
      Object.assign(existing, officialBoxFrom(officialBox));
      stats.boxesUpdated += 1;
    } else {
      stats.localPreserved += 1;
    }
  });

  library.cards.forEach(officialCard => {
    if (deletedCardIds.has(officialCard.id) || deletedBoxIds.has(officialCard.boxId)) return;
    const existing = localCards.get(officialCard.id);
    if (!existing) {
      const created = officialCardFrom(officialCard);
      if (!mode.boxes.some(box => box.id === created.boxId)) created.boxId = UNCATEGORIZED_ID;
      mode.cards.push(created);
      localCards.set(created.id, created);
      stats.cardsAdded += 1;
    } else if (existing.origin === "official" && !existing.locallyModified) {
      const replacement = officialCardFrom(officialCard);
      if (!mode.boxes.some(box => box.id === replacement.boxId)) replacement.boxId = UNCATEGORIZED_ID;
      Object.assign(existing, replacement);
      stats.cardsUpdated += 1;
    } else {
      stats.localPreserved += 1;
    }
  });

  mode.officialLibrary = library;
  mode.libraryMeta.installedVersion = library.libraryVersion;
  mode.libraryMeta.availableVersion = library.libraryVersion;
  mode.libraryMeta.lastCheckedAt = new Date().toISOString();
  saveMode(modeId);
  return stats;
}

export async function updateLibraries() {
  const totals = { cardsAdded: 0, cardsUpdated: 0, boxesAdded: 0, localPreserved: 0, failed: 0 };
  for (const modeId of MODE_ORDER) {
    const mode = modeState(modeId);
    if (mode.libraryMeta.installedVersion === mode.libraryMeta.availableVersion) continue;
    try {
      const library = await fetchOfficialLibrary(modeId, { forceNetwork: true, allowFallback: false });
      const stats = mergeModeLibrary(modeId, library);
      totals.cardsAdded += stats.cardsAdded;
      totals.cardsUpdated += stats.cardsUpdated;
      totals.boxesAdded += stats.boxesAdded;
      totals.localPreserved += stats.localPreserved;
    } catch {
      totals.failed += 1;
    }
  }
  state.settings.lastLibraryCheckAt = new Date().toISOString();
  saveGlobalSettings();
  return totals;
}

export async function resetLibraries() {
  const snapshots = {};
  for (const modeId of MODE_ORDER) {
    snapshots[modeId] = await fetchOfficialLibrary(modeId, { forceNetwork: true, allowFallback: false });
  }

  for (const modeId of MODE_ORDER) {
    const mode = modeState(modeId);
    const library = snapshots[modeId];
    const personalBoxes = mode.boxes.filter(box => box.origin === "personal");
    const personalCards = mode.cards.filter(card => card.origin === "personal");
    const officialBoxes = library.boxes.map(officialBoxFrom);
    const allBoxes = [
      ...officialBoxes.filter(box => box.id !== UNCATEGORIZED_ID),
      ...personalBoxes
    ];
    const uncategorized = officialBoxes.find(box => box.id === UNCATEGORIZED_ID);
    if (uncategorized) allBoxes.push(uncategorized);

    const validBoxIds = new Set(allBoxes.map(box => box.id));
    personalCards.forEach(card => {
      if (!validBoxIds.has(card.boxId)) card.boxId = UNCATEGORIZED_ID;
    });

    mode.boxes = allBoxes;
    mode.cards = [...library.cards.map(officialCardFrom), ...personalCards];
    mode.officialLibrary = library;
    mode.libraryMeta = {
      installedVersion: library.libraryVersion,
      availableVersion: library.libraryVersion,
      lastCheckedAt: new Date().toISOString(),
      deletedOfficialCardIds: [],
      deletedOfficialBoxIds: []
    };
    mode.selectedBoxIds = mode.selectedBoxIds.filter(id => validBoxIds.has(id));
    library.boxes.forEach(box => {
      if (modeId === "drinking" && box.adult === true && !state.settings.modeOptions.drinking.adultMode) return;
      if (!mode.selectedBoxIds.includes(box.id)) mode.selectedBoxIds.push(box.id);
    });
    saveMode(modeId);
  }
}
