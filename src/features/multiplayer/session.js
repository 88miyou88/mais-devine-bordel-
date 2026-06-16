import {
  MULTIPLAYER_SESSION_KEY,
  MULTIPLAYER_SESSION_SCHEMA
} from "../../config/config.js";
import { clone } from "../../core/utils.js";
import { readJsonStorage, writeJsonStorage } from "../../core/storage.js";
import { createScoreboard } from "./scoreboard.js";
import { validateMultiplayerSchedule } from "./schedule.js";

export function createMultiplayerSession({ schedule, durationSeconds }) {
  const validation = validateMultiplayerSchedule(schedule);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  return {
    schemaVersion: MULTIPLAYER_SESSION_SCHEMA,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
    durationSeconds: Number(durationSeconds) || 60,
    schedule: clone(schedule),
    nextTurnIndex: 0,
    scoreboard: createScoreboard(schedule.players, schedule.modeIds),
    usedCardIdsByMode: Object.fromEntries(schedule.modeIds.map(modeId => [modeId, []]))
  };
}

export function validMultiplayerSession(session) {
  if (Number(session?.schemaVersion) !== MULTIPLAYER_SESSION_SCHEMA) return false;
  if (session.status !== "active") return false;
  if (!Number.isInteger(session.nextTurnIndex) || session.nextTurnIndex < 0) return false;
  if (!session.scoreboard || !session.usedCardIdsByMode) return false;
  const validation = validateMultiplayerSchedule(session.schedule);
  return validation.valid && session.nextTurnIndex <= session.schedule.turns.length;
}

export function saveMultiplayerSession(session) {
  if (!session) return;
  session.updatedAt = new Date().toISOString();
  writeJsonStorage(MULTIPLAYER_SESSION_KEY, session);
}

export function loadMultiplayerSession() {
  const session = readJsonStorage(MULTIPLAYER_SESSION_KEY, null);
  return validMultiplayerSession(session) ? session : null;
}

export function clearMultiplayerSession() {
  localStorage.removeItem(MULTIPLAYER_SESSION_KEY);
}
