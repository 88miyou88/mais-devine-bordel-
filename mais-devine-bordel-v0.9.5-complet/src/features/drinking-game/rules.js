export function addRule(activeRules, card, penaltyAmount = 1) {
  const duration = Math.max(2, Number(card.ruleDurationCards) || 3);
  const rule = {
    id: `${card.id}-${Date.now()}`,
    text: card.renderedPrompt || card.prompt,
    remainingCards: duration,
    penaltyAmount: Math.max(1, Number(penaltyAmount) || 1)
  };
  return [...activeRules.slice(-2), rule];
}

export function tickRules(activeRules, addedRuleId = null) {
  return activeRules
    .map(rule => rule.id === addedRuleId ? rule : { ...rule, remainingCards: rule.remainingCards - 1 })
    .filter(rule => rule.remainingCards > 0);
}
