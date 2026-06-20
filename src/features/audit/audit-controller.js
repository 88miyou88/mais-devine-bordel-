import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  MODE_ORDER
} from "../../config/config.js";
import { el, showScreen } from "../../core/dom.js";
import { modeState } from "../../core/state.js";
import { clone, normalizeDifficulty } from "../../core/utils.js";
import { restoreRemovedCard } from "../../services/card-removals.js";
import { getBoxName, modeConfig, saveMode } from "../../services/libraries.js";
import { openCardEditor } from "../card-manager/card-editor.js";
import {
  auditEntryMap,
  auditSummary,
  clearAuditForMode,
  completeAuditSession,
  createAuditSession,
  deleteCardFromAudit,
  entryForCard,
  exportAuditReport,
  exportCleanLibrary,
  markCardSeen,
  readAuditStore,
  recordCardAuditEdit,
  restoreAuditEntrySnapshot,
  restoreCardFromAudit,
  saveAuditSession,
  setCardAuditStatus
} from "../../services/card-audit.js";

const REASONS = {
  lyrics: [
    ["song_unknown", "Chanson trop peu connue"],
    ["wrong_lyrics", "Paroles fausses / à corriger"],
    ["needs_context", "Pas assez de contexte"],
    ["passage_forgettable", "Passage peu mémorable"],
    ["continuation_unclear", "Suite pas évidente"],
    ["multiple_answers", "Plusieurs réponses possibles"],
    ["bad_cut", "Coupure mal placée"],
    ["answer_too_long", "Réponse trop longue"],
    ["too_hard", "Carte trop difficile"],
    ["duplicate", "Doublon ou trop similaire"]
  ],
  mime: [
    ["hard_to_mime", "Trop difficile à mimer"],
    ["hard_to_guess", "Trop difficile à deviner"],
    ["too_abstract", "Trop abstrait"],
    ["too_complex", "Trop long ou complexe"],
    ["duplicate", "Trop similaire à une autre carte"],
    ["not_fun", "Peu amusant"],
    ["needs_object", "Nécessite un objet"]
  ],
  words: [
    ["too_abstract", "Mot trop abstrait"],
    ["too_niche", "Référence trop peu connue"],
    ["ambiguous", "Réponse ambiguë"],
    ["forbidden_bad", "Mots interdits mal choisis"],
    ["too_easy", "Trop facile sans intérêt"],
    ["too_hard", "Trop difficile à expliquer"],
    ["duplicate", "Doublon ou trop similaire"]
  ],
  draw: [
    ["hard_to_draw", "Trop difficile à dessiner"],
    ["hard_to_guess", "Trop difficile à deviner"],
    ["too_abstract", "Trop abstrait"],
    ["too_complex", "Trop long ou complexe"],
    ["phone_unfriendly", "Inadapté au dessin sur téléphone"],
    ["needs_writing", "Nécessite d’écrire"],
    ["duplicate", "Doublon ou trop similaire"]
  ],
  drinking: [
    ["flat", "Question plate"],
    ["unclear", "Question peu claire"],
    ["repetitive", "Trop répétitive"],
    ["awkward", "Trop gênante"],
    ["personal", "Trop personnelle"],
    ["few_players", "Ne fonctionne pas avec peu de joueurs"],
    ["bad_mechanic", "Mauvaise mécanique"]
  ]
};

const STATUS_LABELS = {
  seen: "Vue",
  neutral: "Neutre",
  liked: "Excellente",
  review: "À revoir",
  deleted: "Supprimée"
};

let session = null;
let pendingReasonAction = null;
let pendingEditHistory = null;
let onHomeDataChanged = null;

function modeCard(modeId, cardId) {
  return modeState(modeId)?.cards?.find(card => card.id === cardId) || null;
}

function splitKey(key) {
  const index = key.indexOf("::");
  return index >= 0 ? [key.slice(0, index), key.slice(index + 2)] : ["", ""];
}

function sessionCardAt(index) {
  if (!session) return null;
  for (let cursor = index; cursor < session.queueKeys.length; cursor += 1) {
    const [modeId, cardId] = splitKey(session.queueKeys[cursor]);
    const card = modeCard(modeId, cardId);
    if (card) {
      if (cursor !== session.index) {
        session.index = cursor;
        saveAuditSession(session);
      }
      return { modeId, card };
    }
  }
  return null;
}

function currentAuditCard() {
  return sessionCardAt(session?.index || 0);
}

function statusFor(modeId, cardId) {
  return auditEntryMap().get(`${modeId}::${cardId}`)?.status || "seen";
}

function renderModeOptions() {
  const previous = el.auditModeSelect.value || session?.modeId || "lyrics";
  el.auditModeSelect.innerHTML = "";
  MODE_ORDER.forEach(modeId => {
    const option = document.createElement("option");
    option.value = modeId;
    option.textContent = modeConfig(modeId).name;
    el.auditModeSelect.append(option);
  });
  el.auditModeSelect.value = MODE_ORDER.includes(previous) ? previous : "lyrics";
}

function renderSetupFilters() {
  const modeId = el.auditModeSelect.value;
  const mode = modeState(modeId);
  const rememberedBoxes = new Set(
    session?.modeId === modeId && session.boxIds.length
      ? session.boxIds
      : mode.boxes.map(box => box.id)
  );
  const rememberedDifficulties = new Set(
    session?.modeId === modeId && session.difficultyIds.length
      ? session.difficultyIds
      : DIFFICULTY_ORDER
  );

  el.auditCategoryChoices.innerHTML = "";
  mode.boxes.forEach(box => {
    const label = document.createElement("label");
    label.className = "audit-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = box.id;
    input.checked = rememberedBoxes.has(box.id);
    const text = document.createElement("span");
    const count = mode.cards.filter(card => card.active && card.boxId === box.id).length;
    text.textContent = `${box.name} · ${count}`;
    label.append(input, text);
    el.auditCategoryChoices.append(label);
  });

  el.auditDifficultyChoices.innerHTML = "";
  DIFFICULTY_ORDER.forEach(difficulty => {
    const label = document.createElement("label");
    label.className = `audit-choice difficulty-${difficulty}`;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = difficulty;
    input.checked = rememberedDifficulties.has(difficulty);
    const text = document.createElement("span");
    text.textContent = DIFFICULTY_LABELS[difficulty];
    label.append(input, text);
    el.auditDifficultyChoices.append(label);
  });

  renderSetupSummary();
}

function checkedValues(container) {
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
}

function selectedSetupCards() {
  const modeId = el.auditModeSelect.value;
  const boxIds = new Set(checkedValues(el.auditCategoryChoices));
  const difficultyIds = new Set(checkedValues(el.auditDifficultyChoices));
  const entries = auditEntryMap();
  const scope = el.auditScopeSelect.value;
  return modeState(modeId).cards.filter(card => {
    if (!card.active || !boxIds.has(card.boxId)) return false;
    if (!difficultyIds.has(normalizeDifficulty(card.difficulty, modeId, card))) return false;
    const status = entries.get(`${modeId}::${card.id}`)?.status || "unseen";
    if (scope === "unseen") return status === "unseen" || status === "seen";
    if (scope === "neutral") return status === "neutral";
    if (scope === "liked") return status === "liked";
    if (scope === "review") return status === "review";
    return status !== "deleted";
  });
}

function renderDeletedCardsList() {
  const modeId = el.auditModeSelect.value;
  const deleted = readAuditStore().entries
    .filter(entry => entry.modeId === modeId && entry.status === "deleted")
    .sort((a, b) => b.lastRatedAt.localeCompare(a.lastRatedAt));
  el.auditDeletedCardsList.innerHTML = "";
  el.auditDeletedSection.classList.toggle("hidden", deleted.length === 0);
  deleted.forEach(entry => {
    const row = document.createElement("article");
    row.className = "audit-deleted-row";
    const text = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = entry.card?.title || entry.card?.prompt || entry.cardId;
    const small = document.createElement("small");
    small.textContent = `${entry.category?.name || "Sans catégorie"} · ${DIFFICULTY_LABELS[entry.difficulty]}`;
    text.append(strong, small);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary-button compact-button";
    button.textContent = "Restaurer";
    button.addEventListener("click", () => {
      const card = entry.card || entry.officialCard;
      if (!card) return;
      restoreCardFromAudit(modeId, card);
      renderAuditSetup();
      onHomeDataChanged?.();
    });
    row.append(text, button);
    el.auditDeletedCardsList.append(row);
  });
}

function renderSetupSummary() {
  const modeId = el.auditModeSelect.value;
  const cards = selectedSetupCards();
  const summary = auditSummary();
  const modeSummary = summary.byMode[modeId];
  el.auditSetupCount.textContent = `${cards.length} carte${cards.length > 1 ? "s" : ""} dans cette sélection`;
  el.auditSetupStats.textContent = `${modeSummary.seen} vue${modeSummary.seen > 1 ? "s" : ""} · ` +
    `${modeSummary.liked} excellente${modeSummary.liked > 1 ? "s" : ""} · ` +
    `${modeSummary.review} à revoir · ${modeSummary.deleted} supprimée${modeSummary.deleted > 1 ? "s" : ""}`;
  el.startAuditButton.disabled = cards.length === 0;
  const storedSession = readAuditStore().currentSession;
  const remaining = storedSession
    ? Math.max(0, storedSession.queueKeys.length - storedSession.index)
    : 0;
  el.resumeAuditButton.classList.toggle("hidden", !storedSession || remaining === 0);
  el.resumeAuditButton.textContent = storedSession
    ? `Reprendre ${modeConfig(storedSession.modeId).name} · ${remaining} restante${remaining > 1 ? "s" : ""}`
    : "Reprendre l’audit";
  el.exportAuditButton.disabled = summary.totalSeen === 0;
  el.exportCleanLibraryButton.disabled = modeState(modeId).libraryMeta.deletedOfficialCardIds.length === 0;
  renderDeletedCardsList();
}

export function renderAuditSetup() {
  session = readAuditStore().currentSession;
  renderModeOptions();
  if (session?.modeId) el.auditModeSelect.value = session.modeId;
  renderSetupFilters();
}

export function openAuditSetup() {
  renderAuditSetup();
  showScreen(el.auditSetupScreen);
}

function startAudit() {
  const boxIds = checkedValues(el.auditCategoryChoices);
  const difficultyIds = checkedValues(el.auditDifficultyChoices);
  if (!boxIds.length || !difficultyIds.length) {
    alert("Sélectionne au moins une catégorie et une difficulté.");
    return;
  }
  session = createAuditSession({
    modeId: el.auditModeSelect.value,
    boxIds,
    difficultyIds,
    scope: el.auditScopeSelect.value
  });
  if (!session.queueKeys.length) {
    alert("Aucune carte ne correspond à ces filtres.");
    return;
  }
  showScreen(el.auditReviewScreen);
  renderCurrentCard();
}

function resumeAudit() {
  session = readAuditStore().currentSession;
  if (!session) return;
  showScreen(el.auditReviewScreen);
  renderCurrentCard();
}

function renderAuditCardContent(modeId, card) {
  const config = modeConfig(modeId);
  el.auditCard.style.setProperty("--mode-color", config.color);
  el.auditModeLabel.textContent = config.gameLabel;
  el.auditLyricsContent.classList.toggle("hidden", config.type !== "lyrics");
  el.auditSimpleContent.classList.toggle("hidden", !["mime", "draw", "drinking"].includes(config.type));
  el.auditWordsContent.classList.toggle("hidden", config.type !== "words");

  if (config.type === "lyrics") {
    el.auditLyricsContext.textContent = card.context || "";
    el.auditLyricsContext.classList.toggle("hidden", !String(card.context || "").trim());
    el.auditLyricsPrompt.textContent = card.prompt;
    el.auditLyricsAnswer.textContent = card.answer;
    el.auditMetaPrimary.textContent = card.title;
    el.auditMetaSecondary.textContent = `${card.source} · ${getBoxName(modeId, card.boxId)} · ${DIFFICULTY_LABELS[card.difficulty]}`;
  } else if (config.type === "words") {
    el.auditWordPrompt.textContent = card.prompt;
    el.auditForbiddenWords.innerHTML = "";
    (card.forbiddenWords || []).forEach(word => {
      const chip = document.createElement("span");
      chip.className = "forbidden-word";
      chip.textContent = word;
      el.auditForbiddenWords.append(chip);
    });
    el.auditMetaPrimary.textContent = getBoxName(modeId, card.boxId);
    el.auditMetaSecondary.textContent = DIFFICULTY_LABELS[card.difficulty];
  } else {
    el.auditSimplePrompt.textContent = card.prompt;
    el.auditMetaPrimary.textContent = getBoxName(modeId, card.boxId);
    el.auditMetaSecondary.textContent = config.type === "drinking"
      ? `${DIFFICULTY_LABELS[card.difficulty]} · ${card.mechanic || "Carte"}`
      : DIFFICULTY_LABELS[card.difficulty];
  }
}

function renderCurrentCard({ countSeen = true } = {}) {
  if (!session) return;
  const current = currentAuditCard();
  if (!current) {
    completeAuditSession(session);
    session = null;
    el.auditCard.classList.add("hidden");
    el.auditCompletionPanel.classList.remove("hidden");
    el.auditActionBar.classList.add("hidden");
    el.auditKeyboardHelp.classList.add("hidden");
    el.auditProgress.textContent = "Audit terminé";
    return;
  }

  const { modeId, card } = current;
  if (countSeen) markCardSeen(modeId, card, session.id);
  const status = statusFor(modeId, card.id);
  el.auditCard.classList.remove("hidden");
  el.auditCompletionPanel.classList.add("hidden");
  el.auditActionBar.classList.remove("hidden");
  el.auditKeyboardHelp.classList.remove("hidden");
  el.auditProgress.textContent = `${session.index + 1} / ${session.queueKeys.length}`;
  el.auditStatusBadge.textContent = STATUS_LABELS[status] || "Vue";
  el.auditStatusBadge.dataset.status = status;
  el.auditBackButton.disabled = session.history.length === 0;
  renderAuditCardContent(modeId, card);
  saveAuditSession(session);
}

function historySnapshot(modeId, card, action) {
  const store = readAuditStore();
  return {
    key: `${modeId}::${card.id}`,
    modeId,
    index: session.index,
    action,
    card: clone(card),
    previousEntry: clone(entryForCard(store, modeId, card.id))
  };
}

function advanceWithStatus(status, reason = "", customReason = "") {
  const current = currentAuditCard();
  if (!current) return;
  const { modeId, card } = current;
  const history = historySnapshot(modeId, card, status);

  if (status === "deleted") {
    if (!deleteCardFromAudit(modeId, card, reason, customReason)) return;
  } else {
    setCardAuditStatus(modeId, card, status, {
      reasons: reason ? [reason] : [],
      customReason
    });
  }

  session.history.push(history);
  session.history = session.history.slice(-100);
  session.index += 1;
  saveAuditSession(session);
  onHomeDataChanged?.();
  renderCurrentCard();
}

function undoAuditAction() {
  if (!session?.history?.length) return;
  const history = session.history.pop();
  if (history.action === "deleted") {
    restoreRemovedCard(history.modeId || session.modeId, history.card);
  } else if (history.action === "edited") {
    const modeId = history.modeId || session.modeId;
    const mode = modeState(modeId);
    const index = mode.cards.findIndex(card => card.id === history.card.id);
    if (index >= 0) mode.cards[index] = clone(history.card);
    saveMode(modeId);
  }
  restoreAuditEntrySnapshot(history);
  session.index = history.index;
  saveAuditSession(session);
  onHomeDataChanged?.();
  renderCurrentCard({ countSeen: false });
}

function renderReasonChoices(action) {
  const current = currentAuditCard();
  if (!current) return;
  pendingReasonAction = action;
  const { modeId } = current;
  el.auditReasonDialogTitle.textContent = action === "deleted"
    ? "Pourquoi supprimer cette carte ?"
    : "Pourquoi la mettre à revoir ?";
  el.auditReasonChoices.innerHTML = "";
  el.auditCustomReasonInput.value = "";
  (REASONS[modeId] || []).forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary-button audit-reason-button";
    button.textContent = label;
    button.addEventListener("click", () => {
      el.auditReasonDialog.close();
      advanceWithStatus(action, id);
    });
    el.auditReasonChoices.append(button);
  });
  el.auditReasonUnknownButton.className = action === "deleted"
    ? "danger-button"
    : "secondary-button";
  el.auditReasonDialog.showModal();
}

function openAuditCardEditor() {
  const current = currentAuditCard();
  if (!current) return;
  const { modeId, card } = current;
  pendingEditHistory = historySnapshot(modeId, card, "edited");
  openCardEditor(modeId, card.id);
}

function handleCardEdited(event) {
  if (!pendingEditHistory || !el.auditReviewScreen.classList.contains("active")) return;
  const detail = event.detail || {};
  if (detail.modeId !== pendingEditHistory.modeId || detail.cardId !== pendingEditHistory.card.id) return;
  recordCardAuditEdit(detail.modeId, detail.before || pendingEditHistory.card, detail.after);
  session.history.push(pendingEditHistory);
  session.history = session.history.slice(-100);
  pendingEditHistory = null;
  saveAuditSession(session);
  onHomeDataChanged?.();
  renderCurrentCard({ countSeen: false });
}

function exitAudit() {
  if (session) saveAuditSession(session);
  openAuditSetup();
}

function handleAuditKeydown(event) {
  if (!el.auditReviewScreen.classList.contains("active")) return;
  if (el.auditReasonDialog.open) return;
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
  const key = event.key.toLocaleLowerCase("fr");
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    advanceWithStatus("neutral");
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    undoAuditAction();
  } else if (key === "l") {
    event.preventDefault();
    advanceWithStatus("liked");
  } else if (key === "r") {
    event.preventDefault();
    renderReasonChoices("review");
  } else if (key === "m") {
    event.preventDefault();
    openAuditCardEditor();
  } else if (key === "s" || event.key === "Delete") {
    event.preventDefault();
    renderReasonChoices("deleted");
  } else if (event.key === "Escape") {
    event.preventDefault();
    exitAudit();
  }
}

function clearSelectedModeAudit() {
  const modeId = el.auditModeSelect.value;
  if (!confirm(`Effacer les statuts d’audit de « ${modeConfig(modeId).name} » ?\n\nLes cartes supprimées restent supprimées tant qu’elles ne sont pas restaurées séparément.`)) return;
  clearAuditForMode(modeId);
  renderAuditSetup();
}

export function initializeAudit({ onHomeDataChanged: changed } = {}) {
  onHomeDataChanged = changed || null;
  el.auditHomeButton.addEventListener("click", () => showScreen(el.homeScreen));
  el.auditModeSelect.addEventListener("change", renderSetupFilters);
  el.auditScopeSelect.addEventListener("change", renderSetupSummary);
  el.auditCategoryChoices.addEventListener("change", renderSetupSummary);
  el.auditDifficultyChoices.addEventListener("change", renderSetupSummary);
  el.auditSelectAllCategoriesButton.addEventListener("click", () => {
    el.auditCategoryChoices.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = true);
    renderSetupSummary();
  });
  el.auditSelectNoCategoriesButton.addEventListener("click", () => {
    el.auditCategoryChoices.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
    renderSetupSummary();
  });
  el.startAuditButton.addEventListener("click", startAudit);
  el.resumeAuditButton.addEventListener("click", resumeAudit);
  el.exportAuditButton.addEventListener("click", () => {
    if (!exportAuditReport()) alert("Aucune carte auditée à exporter.");
  });
  el.exportCleanLibraryButton.addEventListener("click", () => exportCleanLibrary(el.auditModeSelect.value));
  el.clearAuditModeButton.addEventListener("click", clearSelectedModeAudit);
  el.auditExitButton.addEventListener("click", exitAudit);
  el.auditBackButton.addEventListener("click", undoAuditAction);
  el.auditNeutralButton.addEventListener("click", () => advanceWithStatus("neutral"));
  el.auditLikeButton.addEventListener("click", () => advanceWithStatus("liked"));
  el.auditReviewButton.addEventListener("click", () => renderReasonChoices("review"));
  el.auditEditButton.addEventListener("click", openAuditCardEditor);
  el.auditDeleteButton.addEventListener("click", () => renderReasonChoices("deleted"));
  el.auditCompletionBackButton.addEventListener("click", openAuditSetup);
  el.auditCompletionExportButton.addEventListener("click", () => exportAuditReport());
  el.closeAuditReasonButton.addEventListener("click", () => {
    pendingReasonAction = null;
    el.auditReasonDialog.close();
  });
  el.auditReasonUnknownButton.addEventListener("click", () => {
    const action = pendingReasonAction;
    if (!action) return;
    el.auditReasonDialog.close();
    advanceWithStatus(action, "unspecified");
  });
  el.auditReasonCustomButton.addEventListener("click", () => {
    const action = pendingReasonAction;
    const customReason = el.auditCustomReasonInput.value.trim();
    if (!action || !customReason) {
      alert("Écris une précision ou choisis « Je ne sais pas ».");
      return;
    }
    el.auditReasonDialog.close();
    advanceWithStatus(action, "custom", customReason);
  });
  window.addEventListener("mdb:card-edited", handleCardEdited);
  document.addEventListener("keydown", handleAuditKeydown);
  window.addEventListener("mdb:audit-changed", () => {
    if (el.auditSetupScreen.classList.contains("active")) renderAuditSetup();
  });
}
