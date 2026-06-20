import { DRINKING_SESSION_KEY, DRINKING_SESSION_SCHEMA } from "../../config/config.js";
import { readJsonStorage, writeJsonStorage } from "../../core/storage.js";

export function saveDrinkingSession(game) {
  if (!game || game.finished) return;
  writeJsonStorage(DRINKING_SESSION_KEY, {
    schema: DRINKING_SESSION_SCHEMA,
    savedAt: new Date().toISOString(),
    game
  });
}

export function readDrinkingSession() {
  const data = readJsonStorage(DRINKING_SESSION_KEY, null);
  if (Number(data?.schema) !== DRINKING_SESSION_SCHEMA || !data?.game || !Array.isArray(data.game.players)) return null;
  return data;
}

export function clearDrinkingSession() {
  localStorage.removeItem(DRINKING_SESSION_KEY);
}
