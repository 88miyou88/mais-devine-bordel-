import { describePenalty } from "./penalties.js";

const INTERACTIONS = {
  vote: {
    selection: "single_all",
    targetLabel: "Qui est désigné ?",
    leftLabel: "Personne",
    rightLabel: "Valider le choix",
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
    leftLabel: "Refus / pas répondu",
    rightLabel: "A répondu",
    leftAction: "penalty",
    rightAction: "no_penalty"
  },
  collective_condition: {
    selection: "multiple_all",
    targetLabel: "Qui est concerné ?",
    leftLabel: "Personne",
    rightLabel: "Valider les joueurs",
    leftAction: "no_penalty",
    rightAction: "penalty",
    requiresRightSelection: true
  },
  challenge_or_penalty: {
    selection: "hidden",
    leftLabel: "Raté / refusé",
    rightLabel: "Défi réussi",
    leftAction: "penalty",
    rightAction: "no_penalty"
  },
  duel: {
    selection: "single_targets",
    targetLabel: "Qui a perdu ?",
    leftLabel: "Égalité / personne",
    rightLabel: "Valider le perdant",
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
    rightLabel: "Activer la règle",
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

export function formatPenaltyList(players, targetIds, amount, softMode) {
  return targetIds
    .map(playerId => players.find(player => player.id === playerId))
    .filter(Boolean)
    .map(player => `${player.name} : ${describePenalty(player, amount, softMode)}`)
    .join(" · ");
}

function singlePenaltySentence(players, targetIds, amount, softMode) {
  const player = players.find(item => item.id === targetIds[0]);
  return player ? `${player.name} prend ${describePenalty(player, amount, softMode)}` : "";
}

function conditionalPrompt(card, players, amount, softMode) {
  const target = players.find(player => player.id === card.targetIds[0]);
  if (!target) return card.renderedPrompt;
  const consequence = describePenalty(target, amount, softMode);
  const escapedName = target.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = card.renderedPrompt.match(new RegExp(`^${escapedName},\\s*as-tu déjà\\s+(.+?)\\?$`, "i"));
  if (!match) return card.renderedPrompt;
  return `${target.name}, ${consequence} si tu as déjà ${match[1]}.`;
}

export function formattedPrompt(card, players, amount, softMode) {
  if (card?.resolution?.kind === "personal_condition") {
    return conditionalPrompt(card, players, amount, softMode);
  }
  return card?.renderedPrompt || "";
}

export function penaltyInstruction(card, players, selectedTargetIds, amount, softMode) {
  const interaction = interactionForCard(card);
  const automaticIds = defaultPenaltyTargetIds(card);
  const targetIds = selectedTargetIds.length ? selectedTargetIds : automaticIds;
  const summary = formatPenaltyList(players, targetIds, amount, softMode);
  const singleSentence = singlePenaltySentence(players, targetIds, amount, softMode);

  switch (card?.resolution?.kind) {
    case "personal_condition":
      return "Swipe à droite si oui, à gauche si non.";
    case "answer_or_penalty":
      return singleSentence ? `Réponds, sinon ${singleSentence}.` : "Réponds ou prends la pénalité.";
    case "challenge_or_penalty":
      return singleSentence ? `Réussi : rien · Raté ou refusé : ${singleSentence}.` : "Réussi : rien · Raté ou refusé : pénalité.";
    case "vote":
      return singleSentence ? `${singleSentence}.` : "Choisissez une personne.";
    case "collective_condition":
      return summary || "Sélectionnez toutes les personnes concernées.";
    case "duel":
      return singleSentence ? `${singleSentence}.` : "Choisissez le perdant.";
    case "tribunal":
      return singleSentence ? `Coupable : ${singleSentence} · Non coupable : rien.` : "Votez coupable ou non coupable.";
    case "temporary_rule":
      return `Active pendant ${card.ruleDurationCards || 3} cartes.`;
    default:
      return interaction.rightLabel;
  }
}
