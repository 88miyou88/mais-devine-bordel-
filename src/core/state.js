export const state = {
  selectedSeconds: 60,
  durationMs: 60000,
  remainingMs: 60000,
  deadline: 0,
  rafId: 0,
  countdownTimer: 0,
  running: false,
  paused: false,
  flipped: false,
  queue: [],
  currentCard: null,
  history: [],
  valid: 0,
  passed: 0,
  pointer: null,
  wakeLock: null,
  installPrompt: null,
  lastError: "Aucune",
  activeManageModeId: "lyrics",
  activeModeDialogId: null,
  settings: {
    selectedModeIds: ["lyrics", "mime", "words"],
    vibrationEnabled: true,
    lastLibraryCheckAt: "",
    modeOptions: {
      words: { showForbiddenWords: true },
      draw: {
        attemptCount: 3,
        durations: { easy: 30, medium: 45, hard: 60 },
        soundEnabled: true
      }
    }
  },
  modes: {},
  drawRound: null,
  drawPointer: null,
  drawAudioContext: null
};

export function modeState(modeId) {
  return state.modes[modeId];
}

export function recordError(error) {
  state.lastError = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}
