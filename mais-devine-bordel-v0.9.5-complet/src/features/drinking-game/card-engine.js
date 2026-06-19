import { filteredCardsForMode } from "../../services/libraries.js";
import { assignTargets, replacePlayerPlaceholders } from "./targeting.js";

export function shuffledCards(cards, random = Math.random) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function buildDeck(playerCount, random = Math.random) {
  return shuffledCards(
    filteredCardsForMode("drinking").filter(card => (card.minPlayers || 2) <= playerCount),
    random
  );
}

export function drawPreparedCard(game, random = Math.random) {
  if (!game.deck.length) game.deck = shuffledCards(game.usedCards, random);
  const card = game.deck.shift();
  if (!card) return null;
  game.usedCards.push(card);
  const targetIds = assignTargets(card, game.players, game.stats, game.playedCount, random);
  return {
    ...card,
    targetIds,
    renderedPrompt: replacePlayerPlaceholders(card.prompt, game.players, targetIds)
  };
}
