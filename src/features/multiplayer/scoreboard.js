import { clone } from "../../core/utils.js";

export function emptyModeStats() {
  return {
    attempts: 0,
    successes: 0,
    passed: 0,
    expired: 0,
    points: 0,
    usedMs: 0
  };
}

export function createScoreboard(players, modeIds) {
  return Object.fromEntries((players || []).map(player => [player.id, {
    playerId: player.id,
    playerName: player.name,
    score: 0,
    turnsPlayed: 0,
    successes: 0,
    passed: 0,
    expired: 0,
    perMode: Object.fromEntries((modeIds || []).map(modeId => [modeId, emptyModeStats()])),
    turns: []
  }]));
}

export function summarizeHistory(history, modeIds = []) {
  const perMode = Object.fromEntries(modeIds.map(modeId => [modeId, emptyModeStats()]));
  let score = 0;
  let successes = 0;
  let passed = 0;
  let expired = 0;

  (history || []).forEach(entry => {
    const modeId = entry.card?.modeId || (entry.kind === "draw" ? "draw" : "unknown");
    perMode[modeId] ||= emptyModeStats();
    const stats = perMode[modeId];
    stats.attempts += 1;
    stats.points += Number(entry.points) || 0;
    stats.usedMs += Number(entry.usedMs) || 0;
    score += Number(entry.points) || 0;
    if (entry.result === "valid") {
      stats.successes += 1;
      successes += 1;
    } else if (entry.result === "expired") {
      stats.expired += 1;
      expired += 1;
    } else {
      stats.passed += 1;
      passed += 1;
    }
  });

  return { score, successes, passed, expired, perMode };
}

export function normalizeTurnResult(result, turn, modeIds) {
  const summary = summarizeHistory(result?.history || [], modeIds);
  return {
    turnId: turn.id,
    turnIndex: turn.turnIndex,
    cycleIndex: turn.cycleIndex,
    playerId: turn.playerId,
    playerName: turn.playerName,
    modeOrder: [...turn.modeOrder],
    reason: result?.reason || "manual",
    durationMs: Number(result?.durationMs) || 0,
    remainingMs: Number(result?.remainingMs) || 0,
    history: clone(result?.history || []),
    ...summary
  };
}

export function addTurnToScoreboard(scoreboard, turnResult) {
  const player = scoreboard[turnResult.playerId];
  if (!player) throw new Error(`Joueur introuvable dans le score : ${turnResult.playerId}`);
  player.score += turnResult.score;
  player.turnsPlayed += 1;
  player.successes += turnResult.successes;
  player.passed += turnResult.passed;
  player.expired += turnResult.expired;
  Object.entries(turnResult.perMode).forEach(([modeId, stats]) => {
    player.perMode[modeId] ||= emptyModeStats();
    Object.keys(emptyModeStats()).forEach(key => {
      player.perMode[modeId][key] += Number(stats[key]) || 0;
    });
  });
  player.turns.push(clone(turnResult));
  return player;
}

function rankingTuple(player) {
  return [player.score, player.successes, -player.passed, -player.expired];
}

function sameRanking(a, b) {
  return rankingTuple(a).every((value, index) => value === rankingTuple(b)[index]);
}

export function rankScoreboard(scoreboard) {
  const players = Object.values(scoreboard || {}).map(clone);
  players.sort((a, b) =>
    b.score - a.score ||
    b.successes - a.successes ||
    a.passed - b.passed ||
    a.expired - b.expired ||
    a.playerName.localeCompare(b.playerName, "fr")
  );
  let previous = null;
  let rank = 0;
  return players.map((player, index) => {
    if (!previous || !sameRanking(player, previous)) rank = index + 1;
    previous = player;
    return { ...player, rank };
  });
}

export function bestModeForPlayer(player) {
  const entries = Object.entries(player?.perMode || {}).filter(([, stats]) => stats.attempts > 0);
  if (!entries.length) return null;
  entries.sort(([, a], [, b]) =>
    b.points - a.points ||
    b.successes - a.successes ||
    a.attempts - b.attempts
  );
  return entries[0][0];
}
