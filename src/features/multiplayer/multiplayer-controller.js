import {
  MAX_MULTIPLAYER_PLAYERS,
  MIN_MULTIPLAYER_PLAYERS,
  MODE_ICONS
} from "../../config/config.js";
import {
  el,
  releaseWakeLock,
  requestGameDisplay,
  showScreen
} from "../../core/dom.js";
import { state } from "../../core/state.js";
import { shuffle } from "../../core/utils.js";
import { startDrawingRound, stopDrawingRound } from "../drawing/drawing-controller.js";
import { getFeasibleMixedDrawingCount } from "../drawing/mixed-drawing.js";
import { startClassicRound, stopClassicGame } from "../game/game-controller.js";
import { getRequestedSeconds, runCountdown } from "../game/timer.js";
import {
  modeConfig,
  saveGlobalSettings,
  selectedCardsForMode
} from "../../services/libraries.js";
import { buildMultiplayerSchedule } from "./schedule.js";
import {
  addTurnToScoreboard,
  bestModeForPlayer,
  normalizeTurnResult,
  rankScoreboard
} from "./scoreboard.js";
import {
  clearMultiplayerSession,
  createMultiplayerSession,
  loadMultiplayerSession,
  saveMultiplayerSession
} from "./session.js";

let callbacks = {};
let lastTurnResult = null;
let completedConfig = null;

function multiplayerSettings() {
  return state.settings.multiplayer;
}

function currentSession() {
  return state.multiplayer;
}

function currentTurn() {
  const session = currentSession();
  return session?.schedule.turns[session.nextTurnIndex] || null;
}

function modeRouteHtml(modeIds) {
  return modeIds.map((modeId, index) => {
    const config = modeConfig(modeId);
    const arrow = index < modeIds.length - 1 ? '<span class="mode-route-arrow">›</span>' : "";
    return `<span class="mode-route-item" style="--mode-color:${config.color}"><span class="mode-route-icon">${MODE_ICONS[config.icon] || ""}</span><strong>${config.name}</strong></span>${arrow}`;
  }).join("");
}

function selectedModeIds() {
  return [...state.settings.selectedModeIds];
}

function nextPlayerId() {
  const existing = new Set(multiplayerSettings().players.map(player => player.id));
  let index = multiplayerSettings().players.length + 1;
  let id = `player-${index}`;
  while (existing.has(id)) {
    index += 1;
    id = `player-${index}`;
  }
  return id;
}

function saveSetup() {
  saveGlobalSettings();
  renderSetup();
}

function updatePlayer(index, name) {
  const player = multiplayerSettings().players[index];
  if (!player) return;
  player.name = name.slice(0, 24);
  saveGlobalSettings();
  renderEstimate();
}

function movePlayer(index, delta) {
  const players = multiplayerSettings().players;
  const target = index + delta;
  if (target < 0 || target >= players.length) return;
  [players[index], players[target]] = [players[target], players[index]];
  saveSetup();
}

function removePlayer(index) {
  const players = multiplayerSettings().players;
  if (players.length <= MIN_MULTIPLAYER_PLAYERS) return;
  players.splice(index, 1);
  saveSetup();
}

function renderPlayerList() {
  const players = multiplayerSettings().players;
  el.multiplayerPlayerList.innerHTML = "";
  players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "multiplayer-player-row";

    const number = document.createElement("span");
    number.className = "multiplayer-player-number";
    number.textContent = String(index + 1);

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 24;
    input.value = player.name;
    input.setAttribute("aria-label", `Prénom du joueur ${index + 1}`);
    input.addEventListener("input", () => updatePlayer(index, input.value));
    input.addEventListener("blur", () => {
      const cleaned = input.value.trim() || `Joueur ${index + 1}`;
      player.name = cleaned;
      input.value = cleaned;
      saveGlobalSettings();
      renderEstimate();
    });

    const actions = document.createElement("div");
    actions.className = "multiplayer-player-actions";
    const up = document.createElement("button");
    up.type = "button";
    up.className = "mini-button";
    up.textContent = "↑";
    up.disabled = index === 0;
    up.setAttribute("aria-label", `Monter ${player.name}`);
    up.addEventListener("click", () => movePlayer(index, -1));
    const down = document.createElement("button");
    down.type = "button";
    down.className = "mini-button";
    down.textContent = "↓";
    down.disabled = index === players.length - 1;
    down.setAttribute("aria-label", `Descendre ${player.name}`);
    down.addEventListener("click", () => movePlayer(index, 1));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "mini-button player-remove-button";
    remove.textContent = "×";
    remove.disabled = players.length <= MIN_MULTIPLAYER_PLAYERS;
    remove.setAttribute("aria-label", `Supprimer ${player.name}`);
    remove.addEventListener("click", () => removePlayer(index));
    actions.append(up, down, remove);
    row.append(number, input, actions);
    el.multiplayerPlayerList.append(row);
  });
  el.addPlayerButton.disabled = players.length >= MAX_MULTIPLAYER_PLAYERS;
}

function renderSetupModes() {
  el.multiplayerSetupModeSummary.innerHTML = modeRouteHtml(selectedModeIds());
}

function renderEstimate() {
  const players = multiplayerSettings().players.length;
  const cycles = Number(multiplayerSettings().cycles) || 1;
  const turns = players * cycles;
  const modes = selectedModeIds();
  const drawOnly = modes.length === 1 && modes[0] === "draw";
  const duration = getRequestedSeconds();
  const baseSeconds = drawOnly
    ? state.settings.modeOptions.draw.attemptCount * state.settings.modeOptions.draw.durations.medium
    : duration;
  const estimatedMinutes = Math.max(1, Math.ceil(turns * (baseSeconds + 12) / 60));
  el.multiplayerEstimate.innerHTML = `
    <strong>${turns} manche${turns > 1 ? "s" : ""} au total</strong>
    <span>${cycles} cycle${cycles > 1 ? "s" : ""} · environ ${estimatedMinutes} min · ${modes.length} mode${modes.length > 1 ? "s" : ""} par manche</span>
  `;
}

function renderSetup() {
  renderPlayerList();
  renderSetupModes();
  el.multiplayerCyclesInput.value = String(multiplayerSettings().cycles);
  el.multiplayerOrderInputs.forEach(input => {
    input.checked = input.value === multiplayerSettings().orderType;
  });
  renderEstimate();
}

export function openMultiplayerSetup() {
  stopClassicGame();
  stopDrawingRound();
  renderSetup();
  showScreen(el.multiplayerSetupScreen);
}

function validateSetup() {
  const players = multiplayerSettings().players;
  if (players.length < MIN_MULTIPLAYER_PLAYERS) return "Ajoute au moins deux joueurs.";
  const names = players.map((player, index) => player.name.trim() || `Joueur ${index + 1}`);
  const normalized = names.map(name => name.toLocaleLowerCase("fr"));
  if (new Set(normalized).size !== normalized.length) return "Chaque joueur doit avoir un prénom différent.";
  players.forEach((player, index) => { player.name = names[index].slice(0, 24); });

  const modes = selectedModeIds();
  if (!modes.length) return "Sélectionne au moins un mode.";
  const unavailable = modes.filter(modeId => selectedCardsForMode(modeId).length === 0);
  if (unavailable.length) {
    return `Aucune carte jouable pour : ${unavailable.map(modeId => modeConfig(modeId).name).join(", ")}.`;
  }
  if (modes.includes("draw") && modes.length > 1) {
    const drawCards = selectedCardsForMode("draw");
    const requested = Math.min(state.settings.modeOptions.draw.mixedCount, drawCards.length);
    if (getFeasibleMixedDrawingCount(getRequestedSeconds() * 1000, requested) === 0) {
      return "Cette durée est trop courte pour intégrer le Dessin. Choisis au moins 15 secondes ou désactive ce mode.";
    }
  }
  return "";
}

function buildSessionFromSettings() {
  const schedule = buildMultiplayerSchedule({
    players: multiplayerSettings().players,
    modeIds: selectedModeIds(),
    cycles: multiplayerSettings().cycles,
    orderType: multiplayerSettings().orderType
  });
  return createMultiplayerSession({
    schedule,
    durationSeconds: getRequestedSeconds()
  });
}

function startNewMultiplayer() {
  const error = validateSetup();
  if (error) {
    alert(error);
    return;
  }
  saveGlobalSettings();
  state.multiplayer = buildSessionFromSettings();
  saveMultiplayerSession(state.multiplayer);
  showCurrentHandoff();
}

function currentPlayerScore() {
  const session = currentSession();
  const turn = currentTurn();
  return session?.scoreboard[turn?.playerId] || null;
}

function showCurrentHandoff() {
  const session = currentSession();
  const turn = currentTurn();
  if (!session || !turn) {
    renderFinalResults();
    return;
  }
  const totalTurns = session.schedule.turns.length;
  const playerScore = currentPlayerScore();
  el.multiplayerHandoffKicker.textContent = `Manche ${turn.turnIndex + 1} sur ${totalTurns} · Cycle ${turn.cycleIndex + 1} sur ${session.schedule.cycles}`;
  el.multiplayerHandoffTitle.textContent = `Passe le téléphone à ${turn.playerName}`;
  const drawOnly = turn.modeOrder.length === 1 && turn.modeOrder[0] === "draw";
  el.multiplayerHandoffText.textContent = drawOnly
    ? `${state.settings.modeOptions.draw.attemptCount} dessins pour marquer un maximum de points.`
    : `Tu as ${session.durationSeconds} secondes pour marquer un maximum de points.`;
  el.multiplayerHandoffModes.innerHTML = modeRouteHtml(turn.modeOrder);
  el.multiplayerHandoffScore.textContent = playerScore?.turnsPlayed
    ? `Score actuel : ${playerScore.score} point${playerScore.score > 1 ? "s" : ""}`
    : "Première manche de ce joueur";
  showScreen(el.multiplayerHandoffScreen);
}

async function beginCurrentTurn() {
  const session = currentSession();
  const turn = currentTurn();
  if (!session || !turn) return;
  const drawOnly = turn.modeOrder.length === 1 && turn.modeOrder[0] === "draw";
  if (drawOnly) {
    await startDrawingRound({
      multiplayer: true,
      turnContext: turn,
      usedCardIds: session.usedCardIdsByMode.draw,
      onComplete: result => completeCurrentTurn(result)
    });
    return;
  }
  const started = await startClassicRound({
    multiplayer: true,
    skipCountdown: true,
    durationSeconds: session.durationSeconds,
    modeOrder: turn.modeOrder,
    playerId: turn.playerId,
    turnId: turn.id,
    usedCardIdsByMode: session.usedCardIdsByMode,
    onComplete: result => completeCurrentTurn(result)
  });
  if (!started) showCurrentHandoff();
}

async function handleReady() {
  await requestGameDisplay();
  showScreen(el.countdownScreen);
  runCountdown(beginCurrentTurn);
}

function modeStatChip(modeId, stats) {
  const config = modeConfig(modeId);
  const chip = document.createElement("div");
  chip.className = "multiplayer-mode-stat-chip";
  chip.style.setProperty("--mode-color", config.color);
  chip.title = `${config.name} : ${stats.successes} réussite(s) sur ${stats.attempts}`;
  const icon = document.createElement("span");
  icon.className = "multiplayer-mode-stat-icon";
  icon.innerHTML = MODE_ICONS[config.icon] || "";
  const score = document.createElement("strong");
  score.textContent = `${stats.successes}/${stats.attempts}`;
  chip.append(icon, score);
  return chip;
}

function completeCurrentTurn(result) {
  const session = currentSession();
  const turn = currentTurn();
  if (!session || !turn) return;
  const normalized = normalizeTurnResult(result, turn, session.schedule.modeIds);
  addTurnToScoreboard(session.scoreboard, normalized);
  session.nextTurnIndex += 1;
  lastTurnResult = normalized;
  saveMultiplayerSession(session);
  renderTurnSummary();
}

function renderTurnSummary() {
  const session = currentSession();
  if (!session || !lastTurnResult) return;
  const player = session.scoreboard[lastTurnResult.playerId];
  el.multiplayerTurnSummaryKicker.textContent = `Manche ${lastTurnResult.turnIndex + 1} sur ${session.schedule.turns.length}`;
  el.multiplayerTurnSummaryTitle.textContent = lastTurnResult.playerName;
  el.multiplayerTurnScore.textContent = String(lastTurnResult.score);
  el.multiplayerTurnModeStats.innerHTML = "";
  lastTurnResult.modeOrder.forEach(modeId => {
    el.multiplayerTurnModeStats.append(modeStatChip(modeId, lastTurnResult.perMode[modeId]));
  });
  el.multiplayerTurnTotal.textContent = `Score cumulé : ${player.score} point${player.score > 1 ? "s" : ""}`;
  const finished = session.nextTurnIndex >= session.schedule.turns.length;
  el.multiplayerContinueButton.textContent = finished ? "Voir le classement final" : "Passer au joueur suivant";
  showScreen(el.multiplayerTurnSummaryScreen);
}

function createRankingRow(player) {
  const row = document.createElement("article");
  row.className = `multiplayer-ranking-row rank-${Math.min(player.rank, 4)}`;
  const rank = document.createElement("span");
  rank.className = "multiplayer-rank-number";
  rank.textContent = player.rank === 1 ? "★" : String(player.rank);
  const identity = document.createElement("div");
  identity.className = "multiplayer-ranking-player";
  const name = document.createElement("strong");
  name.textContent = player.playerName;
  const summary = document.createElement("small");
  const bestModeId = bestModeForPlayer(player);
  summary.textContent = `${player.successes} réussite${player.successes > 1 ? "s" : ""} · ${player.passed + player.expired} raté${player.passed + player.expired > 1 ? "s" : ""}${bestModeId ? ` · meilleur mode : ${modeConfig(bestModeId).name}` : ""}`;
  identity.append(name, summary);
  const stats = document.createElement("div");
  stats.className = "multiplayer-ranking-mode-stats";
  currentSession().schedule.modeIds.forEach(modeId => stats.append(modeStatChip(modeId, player.perMode[modeId])));
  const score = document.createElement("strong");
  score.className = "multiplayer-ranking-score";
  score.textContent = `${player.score} pt${player.score > 1 ? "s" : ""}`;
  row.append(rank, identity, stats, score);
  return row;
}

function renderFinalResults() {
  const session = currentSession();
  if (!session) return;
  completedConfig = {
    players: session.schedule.players,
    modeIds: session.schedule.modeIds,
    cycles: session.schedule.cycles,
    orderType: session.schedule.orderType,
    durationSeconds: session.durationSeconds
  };
  const ranking = rankScoreboard(session.scoreboard);
  const winners = ranking.filter(player => player.rank === 1);
  el.multiplayerWinnerBanner.textContent = winners.length === 1
    ? `★ ${winners[0].playerName} remporte la partie avec ${winners[0].score} point${winners[0].score > 1 ? "s" : ""}`
    : `★ Égalité : ${winners.map(player => player.playerName).join(" et ")}`;
  el.multiplayerRanking.innerHTML = "";
  ranking.forEach(player => el.multiplayerRanking.append(createRankingRow(player)));
  clearMultiplayerSession();
  showScreen(el.multiplayerResultsScreen);
  releaseWakeLock();
}

function continueAfterSummary() {
  const session = currentSession();
  if (!session) return;
  if (session.nextTurnIndex >= session.schedule.turns.length) renderFinalResults();
  else showCurrentHandoff();
}

function abandonMultiplayer() {
  if (!confirm("Abandonner cette partie multijoueur ? Les scores en cours seront supprimés.")) return;
  stopClassicGame();
  stopDrawingRound();
  clearMultiplayerSession();
  state.multiplayer = null;
  callbacks.onHome?.();
}

function replayMultiplayer() {
  if (!completedConfig) return;
  const schedule = buildMultiplayerSchedule({
    players: completedConfig.players,
    modeIds: completedConfig.modeIds,
    cycles: completedConfig.cycles,
    orderType: completedConfig.orderType
  });
  state.multiplayer = createMultiplayerSession({
    schedule,
    durationSeconds: completedConfig.durationSeconds
  });
  saveMultiplayerSession(state.multiplayer);
  showCurrentHandoff();
}

function returnHomeFromResults() {
  state.multiplayer = null;
  callbacks.onHome?.();
}

function promptResumeSession() {
  const session = loadMultiplayerSession();
  if (!session || session.nextTurnIndex >= session.schedule.turns.length) {
    if (session) clearMultiplayerSession();
    return;
  }
  const turn = session.schedule.turns[session.nextTurnIndex];
  el.resumeMultiplayerText.textContent = `${turn.playerName} doit jouer la manche ${turn.turnIndex + 1} sur ${session.schedule.turns.length}. La manche interrompue recommencera depuis le début.`;
  state.multiplayer = session;
  el.resumeMultiplayerDialog.showModal();
}

function resumeStoredSession() {
  const session = currentSession();
  if (session) {
    state.settings.selectedModeIds = [...session.schedule.modeIds];
    saveGlobalSettings();
  }
  el.resumeMultiplayerDialog.close();
  showCurrentHandoff();
}

function discardStoredSession() {
  clearMultiplayerSession();
  state.multiplayer = null;
  el.resumeMultiplayerDialog.close();
}

export function initializeMultiplayer(options = {}) {
  callbacks = options;
  el.multiplayerSetupBackButton.addEventListener("click", () => callbacks.onHome?.());
  el.addPlayerButton.addEventListener("click", () => {
    const players = multiplayerSettings().players;
    if (players.length >= MAX_MULTIPLAYER_PLAYERS) return;
    const number = players.length + 1;
    players.push({ id: nextPlayerId(), name: `Joueur ${number}` });
    saveSetup();
  });
  el.shufflePlayersButton.addEventListener("click", () => {
    multiplayerSettings().players = shuffle(multiplayerSettings().players);
    saveSetup();
  });
  el.multiplayerCyclesInput.addEventListener("change", () => {
    multiplayerSettings().cycles = Math.min(10, Math.max(1, Number(el.multiplayerCyclesInput.value) || 1));
    saveSetup();
  });
  el.multiplayerOrderInputs.forEach(input => input.addEventListener("change", () => {
    if (!input.checked) return;
    multiplayerSettings().orderType = input.value === "common" ? "common" : "balanced";
    saveSetup();
  }));
  el.startMultiplayerButton.addEventListener("click", startNewMultiplayer);
  el.multiplayerReadyButton.addEventListener("click", handleReady);
  el.multiplayerAbortButton.addEventListener("click", abandonMultiplayer);
  el.multiplayerContinueButton.addEventListener("click", continueAfterSummary);
  el.multiplayerReplayButton.addEventListener("click", replayMultiplayer);
  el.multiplayerResultsHomeButton.addEventListener("click", returnHomeFromResults);
  el.resumeMultiplayerButton.addEventListener("click", resumeStoredSession);
  el.discardMultiplayerButton.addEventListener("click", discardStoredSession);
  el.resumeMultiplayerDialog.addEventListener("cancel", event => event.preventDefault());
  promptResumeSession();
}
