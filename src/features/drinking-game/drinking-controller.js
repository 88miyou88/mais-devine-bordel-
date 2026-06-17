import { DIFFICULTY_META } from "../../config/config.js";
import { el, requestGameDisplay, showScreen } from "../../core/dom.js";
import { modeState, state } from "../../core/state.js";
import { saveGlobalSettings } from "../../services/libraries.js";
import { buildDeck, drawPreparedCard } from "./card-engine.js";
import {
  defaultPenaltyTargetIds,
  formattedPrompt,
  interactionForCard,
  penaltyInstruction,
  selectablePlayerIds
} from "./interaction.js";
import { applyPenalty, describePenalty, penaltyRange, rollPenalty } from "./penalties.js";
import { addRule, tickRules } from "./rules.js";
import { clearDrinkingSession, readDrinkingSession, saveDrinkingSession } from "./session.js";
import {
  initializeDrinkingSwipe,
  resetDrinkingSwipe,
  updateDrinkingSwipeLabels
} from "./swipe.js";

let callbacks = {};
let clockTimer = 0;
let challengeTimer = 0;

const clone = value => typeof structuredClone === "function"
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

function options() {
  return state.settings.modeOptions.drinking;
}

function blankStats(player) {
  return {
    playerId: player.id,
    name: player.name,
    targeted: 0,
    lastTargetedAt: -10,
    penaltyPoints: 0,
    sips: 0,
    penaltiesReceived: 0,
    tokens: 0,
    miniChallenges: 0,
    jokersLost: 0,
    rulesForgotten: 0,
    votesReceived: 0,
    duelsWon: 0,
    challengesSucceeded: 0,
    answersGiven: 0
  };
}

function createGame() {
  const players = clone(options().players);
  const endType = options().endType;
  const durationMs = options().durationMinutes * 60_000;
  return {
    schema: 2,
    players,
    stats: Object.fromEntries(players.map(player => [player.id, blankStats(player)])),
    deck: buildDeck(players.length),
    usedCards: [],
    currentCard: null,
    selectedTargetIds: [],
    activeRules: [],
    history: [],
    playedCount: 0,
    skippedCount: 0,
    endType,
    cardLimit: options().cardLimit,
    durationMs,
    remainingMs: durationMs,
    deadline: endType === "minutes" ? Date.now() + durationMs : 0,
    maxPenalty: options().maxPenalty,
    softPenaltyMode: options().softPenaltyMode,
    currentPenalty: 1,
    rulePenaltyMode: false,
    finished: false,
    startedAt: new Date().toISOString()
  };
}

function snapshotGame(game) {
  const { history, ...rest } = game;
  return clone(rest);
}

function restoreSnapshot(game, snapshot) {
  const history = game.history;
  Object.assign(game, clone(snapshot), { history });
}

function saveSettingsFromSetup() {
  const selectedEndType = el.drinkingEndTypeInputs.find(input => input.checked)?.value || "cards";
  options().endType = selectedEndType === "minutes" ? "minutes" : "cards";
  options().cardLimit = Math.min(250, Math.max(5, Number(el.drinkingCardLimitInput.value) || 30));
  options().durationMinutes = [15, 30, 45, 60].includes(Number(el.drinkingDurationInput.value))
    ? Number(el.drinkingDurationInput.value) : 30;
  options().maxPenalty = Math.min(10, Math.max(1, Number(el.drinkingMaxPenaltyInput.value) || 3));
  options().softPenaltyMode = ["points", "tokens", "mini_challenge", "joker"].includes(el.drinkingSoftModeInput.value)
    ? el.drinkingSoftModeInput.value : "points";
  saveGlobalSettings();
}

function renderPlayerList() {
  el.drinkingPlayerList.innerHTML = "";
  options().players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "drinking-player-row";

    const order = document.createElement("span");
    order.className = "drinking-player-number";
    order.textContent = String(index + 1);

    const name = document.createElement("input");
    name.type = "text";
    name.maxLength = 24;
    name.value = player.name;
    name.setAttribute("aria-label", `Prénom du joueur ${index + 1}`);
    name.addEventListener("input", () => {
      player.name = name.value.trim().slice(0, 24) || `Joueur ${index + 1}`;
      saveGlobalSettings();
    });

    const soft = document.createElement("label");
    soft.className = "team-soft-toggle";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = player.teamSoft === true;
    checkbox.addEventListener("change", () => {
      player.teamSoft = checkbox.checked;
      saveGlobalSettings();
    });
    const softText = document.createElement("span");
    softText.textContent = "🥤 Team soft";
    soft.append(checkbox, softText);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "mini-button danger-mini";
    remove.textContent = "×";
    remove.disabled = options().players.length <= 2;
    remove.setAttribute("aria-label", `Supprimer ${player.name}`);
    remove.addEventListener("click", () => {
      options().players.splice(index, 1);
      saveGlobalSettings();
      renderPlayerList();
    });

    row.append(order, name, soft, remove);
    el.drinkingPlayerList.append(row);
  });
}

function renderSetup() {
  const config = options();
  renderPlayerList();
  el.drinkingEndTypeInputs.forEach(input => input.checked = input.value === config.endType);
  el.drinkingCardLimitInput.value = String(config.cardLimit);
  el.drinkingDurationInput.value = String(config.durationMinutes);
  el.drinkingMaxPenaltyInput.value = String(config.maxPenalty);
  el.drinkingSoftModeInput.value = config.softPenaltyMode;
  el.drinkingSetupHotBadge.classList.toggle("hidden", !config.adultMode);
  renderFormatFields();
  renderPenaltyPreview();
}

function renderFormatFields() {
  const endType = el.drinkingEndTypeInputs.find(input => input.checked)?.value || "cards";
  el.drinkingCardLimitField.classList.toggle("hidden", endType !== "cards");
  el.drinkingDurationField.classList.toggle("hidden", endType !== "minutes");
}

function renderPenaltyPreview() {
  const maximum = Math.min(10, Math.max(1, Number(el.drinkingMaxPenaltyInput.value) || 3));
  const parts = ["light", "medium", "strong"].map(intensity => {
    const [min, max] = penaltyRange(intensity, maximum);
    const label = intensity === "light" ? "Pépouze" : intensity === "medium" ? "Ça chauffe" : "Demain, on nie tout";
    return `${label} : ${min === max ? min : `${min}–${max}`}`;
  });
  el.drinkingPenaltyPreview.textContent = `${parts.join(" · ")} gorgée(s) maximum ${maximum}`;
}

export async function openDrinkingSetup() {
  stopTimers();
  renderSetup();
  showScreen(el.drinkingSetupScreen);
  const saved = readDrinkingSession();
  if (saved && confirm(`Une partie de Qui boit, bordel ? est en cours depuis ${new Date(saved.savedAt).toLocaleString("fr-FR")}.

La reprendre ?`)) {
    state.drinkingGame = saved.game;
    state.drinkingGame.rulePenaltyMode = false;
    await requestGameDisplay();
    resumeGameClock();
    renderGame();
    showScreen(el.drinkingGameScreen);
  } else if (saved) {
    clearDrinkingSession();
  }
}

function startGame() {
  saveSettingsFromSetup();
  state.drinkingGame = createGame();
  if (!state.drinkingGame.deck.length) {
    alert("Aucune carte ne correspond aux thèmes, niveaux et nombre de joueurs sélectionnés.");
    return;
  }
  requestGameDisplay();
  drawNextCard();
  resumeGameClock();
  showScreen(el.drinkingGameScreen);
}

function drawNextCard() {
  const game = state.drinkingGame;
  game.currentCard = drawPreparedCard(game);
  if (!game.currentCard) {
    finishDrinkingGame();
    return;
  }
  game.currentPenalty = rollPenalty(game.currentCard.penalty?.intensity, game.maxPenalty);
  game.selectedTargetIds = defaultPenaltyTargetIds(game.currentCard);
  game.rulePenaltyMode = false;
  renderGame();
  saveDrinkingSession(game);
}

function renderGame() {
  const game = state.drinkingGame;
  const card = game?.currentCard;
  if (!game || !card) return;

  el.drinkingProgress.textContent = game.endType === "cards"
    ? `Carte ${Math.min(game.playedCount + 1, game.cardLimit)} / ${game.cardLimit}`
    : `${game.playedCount} carte${game.playedCount > 1 ? "s" : ""} jouée${game.playedCount > 1 ? "s" : ""}`;
  renderClock();

  const box = modeState("drinking").boxes.find(item => item.id === card.boxId);
  el.drinkingTheme.textContent = box?.name || "Qui boit, bordel ?";
  const meta = DIFFICULTY_META[card.difficulty] || DIFFICULTY_META.medium;
  el.drinkingLevel.textContent = card.difficulty === "easy" ? "Pépouze" : card.difficulty === "medium" ? "Ça chauffe" : "Demain, on nie tout";
  el.drinkingLevel.style.setProperty("--difficulty-color", meta.color);
  el.drinkingPrompt.textContent = formattedPrompt(card, game.players, game.currentPenalty, game.softPenaltyMode);
  el.drinkingCard.classList.toggle("hot-card", card.adult === true);

  renderRules();
  renderResolution();
  el.drinkingBackButton.disabled = game.history.length === 0;
  el.drinkingChallengeTimerButton.classList.toggle("hidden", !card.durationSeconds);
  el.drinkingChallengeTimer.classList.add("hidden");
  resetDrinkingSwipe();
}

function renderRules() {
  const game = state.drinkingGame;
  el.drinkingRulesSummary.innerHTML = "";
  el.drinkingRuleReminder.innerHTML = "";
  const hasRules = game.activeRules.length > 0;
  el.drinkingRulesSummary.classList.toggle("hidden", !hasRules);
  el.drinkingRuleReminder.classList.toggle("hidden", !hasRules);
  el.drinkingRulePenaltyButton.classList.toggle("hidden", !hasRules || game.rulePenaltyMode);
  if (!hasRules) return;

  game.activeRules.forEach(rule => {
    const item = document.createElement("span");
    item.textContent = `${rule.text} · ${rule.remainingCards}`;
    item.title = `${rule.remainingCards} carte(s) restante(s)`;
    el.drinkingRulesSummary.append(item);
  });

  const title = document.createElement("strong");
  title.textContent = "Règle active" + (game.activeRules.length > 1 ? "s" : "");
  const list = document.createElement("span");
  list.textContent = game.activeRules.map(rule => rule.text).join(" · ");
  el.drinkingRuleReminder.append(title, list);
}

function renderResolution() {
  const game = state.drinkingGame;
  const card = game.currentCard;
  const interaction = interactionForCard(card);

  if (game.rulePenaltyMode) {
    el.drinkingRulePenaltyButton.classList.add("hidden");
    el.drinkingTargetPanel.classList.remove("hidden");
    el.drinkingTargetLabel.textContent = "Qui a oublié une règle ?";
    renderTargetChoices(game.players.map(player => player.id), false);
    const selectedPlayer = game.players.find(player => player.id === game.selectedTargetIds[0]);
    const ruleAmount = game.activeRules.at(-1)?.penaltyAmount || 1;
    el.drinkingPenaltyText.textContent = selectedPlayer
      ? `${selectedPlayer.name} prend ${describePenalty(selectedPlayer, ruleAmount, game.softPenaltyMode)}.`
      : "Choisis la personne qui a oublié la règle.";
    el.drinkingLeftActionButton.classList.add("hidden");
    el.drinkingRightActionButton.classList.remove("hidden");
    setActionButton(el.drinkingRightActionButton, "Attribuer l’oubli", "penalty", "right");
    el.drinkingSkipButton.textContent = "Annuler l’oubli";
    updateDrinkingSwipeLabels("Annuler", "Attribuer");
    return;
  }

  el.drinkingRulePenaltyButton.classList.toggle("hidden", !game.activeRules.length);
  const selectableIds = selectablePlayerIds(card, game.players);
  const showTargets = selectableIds.length > 0;
  el.drinkingTargetPanel.classList.toggle("hidden", !showTargets);
  if (showTargets) {
    el.drinkingTargetLabel.textContent = interaction.targetLabel || "Qui est concerné ?";
    renderTargetChoices(selectableIds, interaction.selection === "multiple_all");
  } else {
    el.drinkingTargetChoices.innerHTML = "";
  }

  el.drinkingPenaltyText.textContent = penaltyInstruction(
    card,
    game.players,
    game.selectedTargetIds,
    game.currentPenalty,
    game.softPenaltyMode
  );

  el.drinkingSkipButton.textContent = "Passer";
  el.drinkingLeftActionButton.classList.remove("hidden");
  el.drinkingRightActionButton.classList.remove("hidden");
  setActionButton(el.drinkingLeftActionButton, interaction.leftLabel, interaction.leftAction, "left");
  setActionButton(el.drinkingRightActionButton, interaction.rightLabel, interaction.rightAction, "right");
  updateDrinkingSwipeLabels(interaction.leftLabel, interaction.rightLabel);
}

function setActionButton(button, label, action, side) {
  button.textContent = label;
  button.classList.remove("primary-button", "danger-button", "secondary-button");
  if (action === "penalty") button.classList.add("danger-button");
  else if (side === "right") button.classList.add("primary-button");
  else button.classList.add("secondary-button");
}

function renderTargetChoices(selectableIds, multiple) {
  const game = state.drinkingGame;
  el.drinkingTargetChoices.innerHTML = "";
  selectableIds.forEach(playerId => {
    const player = game.players.find(item => item.id === playerId);
    if (!player) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `drinking-target-chip${game.selectedTargetIds.includes(player.id) ? " selected" : ""}`;
    button.textContent = `${player.name}${player.teamSoft ? " · 🥤" : ""}`;
    button.title = describePenalty(player, game.currentPenalty, game.softPenaltyMode);
    button.addEventListener("click", () => {
      const selected = new Set(game.selectedTargetIds);
      if (selected.has(player.id)) selected.delete(player.id);
      else {
        if (!multiple) selected.clear();
        selected.add(player.id);
      }
      game.selectedTargetIds = [...selected];
      renderResolution();
    });
    el.drinkingTargetChoices.append(button);
  });
}

function actionForDirection(direction) {
  const game = state.drinkingGame;
  if (game.rulePenaltyMode) return direction === "right" ? "rule_penalty" : null;
  const interaction = interactionForCard(game.currentCard);
  return direction === "right" ? interaction.rightAction : interaction.leftAction;
}

function canPerformDirection(direction, showMessage = true) {
  const game = state.drinkingGame;
  if (!game || !game.currentCard || game.rulePenaltyMode && direction === "left") return false;
  if (game.rulePenaltyMode) {
    if (game.selectedTargetIds.length) return true;
    if (showMessage) alert("Choisis la personne qui a oublié la règle.");
    return false;
  }
  const interaction = interactionForCard(game.currentCard);
  if (direction === "right" && interaction.requiresRightSelection && !game.selectedTargetIds.length) {
    if (showMessage) alert("Sélectionne au moins une personne avant de valider.");
    return false;
  }
  return true;
}

function performDirection(direction) {
  if (!canPerformDirection(direction)) return;
  const game = state.drinkingGame;
  if (game.rulePenaltyMode) {
    applyRulePenalty();
    return;
  }
  const action = actionForDirection(direction);
  if (action === "penalty") advanceCard({ penalized: true, positive: direction === "right" });
  else if (action === "activate_rule") advanceCard({ activateRule: true, positive: true });
  else advanceCard({ positive: direction === "right" });
}

function applySelectedPenalty(reason = "card", amount = null) {
  const game = state.drinkingGame;
  if (!game.selectedTargetIds.length) {
    alert("Sélectionne au moins une personne qui reçoit la pénalité.");
    return false;
  }
  const value = Math.max(1, Number(amount ?? game.currentPenalty) || 1);
  game.selectedTargetIds.forEach(playerId => {
    const player = game.players.find(item => item.id === playerId);
    if (!player) return;
    applyPenalty(player, game.stats, value, game.softPenaltyMode, reason);
    const wasAutomaticallyTargeted = game.currentCard?.targetIds?.includes(playerId);
    if (reason === "card" && !wasAutomaticallyTargeted) {
      game.stats[playerId].targeted += 1;
      game.stats[playerId].lastTargetedAt = game.playedCount;
    }
    if (reason === "card" && ["vote", "tribunal"].includes(game.currentCard.resolution?.kind)) {
      game.stats[playerId].votesReceived += 1;
    }
  });
  if (reason === "card" && game.currentCard.resolution?.kind === "duel") {
    const winnerId = game.currentCard.targetIds.find(id => !game.selectedTargetIds.includes(id));
    if (winnerId && game.stats[winnerId]) game.stats[winnerId].duelsWon += 1;
  }
  return true;
}

function recordPositiveOutcome() {
  const game = state.drinkingGame;
  const kind = game.currentCard.resolution?.kind;
  const actorId = defaultPenaltyTargetIds(game.currentCard)[0];
  if (!actorId || !game.stats[actorId]) return;
  if (kind === "challenge_or_penalty") game.stats[actorId].challengesSucceeded += 1;
  if (kind === "answer_or_penalty") game.stats[actorId].answersGiven += 1;
}

function pushHistory() {
  const game = state.drinkingGame;
  game.history.push(snapshotGame(game));
  if (game.history.length > 40) game.history.shift();
}

function advanceCard({ penalized = false, skipped = false, activateRule = false, positive = false } = {}) {
  const game = state.drinkingGame;
  pushHistory();
  if (penalized && !applySelectedPenalty("card")) {
    game.history.pop();
    return;
  }
  if (positive && !penalized) recordPositiveOutcome();

  let addedRule = null;
  if (activateRule || game.currentCard.resolution?.kind === "temporary_rule" && positive) {
    game.activeRules = addRule(game.activeRules, game.currentCard, game.currentPenalty);
    addedRule = game.activeRules.at(-1);
  }
  game.activeRules = tickRules(game.activeRules, addedRule?.id);
  game.playedCount += 1;
  if (skipped) game.skippedCount += 1;
  if (shouldFinish(game)) finishDrinkingGame();
  else drawNextCard();
}

function shouldFinish(game) {
  if (game.endType === "cards") return game.playedCount >= game.cardLimit;
  return game.remainingMs <= 0;
}

function goBack() {
  const game = state.drinkingGame;
  const snapshot = game.history.pop();
  if (!snapshot) return;
  restoreSnapshot(game, snapshot);
  game.rulePenaltyMode = false;
  renderGame();
  saveDrinkingSession(game);
}

function beginRulePenalty() {
  const game = state.drinkingGame;
  if (!game.activeRules.length) return;
  game.rulePenaltyMode = true;
  game.selectedTargetIds = [];
  renderResolution();
}

function cancelRulePenalty() {
  const game = state.drinkingGame;
  game.rulePenaltyMode = false;
  game.selectedTargetIds = defaultPenaltyTargetIds(game.currentCard);
  renderResolution();
}

function applyRulePenalty() {
  const game = state.drinkingGame;
  if (!game.activeRules.length || !game.selectedTargetIds.length) {
    alert("Choisis la personne qui a oublié la règle.");
    return;
  }
  const penaltyAmount = game.activeRules.at(-1)?.penaltyAmount || 1;
  if (!applySelectedPenalty("rule", penaltyAmount)) return;
  game.rulePenaltyMode = false;
  game.selectedTargetIds = defaultPenaltyTargetIds(game.currentCard);
  renderResolution();
  saveDrinkingSession(game);
}

function startChallengeTimer() {
  clearInterval(challengeTimer);
  let remaining = Number(state.drinkingGame.currentCard.durationSeconds) || 20;
  el.drinkingChallengeTimer.classList.remove("hidden");
  el.drinkingChallengeTimer.textContent = `${remaining} s`;
  challengeTimer = window.setInterval(() => {
    remaining -= 1;
    el.drinkingChallengeTimer.textContent = `${remaining} s`;
    if (remaining <= 0) {
      clearInterval(challengeTimer);
      el.drinkingChallengeTimer.textContent = "Terminé !";
      if (state.settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([180, 80, 180]);
    }
  }, 1000);
}

function resumeGameClock() {
  clearInterval(clockTimer);
  const game = state.drinkingGame;
  if (!game || game.endType !== "minutes") return;
  if (!game.deadline) game.deadline = Date.now() + game.remainingMs;
  clockTimer = window.setInterval(() => {
    game.remainingMs = Math.max(0, game.deadline - Date.now());
    renderClock();
    if (game.remainingMs <= 0) finishDrinkingGame();
  }, 250);
}

function renderClock() {
  const game = state.drinkingGame;
  if (game.endType !== "minutes") {
    el.drinkingClock.textContent = `${game.playedCount} jouée${game.playedCount > 1 ? "s" : ""}`;
    return;
  }
  const totalSeconds = Math.ceil(game.remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  el.drinkingClock.textContent = `${minutes}:${seconds}`;
}

function stopTimers() {
  clearInterval(clockTimer);
  clearInterval(challengeTimer);
  clockTimer = 0;
  challengeTimer = 0;
}

export function stopDrinkingGame() {
  stopTimers();
}

export function finishDrinkingGame() {
  const game = state.drinkingGame;
  if (!game || game.finished) return;
  game.finished = true;
  stopTimers();
  clearDrinkingSession();
  renderResults();
  showScreen(el.drinkingResultsScreen);
}

function titleFor(stats, rank) {
  if (rank === 0) return "Le survivant officiel";
  if (stats.rulesForgotten >= 2) return "L’ennemi du règlement";
  if (stats.penaltyPoints >= 10) return "Le dossier ambulant";
  if (stats.targeted >= 5) return "La cible officielle";
  return "L’innocent autoproclamé";
}

function appendStatBadge(container, value) {
  const badge = document.createElement("span");
  badge.textContent = value;
  container.append(badge);
}

function renderResults() {
  const game = state.drinkingGame;
  const ranking = Object.values(game.stats).sort((a, b) =>
    a.penaltyPoints - b.penaltyPoints || a.penaltiesReceived - b.penaltiesReceived || a.name.localeCompare(b.name, "fr")
  );
  el.drinkingResultsSummary.textContent = `${game.playedCount} cartes jouées · ${game.skippedCount} passée${game.skippedCount > 1 ? "s" : ""}`;
  el.drinkingRanking.innerHTML = "";

  ranking.forEach((stats, index) => {
    const player = game.players.find(item => item.id === stats.playerId);
    const row = document.createElement("article");
    row.className = `drinking-ranking-row${index === 0 ? " winner" : ""}`;

    const rank = document.createElement("span");
    rank.className = "drinking-rank";
    rank.textContent = String(index + 1);

    const identity = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = stats.name;
    const title = document.createElement("small");
    title.textContent = titleFor(stats, index);
    identity.append(name, title);

    const detail = document.createElement("div");
    detail.className = "drinking-ranking-stats";
    appendStatBadge(detail, `${stats.penaltyPoints} pénalité${stats.penaltyPoints > 1 ? "s" : ""}`);
    appendStatBadge(detail, player?.teamSoft ? "🥤 Team soft" : `${stats.sips} gorgée${stats.sips > 1 ? "s" : ""}`);
    if (stats.challengesSucceeded > 0) appendStatBadge(detail, `${stats.challengesSucceeded} défi${stats.challengesSucceeded > 1 ? "s" : ""} réussi${stats.challengesSucceeded > 1 ? "s" : ""}`);
    if (stats.duelsWon > 0) appendStatBadge(detail, `${stats.duelsWon} duel${stats.duelsWon > 1 ? "s" : ""} gagné${stats.duelsWon > 1 ? "s" : ""}`);
    if (stats.rulesForgotten > 0) appendStatBadge(detail, `${stats.rulesForgotten} oubli${stats.rulesForgotten > 1 ? "s" : ""} de règle`);

    row.append(rank, identity, detail);
    el.drinkingRanking.append(row);
  });
}

function addPlayer() {
  if (options().players.length >= 12) return;
  const index = options().players.length + 1;
  options().players.push({ id: `drink-player-${Date.now()}-${index}`, name: `Joueur ${index}`, teamSoft: false });
  saveGlobalSettings();
  renderPlayerList();
}

function shufflePlayers() {
  const players = options().players;
  for (let index = players.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [players[index], players[swap]] = [players[swap], players[index]];
  }
  saveGlobalSettings();
  renderPlayerList();
}

export function initializeDrinkingGame(optionsCallbacks = {}) {
  callbacks = optionsCallbacks;
  initializeDrinkingSwipe({
    canSwipe: direction => canPerformDirection(direction),
    onSwipe: performDirection
  });

  el.drinkingSetupBackButton.addEventListener("click", () => callbacks.onHome?.());
  el.drinkingAddPlayerButton.addEventListener("click", addPlayer);
  el.drinkingShufflePlayersButton.addEventListener("click", shufflePlayers);
  el.drinkingEndTypeInputs.forEach(input => input.addEventListener("change", () => {
    renderFormatFields();
    saveSettingsFromSetup();
  }));
  [el.drinkingCardLimitInput, el.drinkingDurationInput, el.drinkingSoftModeInput].forEach(input =>
    input.addEventListener("change", saveSettingsFromSetup));
  el.drinkingMaxPenaltyInput.addEventListener("input", renderPenaltyPreview);
  el.drinkingMaxPenaltyInput.addEventListener("change", saveSettingsFromSetup);
  el.startDrinkingButton.addEventListener("click", startGame);
  el.drinkingLeftActionButton.addEventListener("click", () => performDirection("left"));
  el.drinkingRightActionButton.addEventListener("click", () => performDirection("right"));
  el.drinkingSkipButton.addEventListener("click", () => {
    if (state.drinkingGame?.rulePenaltyMode) cancelRulePenalty();
    else advanceCard({ skipped: true });
  });
  el.drinkingBackButton.addEventListener("click", goBack);
  el.drinkingRulePenaltyButton.addEventListener("click", beginRulePenalty);
  el.drinkingChallengeTimerButton.addEventListener("click", startChallengeTimer);
  el.drinkingEndButton.addEventListener("click", () => {
    if (confirm("Terminer la partie maintenant ?")) finishDrinkingGame();
  });
  el.drinkingReplayButton.addEventListener("click", openDrinkingSetup);
  el.drinkingResultsHomeButton.addEventListener("click", () => callbacks.onHome?.());
}
