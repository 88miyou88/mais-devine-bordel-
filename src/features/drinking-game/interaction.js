import { describePenalty } from "./penalties.js";

const INTERACTIONS = {
  vote: {
    selection: "single_all",
    targetLabel: "Qui est désigné ?",
    leftLabel: "Personne",
    rightLabel: "Valider",
    leftAction: "no_penalty",
    rightAction: "penalty",
    requiresRightSelection: true
  },
  personal_condition: {
    selection: "hidden",
    leftLabel: "Non",
    rightLabel: "Oui",
    leftAction: "no_penalty",
    rightAction: "penalty"
  },
  answer_or_penalty: {
    selection: "hidden",
    leftLabel: "Refus",
    rightLabel: "Répondu",
    leftAction: "penalty",
    rightAction: "no_penalty"
  },
  collective_condition: {
    selection: "multiple_all",
    targetLabel: "Qui est concerné ?",
    leftLabel: "Personne",
    rightLabel: "Valider",
    leftAction: "no_penalty",
    rightAction: "penalty",
    requiresRightSelection: true
  },
  challenge_or_penalty: {
    selection: "hidden",
    leftLabel: "Raté",
    rightLabel: "Réussi",
    leftAction: "penalty",
    rightAction: "no_penalty"
  },
  duel: {
    selection: "single_targets",
    targetLabel: "Qui a perdu ?",
    leftLabel: "Égalité",
    rightLabel: "Valider",
    leftAction: "no_penalty",
    rightAction: "penalty",
    requiresRightSelection: true
  },
  tribunal: {
    selection: "hidden",
    leftLabel: "Non coupable",
    rightLabel: "Coupable",
    leftAction: "no_penalty",
    rightAction: "penalty"
  },
  temporary_rule: {
    selection: "hidden",
    leftLabel: "Ignorer",
    rightLabel: "Activer",
    leftAction: "no_penalty",
    rightAction: "activate_rule"
  }
};

export function interactionForCard(card) {
  return INTERACTIONS[card?.resolution?.kind] || INTERACTIONS.answer_or_penalty;
}

export function defaultPenaltyTargetIds(card) {
  if (!card) return [];
  if (["single_player", "single_and_group"].includes(card.targetType)) return card.targetIds.slice(0, 1);
  if (card.targetType === "two_players" && card.resolution?.kind === "challenge_or_penalty") {
    return card.targetIds.slice(0, 1);
  }
  return [];
}

export function selectablePlayerIds(card, players) {
  const interaction = interactionForCard(card);
  if (interaction.selection === "single_targets") return [...card.targetIds];
  if (["single_all", "multiple_all"].includes(interaction.selection)) return players.map(player => player.id);
  return [];
}

function playerById(players, playerId) {
  return players.find(player => player.id === playerId) || null;
}

function selectedPlayers(players, targetIds) {
  return targetIds.map(playerId => playerById(players, playerId)).filter(Boolean);
}

function escaped(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensurePeriod(value) {
  const text = String(value || "").trim();
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

function groupPenaltyDescription(players, amount, softMode) {
  if (!players.length) return `${amount} gorgée${amount > 1 ? "s" : ""} / pénalité${amount > 1 ? "s" : ""}`;
  const descriptions = [...new Set(players.map(player => describePenalty(player, amount, softMode)))];
  return descriptions.length === 1 ? descriptions[0] : descriptions.join(" / ");
}

function personalConditionPrompt(card, players, amount, softMode) {
  const target = playerById(players, card.targetIds[0]);
  if (!target) return card.renderedPrompt;
  const consequence = describePenalty(target, amount, softMode);
  const match = card.renderedPrompt.match(new RegExp(`^${escaped(target.name)},\\s*as-tu déjà\\s+(.+?)[?？]?$`, "i"));
  if (!match) return `${ensurePeriod(card.renderedPrompt)} Si oui, prends ${consequence}.`;
  return `${target.name}, prends ${consequence} si tu as déjà ${match[1]}.`;
}

function answerPrompt(card, players, amount, softMode) {
  const target = playerById(players, card.targetIds[0]);
  if (!target) return ensurePeriod(card.renderedPrompt);
  return `${ensurePeriod(card.renderedPrompt)} Si tu ne réponds pas, prends ${describePenalty(target, amount, softMode)}.`;
}

function challengePrompt(card, players, amount, softMode) {
  const target = playerById(players, defaultPenaltyTargetIds(card)[0]);
  if (!target) return ensurePeriod(card.renderedPrompt);
  return `${ensurePeriod(card.renderedPrompt)} Si tu refuses ou rates, prends ${describePenalty(target, amount, softMode)}.`;
}

function votePrompt(card, players, selectedTargetIds, amount, softMode) {
  const selected = playerById(players, selectedTargetIds[0]);
  if (!selected) return `${ensurePeriod(card.renderedPrompt)} Choisis la personne concernée.`;
  return `${ensurePeriod(card.renderedPrompt)} ${selected.name} prend ${describePenalty(selected, amount, softMode)}.`;
}

function collectivePrompt(card, players, selectedTargetIds, amount, softMode) {
  const selected = selectedPlayers(players, selectedTargetIds);
  const consequence = groupPenaltyDescription(selected.length ? selected : players, amount, softMode);
  const prompt = ensurePeriod(card.renderedPrompt);
  const placeholder = /(?:les\s+)?personnes?\s+concern(?:ée|é|ées|és)e?s?\s+prennent\s+(?:la\s+)?pénalité(?:\s+prévue)?[.!?…]*$/i;
  const generic = /prennent\s+(?:la\s+)?pénalité(?:\s+prévue)?[.!?…]*$/i;
  if (placeholder.test(prompt)) return prompt.replace(placeholder, `les personnes concernées prennent ${consequence}.`);
  if (generic.test(prompt)) return prompt.replace(generic, `prennent ${consequence}.`);

  // Les cartes « Qui a… ? » sont affichées comme une seule consigne complète
  // au lieu d'ajouter une deuxième phrase répétitive sur la pénalité.
  const barePrompt = prompt.replace(/[.!?…]+$/u, "").trim();
  const whoHas = barePrompt.match(/^Qui a\s+(.+)$/iu);
  if (whoHas) return `Toutes les personnes qui ont ${whoHas[1]} prennent ${consequence}.`;
  const whoWears = barePrompt.match(/^Qui porte\s+(.+)$/iu);
  if (whoWears) return `Toutes les personnes qui portent ${whoWears[1]} prennent ${consequence}.`;
  const whoIs = barePrompt.match(/^Qui est\s+(.+)$/iu);
  if (whoIs) return `Toutes les personnes qui sont ${whoIs[1]} prennent ${consequence}.`;

  return `${prompt} Les personnes concernées prennent ${consequence}.`;
}

function duelPrompt(card, players, selectedTargetIds, amount, softMode) {
  const selected = playerById(players, selectedTargetIds[0]);
  if (!selected) return `${ensurePeriod(card.renderedPrompt)} Choisis le perdant.`;
  return `${ensurePeriod(card.renderedPrompt)} ${selected.name} prend ${describePenalty(selected, amount, softMode)}.`;
}

function tribunalPrompt(card, players, amount, softMode) {
  const target = playerById(players, card.targetIds[0]);
  if (!target) return ensurePeriod(card.renderedPrompt);
  return `${ensurePeriod(card.renderedPrompt)} S’il est déclaré coupable, ${target.name} prend ${describePenalty(target, amount, softMode)}.`;
}

function temporaryRulePrompt(card) {
  const duration = Math.max(1, Number(card.ruleDurationCards) || 3);
  return `${ensurePeriod(card.renderedPrompt)} La règle reste active pendant ${duration} carte${duration > 1 ? "s" : ""}.`;
}

export function formattedPrompt(card, players, selectedTargetIds, amount, softMode) {
  if (!card) return "";
  switch (card.resolution?.kind) {
    case "personal_condition":
      return personalConditionPrompt(card, players, amount, softMode);
    case "answer_or_penalty":
      return answerPrompt(card, players, amount, softMode);
    case "challenge_or_penalty":
      return challengePrompt(card, players, amount, softMode);
    case "vote":
      return votePrompt(card, players, selectedTargetIds, amount, softMode);
    case "collective_condition":
      return collectivePrompt(card, players, selectedTargetIds, amount, softMode);
    case "duel":
      return duelPrompt(card, players, selectedTargetIds, amount, softMode);
    case "tribunal":
      return tribunalPrompt(card, players, amount, softMode);
    case "temporary_rule":
      return temporaryRulePrompt(card);
    default:
      return ensurePeriod(card.renderedPrompt);
  }
}
