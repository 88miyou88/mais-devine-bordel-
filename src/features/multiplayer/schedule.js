import { clone, shuffle } from "../../core/utils.js";

function uniqueModeIds(modeIds) {
  return [...new Set((modeIds || []).map(String).filter(Boolean))];
}

function rotate(items, offset) {
  if (items.length < 2) return [...items];
  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function orderKey(order) {
  return order.join("|");
}

function randomize(items, random) {
  if (random === Math.random) return shuffle(items);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

/*
 * Pour N modes, on construit N parcours : toutes les rotations d’un ordre
 * aléatoire. Une série complète de rotations place chaque mode exactement une
 * fois à chaque position. Le coût reste linéaire si de nouveaux modes sont
 * ajoutés, contrairement à une génération de N! permutations.
 */
function candidateOrders(base) {
  if (base.length < 2) return [[...base]];
  return base.map((_, offset) => rotate(base, offset));
}

function balancedOrdersForTurns({ players, cycles, modeIds, random }) {
  const candidates = candidateOrders(randomize(modeIds, random));
  const candidateCount = candidates.length;
  const initialOffset = candidateCount > 1
    ? Math.floor(random() * candidateCount)
    : 0;
  const remainder = players.length % candidateCount;
  const cycleShift = candidateCount > 1 ? (remainder || 1) : 0;
  const orders = [];

  for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
    /*
     * Les joueurs consomment des rotations consécutives : dans chaque cycle,
     * les positions diffèrent donc d’au plus une occurrence. Le point de
     * départ se décale entre les cycles pour répartir les éventuels restes et
     * empêcher un joueur de recevoir le même parcours deux fois de suite.
     */
    const cycleOffset = (initialOffset + cycleIndex * cycleShift) % candidateCount;
    players.forEach((_, playerIndex) => {
      orders.push([...candidates[(cycleOffset + playerIndex) % candidateCount]]);
    });
  }
  return orders;
}

export function buildMultiplayerSchedule({
  players,
  modeIds,
  cycles = 1,
  orderType = "balanced",
  random = Math.random
}) {
  const safePlayers = (players || []).map((player, index) => ({
    id: String(player.id || `player-${index + 1}`),
    name: String(player.name || `Joueur ${index + 1}`)
  }));
  const safeModes = uniqueModeIds(modeIds);
  const safeCycles = Math.min(20, Math.max(1, Number.parseInt(cycles, 10) || 1));
  if (safePlayers.length < 2) throw new Error("Le multijoueur nécessite au moins deux joueurs.");
  if (!safeModes.length) throw new Error("Sélectionne au moins un mode de jeu.");

  const normalizedOrderType = orderType === "common" ? "common" : "balanced";
  const commonOrder = randomize(safeModes, random);
  const balancedOrders = normalizedOrderType === "balanced"
    ? balancedOrdersForTurns({ players: safePlayers, cycles: safeCycles, modeIds: safeModes, random })
    : [];
  const turns = [];

  for (let cycleIndex = 0; cycleIndex < safeCycles; cycleIndex += 1) {
    safePlayers.forEach((player, playerIndex) => {
      const turnIndex = turns.length;
      turns.push({
        id: `cycle-${cycleIndex + 1}-turn-${playerIndex + 1}`,
        turnIndex,
        cycleIndex,
        playerIndex,
        playerId: player.id,
        playerName: player.name,
        modeOrder: normalizedOrderType === "common"
          ? [...commonOrder]
          : balancedOrders[turnIndex]
      });
    });
  }

  return {
    schemaVersion: 1,
    orderType: normalizedOrderType,
    cycles: safeCycles,
    players: clone(safePlayers),
    modeIds: [...safeModes],
    turns
  };
}

export function validateMultiplayerSchedule(schedule) {
  if (!schedule || !Array.isArray(schedule.players) || !Array.isArray(schedule.modeIds) || !Array.isArray(schedule.turns)) {
    return { valid: false, errors: ["Structure de planning invalide."] };
  }
  const errors = [];
  const expectedTurns = schedule.players.length * schedule.cycles;
  if (schedule.turns.length !== expectedTurns) {
    errors.push(`Nombre de manches incorrect : ${schedule.turns.length}/${expectedTurns}.`);
  }
  const expectedModes = [...schedule.modeIds].sort().join("|");
  const counts = new Map(schedule.players.map(player => [player.id, 0]));
  schedule.turns.forEach((turn, index) => {
    if (turn.turnIndex !== index) errors.push(`Index incohérent pour la manche ${index + 1}.`);
    if (!counts.has(turn.playerId)) errors.push(`Joueur inconnu : ${turn.playerId}.`);
    else counts.set(turn.playerId, counts.get(turn.playerId) + 1);
    if ([...new Set(turn.modeOrder)].sort().join("|") !== expectedModes) {
      errors.push(`Modes incomplets ou dupliqués pour ${turn.playerName}.`);
    }
  });
  counts.forEach((count, playerId) => {
    if (count !== schedule.cycles) errors.push(`${playerId} possède ${count} manche(s) au lieu de ${schedule.cycles}.`);
  });
  return { valid: errors.length === 0, errors };
}
