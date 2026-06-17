const SOFT_MODE_LABELS = {
  points: "points de pénalité",
  tokens: "jetons de pénalité",
  mini_challenge: "mini-défi",
  joker: "joker"
};

export function penaltyRange(intensity, maximum) {
  const max = Math.min(10, Math.max(1, Number(maximum) || 3));
  const lightMax = Math.max(1, Math.ceil(max / 3));
  const mediumMin = Math.max(1, Math.floor(max / 3) + 1);
  const mediumMax = Math.max(mediumMin, Math.ceil((max * 2) / 3));
  const strongMin = Math.max(1, Math.floor((max * 2) / 3) + 1);
  if (intensity === "light") return [1, lightMax];
  if (intensity === "strong") return [Math.min(strongMin, max), max];
  return [Math.min(mediumMin, max), Math.min(mediumMax, max)];
}

export function rollPenalty(intensity, maximum, random = Math.random) {
  const [min, max] = penaltyRange(intensity, maximum);
  return min + Math.floor(random() * (max - min + 1));
}

export function describePenalty(player, amount, softMode = "points") {
  if (!player?.teamSoft) return `${amount} gorgée${amount > 1 ? "s" : ""} · +${amount} point${amount > 1 ? "s" : ""}`;
  if (softMode === "mini_challenge") {
    return `1 mini-défi choisi par le groupe · +${amount} point${amount > 1 ? "s" : ""}`;
  }
  if (softMode === "joker") {
    return `perd ${Math.max(1, Math.ceil(amount / 3))} joker${amount > 3 ? "s" : ""} · +${amount} point${amount > 1 ? "s" : ""}`;
  }
  const label = SOFT_MODE_LABELS[softMode] || SOFT_MODE_LABELS.points;
  return `${amount} ${label} · +${amount} point${amount > 1 ? "s" : ""}`;
}

export function applyPenalty(player, stats, amount, softMode = "points", reason = "card") {
  const playerStats = stats[player.id];
  if (!playerStats) return;
  const value = Math.max(1, Number(amount) || 1);
  playerStats.penaltyPoints += value;
  playerStats.penaltiesReceived += 1;
  if (reason === "rule") playerStats.rulesForgotten += 1;
  if (player.teamSoft) {
    if (softMode === "tokens") playerStats.tokens += value;
    else if (softMode === "mini_challenge") playerStats.miniChallenges += 1;
    else if (softMode === "joker") playerStats.jokersLost += Math.max(1, Math.ceil(value / 3));
  } else {
    playerStats.sips += value;
  }
}
