import {
  APP_VERSION,
  GAMEPLAY_FEEDBACK_KEY,
  GAMEPLAY_FEEDBACK_SCHEMA,
  MODE_ORDER
} from "../config/config.js";
import { modeState } from "../core/state.js";
import { clone, normalizeDifficulty } from "../core/utils.js";
import { readJsonStorage, writeJsonStorage } from "../core/storage.js";
import { getBoxName, modeConfig } from "./libraries.js";

const REPORT_KIND = "mdb-card-gameplay-report";
const RESULT_IDS = new Set(["valid", "passed", "expired"]);

function randomId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function cleanCardSnapshot(card) {
  if (!card || typeof card !== "object") return null;
  const output = clone(card);
  delete output.modeId;
  delete output.targetIds;
  delete output.renderedPrompt;
  delete output.origin;
  delete output.locallyModified;
  return output;
}

function emptyStore() {
  return {
    schemaVersion: GAMEPLAY_FEEDBACK_SCHEMA,
    entries: []
  };
}

function normalizeEntry(entry) {
  if (!entry?.modeId || !entry?.cardId) return null;
  return {
    key: `${entry.modeId}::${entry.cardId}`,
    modeId: String(entry.modeId),
    modeName: String(entry.modeName || modeConfig(entry.modeId)?.name || entry.modeId),
    cardId: String(entry.cardId),
    category: entry.category && typeof entry.category === "object"
      ? { id: String(entry.category.id || ""), name: String(entry.category.name || "Sans catégorie") }
      : null,
    difficulty: ["easy", "medium", "hard"].includes(entry.difficulty) ? entry.difficulty : "medium",
    libraryVersion: String(entry.libraryVersion || ""),
    card: cleanCardSnapshot(entry.card),
    firstShownAt: String(entry.firstShownAt || entry.lastShownAt || ""),
    lastShownAt: String(entry.lastShownAt || entry.firstShownAt || ""),
    shownCount: Math.max(0, Number(entry.shownCount) || 0),
    validCount: Math.max(0, Number(entry.validCount) || 0),
    passedCount: Math.max(0, Number(entry.passedCount) || 0),
    expiredCount: Math.max(0, Number(entry.expiredCount) || 0),
    totalUsedMs: Math.max(0, Number(entry.totalUsedMs) || 0),
    recentEvents: Array.isArray(entry.recentEvents)
      ? entry.recentEvents.slice(-40).map(event => ({
          id: String(event?.id || randomId("game-event")),
          result: RESULT_IDS.has(event?.result) ? event.result : "passed",
          at: String(event?.at || new Date().toISOString()),
          usedMs: Math.max(0, Number(event?.usedMs) || 0),
          difficulty: ["easy", "medium", "hard"].includes(event?.difficulty) ? event.difficulty : "medium"
        }))
      : []
  };
}

function normalizeStore(raw) {
  const unique = new Map();
  (Array.isArray(raw?.entries) ? raw.entries : [])
    .map(normalizeEntry)
    .filter(Boolean)
    .forEach(entry => unique.set(entry.key, entry));
  return {
    schemaVersion: GAMEPLAY_FEEDBACK_SCHEMA,
    entries: [...unique.values()].sort((a, b) => a.key.localeCompare(b.key))
  };
}

export function readGameplayStore() {
  return normalizeStore(readJsonStorage(GAMEPLAY_FEEDBACK_KEY, emptyStore()));
}

export function writeGameplayStore(raw) {
  const store = normalizeStore(raw);
  writeJsonStorage(GAMEPLAY_FEEDBACK_KEY, store);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("mdb:gameplay-feedback-changed", {
      detail: gameplaySummary(store)
    }));
  }
  return store;
}

function snapshotForCard(modeId, card) {
  const mode = modeState(modeId);
  return {
    modeName: modeConfig(modeId).name,
    category: {
      id: String(card.boxId || ""),
      name: getBoxName(modeId, card.boxId)
    },
    difficulty: normalizeDifficulty(card.difficulty, modeId, card),
    libraryVersion: String(mode?.libraryMeta?.installedVersion || ""),
    card: cleanCardSnapshot(card)
  };
}

function entryFor(store, modeId, card) {
  const key = `${modeId}::${card.id}`;
  let entry = store.entries.find(item => item.key === key);
  if (!entry) {
    entry = {
      key,
      modeId,
      cardId: card.id,
      ...snapshotForCard(modeId, card),
      firstShownAt: "",
      lastShownAt: "",
      shownCount: 0,
      validCount: 0,
      passedCount: 0,
      expiredCount: 0,
      totalUsedMs: 0,
      recentEvents: []
    };
    store.entries.push(entry);
  }
  Object.assign(entry, snapshotForCard(modeId, card));
  return entry;
}

export function recordGameplayShown(modeId, card) {
  if (!modeId || !card?.id) return null;
  const store = readGameplayStore();
  const entry = entryFor(store, modeId, card);
  const now = new Date().toISOString();
  entry.firstShownAt ||= now;
  entry.lastShownAt = now;
  entry.shownCount += 1;
  writeGameplayStore(store);
  return clone(entry);
}

export function recordGameplayOutcome(modeId, card, result, { usedMs = 0 } = {}) {
  if (!modeId || !card?.id || !RESULT_IDS.has(result)) return null;
  const store = readGameplayStore();
  const entry = entryFor(store, modeId, card);
  const event = {
    id: randomId("game-event"),
    result,
    at: new Date().toISOString(),
    usedMs: Math.max(0, Number(usedMs) || 0),
    difficulty: normalizeDifficulty(card.difficulty, modeId, card)
  };
  entry.recentEvents.push(event);
  entry.recentEvents = entry.recentEvents.slice(-40);
  if (result === "valid") entry.validCount += 1;
  else if (result === "expired") entry.expiredCount += 1;
  else entry.passedCount += 1;
  entry.totalUsedMs += event.usedMs;
  writeGameplayStore(store);
  return event.id;
}

export function undoGameplayOutcome(eventId) {
  if (!eventId) return false;
  const store = readGameplayStore();
  for (const entry of store.entries) {
    const index = entry.recentEvents.findIndex(event => event.id === eventId);
    if (index < 0) continue;
    const [event] = entry.recentEvents.splice(index, 1);
    if (event.result === "valid") entry.validCount = Math.max(0, entry.validCount - 1);
    else if (event.result === "expired") entry.expiredCount = Math.max(0, entry.expiredCount - 1);
    else entry.passedCount = Math.max(0, entry.passedCount - 1);
    entry.totalUsedMs = Math.max(0, entry.totalUsedMs - (Number(event.usedMs) || 0));
    writeGameplayStore(store);
    return true;
  }
  return false;
}

export function gameplaySummary(input = null) {
  const store = input ? normalizeStore(input) : readGameplayStore();
  const summary = {
    cardsTracked: store.entries.length,
    shown: 0,
    valid: 0,
    passed: 0,
    expired: 0,
    byMode: Object.fromEntries(MODE_ORDER.map(modeId => [modeId, {
      cardsTracked: 0,
      shown: 0,
      valid: 0,
      passed: 0,
      expired: 0
    }]))
  };
  store.entries.forEach(entry => {
    summary.shown += entry.shownCount;
    summary.valid += entry.validCount;
    summary.passed += entry.passedCount;
    summary.expired += entry.expiredCount;
    const mode = summary.byMode[entry.modeId] ||= { cardsTracked: 0, shown: 0, valid: 0, passed: 0, expired: 0 };
    mode.cardsTracked += 1;
    mode.shown += entry.shownCount;
    mode.valid += entry.validCount;
    mode.passed += entry.passedCount;
    mode.expired += entry.expiredCount;
  });
  return summary;
}

export function createGameplayReport() {
  const store = readGameplayStore();
  return {
    kind: REPORT_KIND,
    schemaVersion: GAMEPLAY_FEEDBACK_SCHEMA,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    interpretation: {
      shown: "Nombre d'affichages réels en partie.",
      valid: "Carte réussie ; signal de jouabilité, pas verdict éditorial absolu.",
      passed: "Carte passée volontairement ; signal secondaire à interpréter selon le nombre d'affichages.",
      expired: "Temps écoulé sur cette carte ou ce dessin ; signal secondaire."
    },
    summary: gameplaySummary(store),
    cards: store.entries.map(({ recentEvents, ...entry }) => clone(entry))
  };
}

export function gameplayEntryMap() {
  return new Map(readGameplayStore().entries.map(entry => [entry.key, entry]));
}

export function restoreGameplayStore(raw) {
  return writeGameplayStore(raw || emptyStore());
}
