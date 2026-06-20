import {
  APP_VERSION,
  CARD_REMOVAL_REPORTS_KEY,
  CARD_REMOVAL_REPORT_SCHEMA,
  MODE_ORDER
} from "../config/config.js";
import { modeState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { readJsonStorage, writeJsonStorage } from "../core/storage.js";
import { modeConfig, saveMode } from "./libraries.js";

const REPORT_KIND = "mdb-deleted-cards-report";

function emptyStore() {
  return {
    schema: CARD_REMOVAL_REPORT_SCHEMA,
    entries: []
  };
}

function cleanCardSnapshot(card) {
  if (!card || typeof card !== "object") return null;
  const snapshot = clone(card);
  delete snapshot.modeId;
  delete snapshot.origin;
  delete snapshot.locallyModified;
  delete snapshot.targetIds;
  delete snapshot.renderedPrompt;
  return snapshot;
}

function normalizeEntry(entry) {
  if (!entry || !entry.modeId || !entry.cardId) return null;
  return {
    key: `${entry.modeId}::${entry.cardId}`,
    modeId: String(entry.modeId),
    modeName: String(entry.modeName || modeConfig(entry.modeId)?.name || entry.modeId),
    cardId: String(entry.cardId),
    origin: entry.origin === "personal" ? "personal" : "official",
    source: String(entry.source || "in_game"),
    reason: String(entry.reason || "quality_rejection"),
    firstRemovedAt: String(entry.firstRemovedAt || entry.lastRemovedAt || new Date().toISOString()),
    lastRemovedAt: String(entry.lastRemovedAt || entry.firstRemovedAt || new Date().toISOString()),
    occurrences: Math.max(1, Number(entry.occurrences) || 1),
    libraryVersion: String(entry.libraryVersion || ""),
    category: entry.category && typeof entry.category === "object"
      ? {
          id: String(entry.category.id || ""),
          name: String(entry.category.name || "Sans catégorie")
        }
      : null,
    card: cleanCardSnapshot(entry.card),
    officialCard: cleanCardSnapshot(entry.officialCard)
  };
}

function normalizeStore(raw) {
  const entries = Array.isArray(raw?.entries)
    ? raw.entries.map(normalizeEntry).filter(Boolean)
    : [];
  const unique = new Map();
  entries.forEach(entry => {
    const current = unique.get(entry.key);
    if (!current) {
      unique.set(entry.key, entry);
      return;
    }
    current.firstRemovedAt = current.firstRemovedAt < entry.firstRemovedAt
      ? current.firstRemovedAt : entry.firstRemovedAt;
    current.lastRemovedAt = current.lastRemovedAt > entry.lastRemovedAt
      ? current.lastRemovedAt : entry.lastRemovedAt;
    current.occurrences += entry.occurrences;
    current.card ||= entry.card;
    current.officialCard ||= entry.officialCard;
  });
  return {
    schema: CARD_REMOVAL_REPORT_SCHEMA,
    entries: [...unique.values()].sort((a, b) => b.lastRemovedAt.localeCompare(a.lastRemovedAt))
  };
}

export function readCardRemovalStore() {
  return normalizeStore(readJsonStorage(CARD_REMOVAL_REPORTS_KEY, emptyStore()));
}

export function writeCardRemovalStore(data) {
  const normalized = normalizeStore(data);
  writeJsonStorage(CARD_REMOVAL_REPORTS_KEY, normalized);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mdb:card-removals-changed", {
      detail: { count: normalized.entries.length }
    }));
  }
  return normalized;
}

export function getCardRemovalCount() {
  return readCardRemovalStore().entries.length;
}

function recordRemoval(modeId, card, source, reason) {
  const mode = modeState(modeId);
  const config = modeConfig(modeId);
  const officialCard = mode.officialLibrary?.cards?.find(item => item.id === card.id) || null;
  const box = mode.boxes.find(item => item.id === card.boxId) || null;
  const store = readCardRemovalStore();
  const key = `${modeId}::${card.id}`;
  const now = new Date().toISOString();
  const existing = store.entries.find(entry => entry.key === key);

  if (existing) {
    existing.lastRemovedAt = now;
    existing.occurrences += 1;
    existing.source = source || existing.source;
    existing.reason = reason || existing.reason;
    existing.card = cleanCardSnapshot(card) || existing.card;
    existing.officialCard = cleanCardSnapshot(officialCard) || existing.officialCard;
  } else {
    store.entries.push({
      key,
      modeId,
      modeName: config.name,
      cardId: card.id,
      origin: card.origin === "personal" ? "personal" : "official",
      source: source || "in_game",
      reason: reason || "quality_rejection",
      firstRemovedAt: now,
      lastRemovedAt: now,
      occurrences: 1,
      libraryVersion: String(mode.libraryMeta?.installedVersion || ""),
      category: box ? { id: box.id, name: box.name } : null,
      card: cleanCardSnapshot(card),
      officialCard: cleanCardSnapshot(officialCard)
    });
  }

  return writeCardRemovalStore(store);
}

export function removeCardDuringGame(modeId, cardId, {
  source = "in_game",
  reason = "quality_rejection"
} = {}) {
  const mode = modeState(modeId);
  const card = mode?.cards?.find(item => item.id === cardId);
  if (!mode || !card) return null;

  recordRemoval(modeId, card, source, reason);
  if (card.origin === "official" && !mode.libraryMeta.deletedOfficialCardIds.includes(card.id)) {
    mode.libraryMeta.deletedOfficialCardIds.push(card.id);
  }
  mode.cards = mode.cards.filter(item => item.id !== card.id);
  saveMode(modeId);
  return clone(card);
}

export function createCardRemovalReport() {
  const store = readCardRemovalStore();
  const byMode = Object.fromEntries(MODE_ORDER.map(modeId => [modeId, 0]));
  store.entries.forEach(entry => {
    byMode[entry.modeId] = (byMode[entry.modeId] || 0) + 1;
  });
  return {
    kind: REPORT_KIND,
    schemaVersion: CARD_REMOVAL_REPORT_SCHEMA,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    privacy: "Aucun prénom de joueur ni contenu de partie n’est inclus.",
    summary: {
      uniqueCards: store.entries.length,
      byMode
    },
    deletions: clone(store.entries)
  };
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCardRemovalReport() {
  const report = createCardRemovalReport();
  if (!report.deletions.length) return false;
  downloadJson(
    report,
    `mdb-cartes-supprimees-${new Date().toISOString().slice(0, 10)}.json`
  );
  return true;
}

export function clearCardRemovalReports() {
  writeCardRemovalStore(emptyStore());
}

export function restoreCardRemovalStore(data) {
  if (!data) return;
  writeCardRemovalStore(data);
}

export function restoreRemovedCard(modeId, card) {
  const mode = modeState(modeId);
  if (!mode || !card?.id) return false;
  if (!mode.cards.some(item => item.id === card.id)) {
    const restored = {
      ...clone(card),
      origin: card.origin || (mode.officialLibrary?.cards?.some(item => item.id === card.id) ? "official" : "personal"),
      locallyModified: card.locallyModified === true,
      active: card.active !== false
    };
    const officialOrder = new Map((mode.officialLibrary?.cards || []).map((item, index) => [item.id, index]));
    const restoredOrder = officialOrder.get(restored.id);
    if (Number.isInteger(restoredOrder)) {
      const insertAt = mode.cards.findIndex(item => {
        const order = officialOrder.get(item.id);
        return Number.isInteger(order) && order > restoredOrder;
      });
      if (insertAt >= 0) mode.cards.splice(insertAt, 0, restored);
      else mode.cards.push(restored);
    } else {
      mode.cards.unshift(restored);
    }
  }
  mode.libraryMeta.deletedOfficialCardIds = (mode.libraryMeta.deletedOfficialCardIds || [])
    .filter(id => id !== card.id);
  const store = readCardRemovalStore();
  store.entries = store.entries.filter(entry => entry.key !== `${modeId}::${card.id}`);
  writeCardRemovalStore(store);
  saveMode(modeId);
  return true;
}
