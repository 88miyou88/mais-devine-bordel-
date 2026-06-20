import { clone, shuffle } from "../../core/utils.js";

const FLOW_CONTINUOUS = "continuous";
const FLOW_MODE_BLOCKS = "mode-blocks";

function uniqueModeIds(modeIds) {
  return [...new Set((modeIds || []).map(String).filter(Boolean))];
}

function rotate(items, offset) {
  if (items.length < 2) return [...items];
  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
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

function orderKey(order) {
  return order.join("|");
}

function generatePermutationsUntil(items, limit) {
  const results = [];
  const used = new Array(items.length).fill(false);
  const current = [];

  function visit() {
    if (results.length >= limit) return;
    if (current.length === items.length) {
      results.push([...current]);
      return;
    }
    for (let index = 0; index < items.length; index += 1) {
      if (used[index]) continue;
      used[index] = true;
      current.push(items[index]);
      visit();
      current.pop();
      used[index] = false;
      if (results.length >= limit) return;
    }
  }

  visit();
  return results;
}

/*
 * Une classe de rotations contient N ordres parfaitement équilibrés : chaque
 * mode occupe exactement une fois chaque position. Deux bases canoniques
 * différentes (même premier mode, reste différent) produisent des classes
 * disjointes. On obtient donc des ordres distincts autant que possible sans
 * sacrifier l'équilibre des positions ni calculer systématiquement N! ordres.
 */
function buildRotationClasses(modeIds, classCount, random) {
  if (modeIds.length < 2) return [[...modeIds]];
  const randomized = randomize(modeIds, random);
  const anchor = randomized[0];
  const rest = randomized.slice(1);
  const bases = [];

  if (rest.length <= 7) {
    const permutations = generatePermutationsUntil(rest, classCount);
    randomize(permutations, random).forEach(permutation => {
      if (bases.length < classCount) bases.push([anchor, ...permutation]);
    });
  } else {
    const seen = new Set();
    const maxAttempts = Math.max(100, classCount * 40);
    for (let attempt = 0; attempt < maxAttempts && bases.length < classCount; attempt += 1) {
      const candidate = [anchor, ...randomize(rest, random)];
      const key = orderKey(candidate);
      if (seen.has(key)) continue;
      seen.add(key);
      bases.push(candidate);
    }
  }

  if (!bases.length) bases.push(randomized);
  return bases;
}

function balancedOrdersForPlayerCycles({ players, cycles, modeIds, random }) {
  const totalOrders = players.length * cycles;
  if (modeIds.length < 2) return Array.from({ length: totalOrders }, () => [...modeIds]);

  const classCount = Math.max(1, Math.ceil(totalOrders / modeIds.length));
  const bases = buildRotationClasses(modeIds, classCount, random);
  const uniqueOrders = [];
  const seen = new Set();

  bases.forEach(base => {
    const startOffset = Math.floor(random() * base.length);
    for (let offset = 0; offset < base.length; offset += 1) {
      const order = rotate(base, startOffset + offset);
      const key = orderKey(order);
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueOrders.push(order);
    }
  });

  const orders = [];
  let pass = 0;
  while (orders.length < totalOrders) {
    const source = pass % 2 === 0 ? uniqueOrders : [...uniqueOrders].reverse();
    source.forEach(order => {
      if (orders.length < totalOrders) orders.push([...order]);
    });
    pass += 1;
  }
  return orders;
}

function normalizePlayers(players) {
  return (players || []).map((player, index) => ({
    id: String(player.id || `player-${index + 1}`),
    name: String(player.name || `Joueur ${index + 1}`)
  }));
}

function playerCycleOrders({ players, cycles, modeIds, orderType, random }) {
  if (orderType === "common") {
    const commonOrder = randomize(modeIds, random);
    return {
      commonOrder,
      orders: Array.from({ length: players.length * cycles }, () => [...commonOrder])
    };
  }
  return {
    commonOrder: null,
    orders: balancedOrdersForPlayerCycles({ players, cycles, modeIds, random })
  };
}

function turnBase({ turnIndex, cycleIndex, playerIndex, player, route }) {
  return {
    turnIndex,
    cycleIndex,
    playerIndex,
    playerId: player.id,
    playerName: player.name,
    playerModeOrder: [...route]
  };
}

export function buildMultiplayerSchedule({
  players,
  modeIds,
  cycles = 1,
  flowType = FLOW_CONTINUOUS,
  orderType = "balanced",
  random = Math.random
}) {
  const safePlayers = normalizePlayers(players);
  const safeModes = uniqueModeIds(modeIds);
  const safeCycles = Math.min(20, Math.max(1, Number.parseInt(cycles, 10) || 1));
  if (safePlayers.length < 2) throw new Error("Le multijoueur nécessite au moins deux joueurs.");
  if (!safeModes.length) throw new Error("Sélectionne au moins un mode de jeu.");

  const normalizedFlowType = flowType === FLOW_MODE_BLOCKS ? FLOW_MODE_BLOCKS : FLOW_CONTINUOUS;
  const normalizedOrderType = orderType === "common" ? "common" : "balanced";
  const { commonOrder, orders } = playerCycleOrders({
    players: safePlayers,
    cycles: safeCycles,
    modeIds: safeModes,
    orderType: normalizedOrderType,
    random
  });
  const turns = [];

  if (normalizedFlowType === FLOW_CONTINUOUS) {
    for (let cycleIndex = 0; cycleIndex < safeCycles; cycleIndex += 1) {
      safePlayers.forEach((player, playerIndex) => {
        const route = orders[cycleIndex * safePlayers.length + playerIndex];
        const turnIndex = turns.length;
        turns.push({
          id: `cycle-${cycleIndex + 1}-player-${playerIndex + 1}`,
          ...turnBase({ turnIndex, cycleIndex, playerIndex, player, route }),
          modePosition: null,
          modeOrder: [...route]
        });
      });
    }
  } else {
    for (let cycleIndex = 0; cycleIndex < safeCycles; cycleIndex += 1) {
      const routes = safePlayers.map((_, playerIndex) =>
        orders[cycleIndex * safePlayers.length + playerIndex]
      );
      for (let modePosition = 0; modePosition < safeModes.length; modePosition += 1) {
        safePlayers.forEach((player, playerIndex) => {
          const route = routes[playerIndex];
          const modeId = route[modePosition];
          const turnIndex = turns.length;
          turns.push({
            id: `cycle-${cycleIndex + 1}-mode-${modePosition + 1}-player-${playerIndex + 1}`,
            ...turnBase({ turnIndex, cycleIndex, playerIndex, player, route }),
            modePosition,
            modeId,
            modeOrder: [modeId]
          });
        });
      }
    }
  }

  return {
    schemaVersion: 2,
    flowType: normalizedFlowType,
    orderType: normalizedOrderType,
    cycles: safeCycles,
    players: clone(safePlayers),
    modeIds: [...safeModes],
    commonOrder: commonOrder ? [...commonOrder] : null,
    turns
  };
}

function validateContinuousSchedule(schedule, errors) {
  const expectedTurns = schedule.players.length * schedule.cycles;
  if (schedule.turns.length !== expectedTurns) {
    errors.push(`Nombre de manches incorrect : ${schedule.turns.length}/${expectedTurns}.`);
  }
  const expectedModes = [...schedule.modeIds].sort().join("|");
  const counts = new Map(schedule.players.map(player => [player.id, 0]));
  schedule.turns.forEach(turn => {
    if (!counts.has(turn.playerId)) errors.push(`Joueur inconnu : ${turn.playerId}.`);
    else counts.set(turn.playerId, counts.get(turn.playerId) + 1);
    if ([...new Set(turn.modeOrder)].sort().join("|") !== expectedModes) {
      errors.push(`Modes incomplets ou dupliqués pour ${turn.playerName}.`);
    }
  });
  counts.forEach((count, playerId) => {
    if (count !== schedule.cycles) errors.push(`${playerId} possède ${count} manche(s) au lieu de ${schedule.cycles}.`);
  });
}

function validateModeBlocksSchedule(schedule, errors) {
  const expectedTurns = schedule.players.length * schedule.cycles * schedule.modeIds.length;
  if (schedule.turns.length !== expectedTurns) {
    errors.push(`Nombre de manches par mode incorrect : ${schedule.turns.length}/${expectedTurns}.`);
  }
  const expectedModes = [...schedule.modeIds].sort().join("|");
  const grouped = new Map();

  schedule.turns.forEach(turn => {
    if (!Array.isArray(turn.modeOrder) || turn.modeOrder.length !== 1) {
      errors.push(`La manche ${turn.turnIndex + 1} doit contenir un seul mode.`);
      return;
    }
    const key = `${turn.playerId}|${turn.cycleIndex}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(turn.modeOrder[0]);
  });

  schedule.players.forEach(player => {
    for (let cycleIndex = 0; cycleIndex < schedule.cycles; cycleIndex += 1) {
      const modes = grouped.get(`${player.id}|${cycleIndex}`) || [];
      if ([...new Set(modes)].sort().join("|") !== expectedModes || modes.length !== schedule.modeIds.length) {
        errors.push(`${player.name} ne joue pas exactement tous les modes au cycle ${cycleIndex + 1}.`);
      }
    }
  });

  if (schedule.orderType === "common") {
    for (let cycleIndex = 0; cycleIndex < schedule.cycles; cycleIndex += 1) {
      for (let position = 0; position < schedule.modeIds.length; position += 1) {
        const modes = schedule.turns
          .filter(turn => turn.cycleIndex === cycleIndex && turn.modePosition === position)
          .map(turn => turn.modeOrder[0]);
        if (new Set(modes).size > 1) errors.push(`L’ordre commun diverge au cycle ${cycleIndex + 1}, position ${position + 1}.`);
      }
    }
  }
}

export function validateMultiplayerSchedule(schedule) {
  if (!schedule || !Array.isArray(schedule.players) || !Array.isArray(schedule.modeIds) || !Array.isArray(schedule.turns)) {
    return { valid: false, errors: ["Structure de planning invalide."] };
  }
  const errors = [];
  schedule.turns.forEach((turn, index) => {
    if (turn.turnIndex !== index) errors.push(`Index incohérent pour la manche ${index + 1}.`);
  });

  if (schedule.flowType === FLOW_MODE_BLOCKS) validateModeBlocksSchedule(schedule, errors);
  else validateContinuousSchedule(schedule, errors);

  return { valid: errors.length === 0, errors };
}
