function candidatePlayers(players, stats, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const available = players.filter(player => !excluded.has(player.id));
  return available.sort((a, b) => {
    const aStats = stats[a.id] || {};
    const bStats = stats[b.id] || {};
    return (aStats.targeted || 0) - (bStats.targeted || 0) ||
      (aStats.lastTargetedAt || -1) - (bStats.lastTargetedAt || -1) ||
      a.name.localeCompare(b.name, "fr");
  });
}

function chooseOne(players, stats, cardIndex, excludedIds = [], random = Math.random) {
  const candidates = candidatePlayers(players, stats, excludedIds);
  if (!candidates.length) return null;
  const minTargeted = stats[candidates[0].id]?.targeted || 0;
  const pool = candidates.filter(player => (stats[player.id]?.targeted || 0) <= minTargeted + 1);
  const notLast = pool.filter(player => stats[player.id]?.lastTargetedAt !== cardIndex - 1);
  const finalPool = notLast.length ? notLast : pool;
  return finalPool[Math.floor(random() * finalPool.length)] || finalPool[0];
}

export function assignTargets(card, players, stats, cardIndex, random = Math.random) {
  const targetIds = [];
  if (["single_player", "single_and_group", "group_or_player"].includes(card.targetType)) {
    const player = chooseOne(players, stats, cardIndex, [], random);
    if (player) targetIds.push(player.id);
  } else if (card.targetType === "two_players") {
    const first = chooseOne(players, stats, cardIndex, [], random);
    const second = chooseOne(players, stats, cardIndex, first ? [first.id] : [], random);
    if (first) targetIds.push(first.id);
    if (second) targetIds.push(second.id);
  }

  targetIds.forEach(playerId => {
    const playerStats = stats[playerId];
    if (!playerStats) return;
    playerStats.targeted += 1;
    playerStats.lastTargetedAt = cardIndex;
  });

  return targetIds;
}

export function replacePlayerPlaceholders(prompt, players, targetIds) {
  const first = players.find(player => player.id === targetIds[0])?.name || "Un joueur";
  const second = players.find(player => player.id === targetIds[1])?.name || "un autre joueur";
  return String(prompt || "")
    .replaceAll("[prénom d'un joueur]", first)
    .replaceAll("[prénom d'un autre joueur]", second);
}
