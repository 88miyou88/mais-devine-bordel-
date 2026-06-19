const SOFT_MODE_LABELS = {
  points: "pénalité",
  tokens: "jeton de pénalité",
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

function pluralize(value, singular, plural = `${singular}s`) {
  return `${value} ${value > 1 ? plural : singular}`;
}

export function describePenalty(player, amount, softMode = "points") {
  const value = Math.max(1, Number(amount) || 1);
  if (!player?.teamSoft) return pluralize(value, "gorgée");
  if (softMode === "mini_challenge") return "1 mini-défi";
  if (softMode === "joker") {
    const jokers = Math.max(1, Math.ceil(value / 3));
    return pluralize(jokers, "joker");
  }
  const label = SOFT_MODE_LABELS[softMode] || SOFT_MODE_LABELS.points;
  if (softMode === "tokens") return pluralize(value, label, "jetons de pénalité");
  return pluralize(value, label, "pénalités");
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
