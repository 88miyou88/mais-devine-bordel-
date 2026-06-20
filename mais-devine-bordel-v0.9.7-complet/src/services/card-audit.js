import {
  APP_VERSION,
  AUDIT_INSTALLATION_ID_KEY,
  AUDIT_STORE_KEY,
  AUDIT_STORE_SCHEMA,
  DIFFICULTY_ORDER,
  MODE_ORDER
} from "../config/config.js";
import { modeState } from "../core/state.js";
import { clone, normalizeDifficulty } from "../core/utils.js";
import {
  readJsonStorage,
  readTextStorage,
  writeJsonStorage,
  writeTextStorage
} from "../core/storage.js";
import {
  removeCardDuringGame,
  restoreRemovedCard
} from "./card-removals.js";
import {
  getBoxName,
  modeConfig,
  sanitizeMode,
  saveMode
} from "./libraries.js";
import {
  createGameplayReport,
  gameplayEntryMap,
  readGameplayStore,
  restoreGameplayStore
} from "./gameplay-feedback.js";

const REPORT_KIND = "mdb-card-audit-report";
const STATUS_IDS = new Set(["seen", "neutral", "liked", "review", "deleted"]);

function randomId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function computeAuditFingerprint(modeId, card) {
  const snapshot = cleanCardSnapshot(card) || {};
  delete snapshot.auditStatus;
  delete snapshot.auditFingerprint;
  delete snapshot.origin;
  delete snapshot.locallyModified;
  const text = `${modeId}|${stableSerialize(snapshot)}`;
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

export function getAuditInstallationId() {
  let id = readTextStorage(AUDIT_INSTALLATION_ID_KEY, "");
  if (!id) {
    id = randomId("install");
    writeTextStorage(AUDIT_INSTALLATION_ID_KEY, id);
  }
  return id;
}

function emptyStore() {
  return {
    schemaVersion: AUDIT_STORE_SCHEMA,
    installationId: getAuditInstallationId(),
    entries: [],
    currentSession: null,
    completedSessions: []
  };
}

function cleanCardSnapshot(card) {
  if (!card || typeof card !== "object") return null;
  const snapshot = clone(card);
  delete snapshot.modeId;
  delete snapshot.targetIds;
  delete snapshot.renderedPrompt;
  return snapshot;
}

function normalizeEntry(entry) {
  if (!entry?.modeId || !entry?.cardId) return null;
  const status = STATUS_IDS.has(entry.status) ? entry.status : "seen";
  const seenSessionIds = Array.isArray(entry.seenSessionIds)
    ? [...new Set(entry.seenSessionIds.map(String).filter(Boolean))].slice(-100)
    : [];
  return {
    key: `${entry.modeId}::${entry.cardId}`,
    modeId: String(entry.modeId),
    modeName: String(entry.modeName || modeConfig(entry.modeId)?.name || entry.modeId),
    cardId: String(entry.cardId),
    category: entry.category && typeof entry.category === "object"
      ? { id: String(entry.category.id || ""), name: String(entry.category.name || "Sans catégorie") }
      : null,
    difficulty: DIFFICULTY_ORDER.includes(entry.difficulty) ? entry.difficulty : "medium",
    origin: entry.origin === "personal" ? "personal" : "official",
    libraryVersion: String(entry.libraryVersion || ""),
    card: cleanCardSnapshot(entry.card),
    officialCard: cleanCardSnapshot(entry.officialCard),
    status,
    firstSeenAt: String(entry.firstSeenAt || entry.lastSeenAt || new Date().toISOString()),
    lastSeenAt: String(entry.lastSeenAt || entry.firstSeenAt || new Date().toISOString()),
    displayCount: Math.max(1, Number(entry.displayCount) || 1),
    sessionsSeen: Math.max(seenSessionIds.length, Number(entry.sessionsSeen) || 1),
    seenSessionIds,
    firstRatedAt: entry.firstRatedAt ? String(entry.firstRatedAt) : "",
    lastRatedAt: entry.lastRatedAt ? String(entry.lastRatedAt) : "",
    reasons: Array.isArray(entry.reasons) ? [...new Set(entry.reasons.map(String).filter(Boolean))] : [],
    customReason: String(entry.customReason || ""),
    edits: Array.isArray(entry.edits)
      ? entry.edits.slice(-50).map(edit => ({
          editedAt: String(edit?.editedAt || new Date().toISOString()),
          changes: edit?.changes && typeof edit.changes === "object" ? clone(edit.changes) : {},
          before: cleanCardSnapshot(edit?.before),
          after: cleanCardSnapshot(edit?.after)
        }))
      : []
  };
}

function normalizeSession(session) {
  if (!session?.id || !session?.modeId || !Array.isArray(session.queueKeys)) return null;
  return {
    id: String(session.id),
    modeId: String(session.modeId),
    boxIds: Array.isArray(session.boxIds) ? [...new Set(session.boxIds.map(String))] : [],
    difficultyIds: Array.isArray(session.difficultyIds)
      ? DIFFICULTY_ORDER.filter(id => session.difficultyIds.includes(id))
      : [...DIFFICULTY_ORDER],
    scope: ["unseen", "pending", "all", "neutral", "liked", "review"].includes(session.scope)
      ? session.scope : "unseen",
    queueKeys: [...new Set(session.queueKeys.map(String).filter(Boolean))],
    index: Math.max(0, Number(session.index) || 0),
    startedAt: String(session.startedAt || new Date().toISOString()),
    updatedAt: String(session.updatedAt || new Date().toISOString()),
    history: Array.isArray(session.history) ? session.history.slice(-100) : []
  };
}

function normalizeStore(raw) {
  const entries = Array.isArray(raw?.entries)
    ? raw.entries.map(normalizeEntry).filter(Boolean)
    : [];
  const unique = new Map();
  entries.forEach(entry => unique.set(entry.key, entry));
  return {
    schemaVersion: AUDIT_STORE_SCHEMA,
    installationId: String(raw?.installationId || getAuditInstallationId()),
    entries: [...unique.values()].sort((a, b) => a.key.localeCompare(b.key)),
    currentSession: normalizeSession(raw?.currentSession),
    completedSessions: Array.isArray(raw?.completedSessions)
      ? raw.completedSessions.slice(-100)
      : []
  };
}

export function readAuditStore() {
  return normalizeStore(readJsonStorage(AUDIT_STORE_KEY, emptyStore()));
}

export function writeAuditStore(raw) {
  const store = normalizeStore(raw);
  writeJsonStorage(AUDIT_STORE_KEY, store);
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("mdb:audit-changed", {
      detail: auditSummary(store)
    }));
  }
  return store;
}

function snapshotForCard(modeId, card) {
  const mode = modeState(modeId);
  const officialCard = mode.officialLibrary?.cards?.find(item => item.id === card.id) || null;
  return {
    modeName: modeConfig(modeId).name,
    category: {
      id: card.boxId,
      name: getBoxName(modeId, card.boxId)
    },
    difficulty: normalizeDifficulty(card.difficulty, modeId, card),
    origin: card.origin === "personal" ? "personal" : "official",
    libraryVersion: String(mode.libraryMeta?.installedVersion || ""),
    card: cleanCardSnapshot(card),
    officialCard: cleanCardSnapshot(officialCard)
  };
}

export function entryForCard(store, modeId, cardId) {
  return store.entries.find(entry => entry.key === `${modeId}::${cardId}`) || null;
}

export function markCardSeen(modeId, card, sessionId) {
  const store = readAuditStore();
  const key = `${modeId}::${card.id}`;
  const now = new Date().toISOString();
  let entry = entryForCard(store, modeId, card.id);
  if (!entry) {
    const snapshot = snapshotForCard(modeId, card);
    entry = {
      key,
      modeId,
      cardId: card.id,
      ...snapshot,
      status: "seen",
      firstSeenAt: now,
      lastSeenAt: now,
      displayCount: 0,
      sessionsSeen: 0,
      seenSessionIds: [],
      firstRatedAt: "",
      lastRatedAt: "",
      reasons: [],
      customReason: "",
      edits: []
    };
    store.entries.push(entry);
  }
  entry.lastSeenAt = now;
  entry.displayCount += 1;
  if (sessionId && !entry.seenSessionIds.includes(sessionId)) {
    entry.seenSessionIds.push(sessionId);
    entry.seenSessionIds = entry.seenSessionIds.slice(-100);
    entry.sessionsSeen = entry.seenSessionIds.length;
  }
  Object.assign(entry, snapshotForCard(modeId, card));
  writeAuditStore(store);
  return clone(entry);
}

export function setCardAuditStatus(modeId, card, status, {
  reasons = [],
  customReason = ""
} = {}) {
  if (!STATUS_IDS.has(status)) throw new Error(`Statut d’audit invalide : ${status}`);
  const store = readAuditStore();
  const now = new Date().toISOString();
  let entry = entryForCard(store, modeId, card.id);
  if (!entry) {
    const snapshot = snapshotForCard(modeId, card);
    entry = {
      key: `${modeId}::${card.id}`,
      modeId,
      cardId: card.id,
      ...snapshot,
      status: "seen",
      firstSeenAt: now,
      lastSeenAt: now,
      displayCount: 1,
      sessionsSeen: 1,
      seenSessionIds: [],
      firstRatedAt: "",
      lastRatedAt: "",
      reasons: [],
      customReason: "",
      edits: []
    };
    store.entries.push(entry);
  }
  entry.status = status;
  entry.firstRatedAt ||= now;
  entry.lastRatedAt = now;
  entry.reasons = [...new Set((reasons || []).map(String).filter(Boolean))];
  entry.customReason = String(customReason || "");
  const localCard = modeState(modeId).cards.find(item => item.id === card.id);
  if (localCard && status !== "seen" && status !== "deleted") {
    localCard.auditStatus = status === "review" ? "review" : "approved";
    saveMode(modeId);
  }
  Object.assign(entry, snapshotForCard(modeId, localCard || card));
  writeAuditStore(store);
  return clone(entry);
}

function editableChanges(before, after) {
  const ignored = new Set(["origin", "locallyModified", "modeId", "targetIds", "renderedPrompt"]);
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ]);
  const changes = {};
  keys.forEach(key => {
    if (ignored.has(key)) return;
    const previous = before?.[key] ?? null;
    const next = after?.[key] ?? null;
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes[key] = { from: clone(previous), to: clone(next) };
    }
  });
  return changes;
}

export function recordCardAuditEdit(modeId, before, after) {
  if (!before?.id || !after?.id || before.id !== after.id) return null;
  const store = readAuditStore();
  const now = new Date().toISOString();
  let entry = entryForCard(store, modeId, after.id);
  if (!entry) {
    const snapshot = snapshotForCard(modeId, after);
    entry = {
      key: `${modeId}::${after.id}`,
      modeId,
      cardId: after.id,
      ...snapshot,
      status: "seen",
      firstSeenAt: now,
      lastSeenAt: now,
      displayCount: 1,
      sessionsSeen: 1,
      seenSessionIds: [],
      firstRatedAt: "",
      lastRatedAt: "",
      reasons: [],
      customReason: "",
      edits: []
    };
    store.entries.push(entry);
  }
  const changes = editableChanges(before, after);
  if (!Object.keys(changes).length) return clone(entry);
  entry.edits ||= [];
  entry.edits.push({
    editedAt: now,
    changes,
    before: cleanCardSnapshot(before),
    after: cleanCardSnapshot(after)
  });
  entry.edits = entry.edits.slice(-50);
  const localCard = modeState(modeId).cards.find(item => item.id === after.id);
  if (localCard) {
    localCard.auditStatus = "approved";
    localCard.auditFingerprint = computeAuditFingerprint(modeId, localCard);
    saveMode(modeId);
  }
  entry.status = "neutral";
  entry.firstRatedAt ||= now;
  entry.lastRatedAt = now;
  entry.reasons = [];
  entry.customReason = "";
  Object.assign(entry, snapshotForCard(modeId, localCard || after));
  writeAuditStore(store);
  return clone(entry);
}

export function restoreAuditEntrySnapshot(snapshot) {
  const store = readAuditStore();
  const key = snapshot?.key;
  if (!key) return;
  const index = store.entries.findIndex(entry => entry.key === key);
  if (snapshot.previousEntry) {
    const restored = normalizeEntry(snapshot.previousEntry);
    if (index >= 0) store.entries[index] = restored;
    else store.entries.push(restored);
  } else if (index >= 0) {
    store.entries.splice(index, 1);
  }
  writeAuditStore(store);
}

export function createAuditSession({ modeId, boxIds, difficultyIds, scope }) {
  const mode = modeState(modeId);
  const store = readAuditStore();
  const entryMap = new Map(store.entries.map(entry => [entry.key, entry]));
  const selectedBoxes = new Set(boxIds);
  const selectedDifficulties = new Set(difficultyIds);
  const cards = mode.cards.filter(card => {
    if (card.active === false || !selectedBoxes.has(card.boxId)) return false;
    if (!selectedDifficulties.has(normalizeDifficulty(card.difficulty, modeId, card))) return false;
    const localStatus = entryMap.get(`${modeId}::${card.id}`)?.status || "";
    const officialAuditStatus = String(card.auditStatus || "approved");
    const status = localStatus || (officialAuditStatus === "review"
      ? "review"
      : (officialAuditStatus === "pending" ? "pending" : "unseen"));
    if (scope === "unseen") return status === "unseen" || status === "seen";
    if (scope === "pending") return status === "pending";
    if (scope === "neutral") return status === "neutral";
    if (scope === "liked") return status === "liked";
    if (scope === "review") return status === "review";
    return status !== "deleted";
  });

  const session = {
    id: randomId("audit"),
    modeId,
    boxIds: [...selectedBoxes],
    difficultyIds: DIFFICULTY_ORDER.filter(id => selectedDifficulties.has(id)),
    scope,
    queueKeys: cards.map(card => `${modeId}::${card.id}`),
    index: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: []
  };
  store.currentSession = session;
  writeAuditStore(store);
  return clone(session);
}

export function saveAuditSession(session) {
  const store = readAuditStore();
  store.currentSession = session ? normalizeSession({ ...session, updatedAt: new Date().toISOString() }) : null;
  writeAuditStore(store);
  return clone(store.currentSession);
}

export function completeAuditSession(session) {
  const store = readAuditStore();
  if (session) {
    store.completedSessions.push({
      id: session.id,
      modeId: session.modeId,
      startedAt: session.startedAt,
      completedAt: new Date().toISOString(),
      cardCount: session.queueKeys.length
    });
    store.completedSessions = store.completedSessions.slice(-100);
  }
  store.currentSession = null;
  writeAuditStore(store);
}

export function deleteCardFromAudit(modeId, card, reason = "", customReason = "") {
  const removed = removeCardDuringGame(modeId, card.id, {
    source: "card_audit",
    reason: reason || "quality_rejection"
  });
  if (!removed) return null;
  setCardAuditStatus(modeId, card, "deleted", {
    reasons: reason ? [reason] : [],
    customReason
  });
  return removed;
}

export function restoreCardFromAudit(modeId, card) {
  restoreRemovedCard(modeId, card);
  const localCard = modeState(modeId).cards.find(item => item.id === card.id);
  if (localCard) {
    localCard.auditStatus = "review";
    saveMode(modeId);
  }
  const store = readAuditStore();
  const entry = entryForCard(store, modeId, card.id);
  if (entry) {
    entry.status = "review";
    entry.lastRatedAt = new Date().toISOString();
    entry.reasons = [];
    entry.customReason = "";
  }
  writeAuditStore(store);
}

export function auditSummary(input = null) {
  const store = input ? normalizeStore(input) : readAuditStore();
  const summary = {
    totalSeen: store.entries.length,
    neutral: 0,
    liked: 0,
    review: 0,
    deleted: 0,
    edited: 0,
    byMode: Object.fromEntries(MODE_ORDER.map(modeId => [modeId, {
      seen: 0, neutral: 0, liked: 0, review: 0, deleted: 0, edited: 0
    }]))
  };
  store.entries.forEach(entry => {
    summary[entry.status] = (summary[entry.status] || 0) + 1;
    const mode = summary.byMode[entry.modeId] ||= { seen: 0, neutral: 0, liked: 0, review: 0, deleted: 0, edited: 0 };
    // `seen` représente ici le nombre total de cartes réellement affichées.
    // Les autres propriétés sont des sous-ensembles de ce total.
    mode.seen += 1;
    if (entry.status !== "seen") mode[entry.status] = (mode[entry.status] || 0) + 1;
    if (entry.edits?.length) {
      summary.edited += 1;
      mode.edited += 1;
    }
  });
  return summary;
}

export function createAuditReport() {
  const store = readAuditStore();
  const gameplayReport = createGameplayReport();
  const gameplayMap = gameplayEntryMap();
  return {
    kind: REPORT_KIND,
    schemaVersion: AUDIT_STORE_SCHEMA,
    appVersion: APP_VERSION,
    installationId: store.installationId,
    exportId: randomId("export"),
    exportedAt: new Date().toISOString(),
    privacy: "Aucun prénom, score individuel, ciblage ou contenu de partie n’est inclus.",
    interpretation: {
      liked: "Signal positif explicite : carte particulièrement réussie.",
      neutral: "Carte vue puis laissée neutre : aucune conclusion positive ou négative forte.",
      review: "Carte conservée mais signalée comme douteuse ou améliorable.",
      deleted: "Signal négatif explicite : carte retirée localement.",
      seen: "Carte affichée mais audit interrompu avant décision.",
      edited: "Carte corrigée localement pendant l’audit ; le détail avant/après figure dans edits."
    },
    summary: auditSummary(store),
    gameplaySummary: gameplayReport.summary,
    completedSessions: clone(store.completedSessions),
    cards: clone(store.entries).map(entry => {
      const { seenSessionIds, ...publicEntry } = entry;
      return {
        ...publicEntry,
        gameplay: clone(gameplayMap.get(entry.key) || null)
      };
    }),
    gameplayOnlyCards: gameplayReport.cards.filter(entry =>
      !store.entries.some(auditEntry => auditEntry.key === entry.key)
    )
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

export function exportAuditReport() {
  const report = createAuditReport();
  if (!report.cards.length && !report.gameplayOnlyCards.length) return false;
  downloadJson(report, `mdb-audit-cartes-${new Date().toISOString().slice(0, 10)}.json`);
  return true;
}

function publicLibraryItem(item) {
  const output = clone(item);
  delete output.origin;
  delete output.locallyModified;
  delete output.modeId;
  delete output.targetIds;
  delete output.renderedPrompt;
  return output;
}

export function exportCleanLibrary(modeId) {
  const mode = modeState(modeId);
  const deletedIds = new Set(mode.libraryMeta?.deletedOfficialCardIds || []);
  const library = mode.officialLibrary;
  if (!library) return false;

  // L'export reprend la bibliothèque locale réellement auditée : les cartes
  // supprimées sont absentes et les corrections/difficultés modifiées pendant
  // l'audit sont conservées. Les cartes et catégories personnelles restent exclues.
  const officialBoxIds = new Set(library.boxes.map(box => box.id));
  const boxes = mode.boxes
    .filter(box => box.origin !== "personal" && officialBoxIds.has(box.id))
    .map(publicLibraryItem);
  const cards = mode.cards
    .filter(card => card.origin !== "personal" && !deletedIds.has(card.id))
    .map(publicLibraryItem);

  const output = {
    schemaVersion: library.schemaVersion,
    libraryVersion: library.libraryVersion,
    updatedAt: new Date().toISOString().slice(0, 10),
    modeId: library.modeId,
    modeName: library.modeName,
    auditPolicy: clone(library.auditPolicy || {
      newCardsRequireAudit: false,
      approvedStatuses: ["approved"],
      hiddenStatuses: ["pending", "review"]
    }),
    retiredOfficialCardIds: clone(library.retiredOfficialCardIds || []),
    boxes,
    cards
  };
  downloadJson(output, `${modeId}-bibliotheque-auditee-${new Date().toISOString().slice(0, 10)}.json`);
  return true;
}


export function exportAuditState() {
  const payload = {
    kind: "mdb-card-audit-state",
    schemaVersion: AUDIT_STORE_SCHEMA,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    audit: readAuditStore(),
    gameplayFeedback: readGameplayStore(),
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
  downloadJson(payload, `mdb-etat-audit-${new Date().toISOString().slice(0, 10)}.json`);
  return true;
}

export async function readAuditStateFile(file) {
  if (!file) throw new Error("Aucun fichier d’audit sélectionné.");
  const data = JSON.parse(await file.text());
  if (data?.kind !== "mdb-card-audit-state" || !data.audit) {
    throw new Error("Ce fichier n’est pas une sauvegarde d’audit MDB valide.");
  }
  return data;
}

export function importAuditState(data) {
  if (data?.kind !== "mdb-card-audit-state" || !data.audit) {
    throw new Error("Sauvegarde d’audit invalide.");
  }
  if (data.modes && typeof data.modes === "object") {
    MODE_ORDER.forEach(modeId => {
      const restored = data.modes[modeId];
      const mode = modeState(modeId);
      if (!restored || !mode?.officialLibrary) return;
      const officialBoxIds = new Set(mode.officialLibrary.boxes.map(box => box.id));
      const officialCardIds = new Set(mode.officialLibrary.cards.map(card => card.id));
      mode.boxes = clone(restored.boxes || mode.boxes).filter(box =>
        officialBoxIds.has(String(box.id)) || box.origin === "personal" || box.locallyModified === true
      );
      mode.cards = clone(restored.cards || mode.cards).flatMap(card => {
        if (officialCardIds.has(String(card.id)) || card.origin === "personal") return [card];
        if (card.locallyModified === true) {
          return [{ ...card, origin: "personal", locallyModified: true }];
        }
        return [];
      });
      mode.selectedBoxIds = clone(restored.selectedBoxIds || mode.selectedBoxIds);
      mode.selectedDifficultyIds = clone(
        restored.selectedDifficultyIds || mode.selectedDifficultyIds
      );
      mode.libraryMeta = clone(restored.libraryMeta || mode.libraryMeta);
      sanitizeMode(modeId, mode, mode.officialLibrary);
      saveMode(modeId);
    });
  }
  if (data.gameplayFeedback) restoreGameplayStore(data.gameplayFeedback);
  return writeAuditStore(data.audit);
}

export function clearAuditForMode(modeId) {
  const store = readAuditStore();
  store.entries = store.entries.filter(entry => entry.modeId !== modeId || entry.status === "deleted");
  if (store.currentSession?.modeId === modeId) store.currentSession = null;
  writeAuditStore(store);
}

export function auditEntryMap() {
  return new Map(readAuditStore().entries.map(entry => [entry.key, entry]));
}
