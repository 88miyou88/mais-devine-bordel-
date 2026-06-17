import { DIFFICULTY_META } from "../../config/config.js";
import { el, requestGameDisplay, showScreen } from "../../core/dom.js";
import { modeState, state } from "../../core/state.js";
import { saveGlobalSettings } from "../../services/libraries.js";
import { buildDeck, drawPreparedCard } from "./card-engine.js";
import { applyPenalty, describePenalty, penaltyRange, rollPenalty } from "./penalties.js";
import { addRule, tickRules } from "./rules.js";
import { clearDrinkingSession, readDrinkingSession, saveDrinkingSession } from "./session.js";

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
    duelsWon: 0
  };
}

function createGame() {
  const players = clone(options().players);
  const endType = options().endType;
  const durationMs = options().durationMinutes * 60_000;
  const game = {
    schema: 1,
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
    finished: false,
    startedAt: new Date().toISOString()
  };
  return game;
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
  game.selectedTargetIds = defaultTargetIds(game.currentCard);
  renderGame();
  saveDrinkingSession(game);
}

function defaultTargetIds(card) {
  if (card.targetType === "single_player") return [...card.targetIds];
  // Pour un duel, les deux participants sont affichés mais le perdant est choisi manuellement.
  if (card.targetType === "two_players") return [];
  if (card.targetType === "single_and_group") return [...card.targetIds];
  return [];
}

function renderGame() {
  const game = state.drinkingGame;
  const card = game.currentCard;
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
  el.drinkingPrompt.textContent = card.renderedPrompt;
  el.drinkingCard.classList.toggle("hot-card", card.adult === true);
  el.drinkingPenaltyText.textContent = card.resolution?.kind === "temporary_rule"
    ? `Règle active pendant ${card.ruleDurationCards || 3} cartes · chaque oubli vaut ${game.currentPenalty} point(s)`
    : `Pénalité de cette carte : ${game.currentPenalty} point${game.currentPenalty > 1 ? "s" : ""} + adaptation boisson/Team soft`;

  renderTargetChoices();
  renderRules();
  el.drinkingBackButton.disabled = game.history.length === 0;
  el.drinkingRulePenaltyButton.disabled = game.activeRules.length === 0;
  el.drinkingApplyPenaltyButton.disabled = card.resolution?.kind === "temporary_rule";
  el.drinkingChallengeTimerButton.classList.toggle("hidden", !card.durationSeconds);
  el.drinkingChallengeTimer.classList.add("hidden");
}

function renderTargetChoices() {
  const game = state.drinkingGame;
  const card = game.currentCard;
  el.drinkingTargetChoices.innerHTML = "";
  const multiple = ["multiple_players", "single_and_group", "group_vote", "group_or_player"].includes(card.targetType);
  game.players.forEach(player => {
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
      renderTargetChoices();
    });
    el.drinkingTargetChoices.append(button);
  });
}

function renderRules() {
  const game = state.drinkingGame;
  el.drinkingRulesSummary.innerHTML = "";
  if (!game.activeRules.length) {
    el.drinkingRulesSummary.textContent = "Aucune règle active";
    return;
  }
  game.activeRules.forEach(rule => {
    const item = document.createElement("span");
    item.textContent = `${rule.text} · ${rule.remainingCards}`;
    item.title = `${rule.remainingCards} carte(s) restante(s)`;
    el.drinkingRulesSummary.append(item);
  });
}

function applySelectedPenalty(reason = "card") {
  const game = state.drinkingGame;
  if (!game.selectedTargetIds.length) {
    alert("Sélectionne au moins une personne qui reçoit la pénalité.");
    return false;
  }
  game.selectedTargetIds.forEach(playerId => {
    const player = game.players.find(item => item.id === playerId);
    if (!player) return;
    applyPenalty(player, game.stats, game.currentPenalty, game.softPenaltyMode, reason);
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

function pushHistory() {
  const game = state.drinkingGame;
  game.history.push(snapshotGame(game));
  if (game.history.length > 40) game.history.shift();
}

function advanceCard({ penalized = false, skipped = false } = {}) {
  const game = state.drinkingGame;
  pushHistory();
  if (penalized && !applySelectedPenalty("card")) {
    game.history.pop();
    return;
  }
  let addedRule = null;
  if (game.currentCard.resolution?.kind === "temporary_rule") {
    game.activeRules = addRule(game.activeRules, game.currentCard);
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
  renderGame();
  saveDrinkingSession(game);
}

function applyRulePenalty() {
  const game = state.drinkingGame;
  if (!game.activeRules.length) return;
  if (!applySelectedPenalty("rule")) return;
  renderTargetChoices();
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
  if (stats.targeted >= 5) return "La cible officielle";
  if (stats.rulesForgotten >= 2) return "L’ennemi du règlement";
  if (stats.penaltyPoints >= 10) return "Le dossier ambulant";
  return "L’innocent autoproclamé";
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
    const values = [
      `${stats.penaltyPoints} pts`,
      player?.teamSoft ? "🥤 Team soft" : `${stats.sips} gorgée${stats.sips > 1 ? "s" : ""}`,
      `${stats.targeted} ciblage${stats.targeted > 1 ? "s" : ""}`
    ];
    values.forEach(value => {
      const badge = document.createElement("span");
      badge.textContent = value;
      detail.append(badge);
    });

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
  el.drinkingNoPenaltyButton.addEventListener("click", () => advanceCard());
  el.drinkingApplyPenaltyButton.addEventListener("click", () => advanceCard({ penalized: true }));
  el.drinkingSkipButton.addEventListener("click", () => advanceCard({ skipped: true }));
  el.drinkingBackButton.addEventListener("click", goBack);
  el.drinkingRulePenaltyButton.addEventListener("click", applyRulePenalty);
  el.drinkingChallengeTimerButton.addEventListener("click", startChallengeTimer);
  el.drinkingEndButton.addEventListener("click", () => {
    if (confirm("Terminer la partie maintenant ?")) finishDrinkingGame();
  });
  el.drinkingReplayButton.addEventListener("click", openDrinkingSetup);
  el.drinkingResultsHomeButton.addEventListener("click", () => callbacks.onHome?.());
}
