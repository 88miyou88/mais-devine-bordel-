export const state = {
  selectedSeconds: 60,
  durationMs: 60000,
  remainingMs: 60000,
  deadline: 0,
  rafId: 0,
  countdownTimer: 0,
  running: false,
  paused: false,
  pauseReason: null,
  flipped: false,
  queue: [],
  currentCard: null,
  history: [],
  valid: 0,
  passed: 0,
  score: 0,
  mixedDrawing: null,
  roundContext: null,
  multiplayer: null,
  pointer: null,
  wakeLock: null,
  installPrompt: null,
  lastError: "Aucune",
  activeManageModeId: "lyrics",
  activeModeDialogId: null,
  settings: {
    selectedModeIds: ["lyrics", "mime", "words"],
    vibrationEnabled: true,
    playType: "free",
    globalDifficultyIds: ["easy", "medium", "hard"],
    multiplayer: {
      players: [
        { id: "player-1", name: "Joueur 1" },
        { id: "player-2", name: "Joueur 2" }
      ],
      cycles: 1,
      flowType: "continuous",
      orderType: "balanced"
    },
    lastLibraryCheckAt: "",
    modeOptions: {
      words: { showForbiddenWords: true },
      draw: {
        attemptCount: 3,
        durations: { easy: 30, medium: 45, hard: 60 },
        soundEnabled: true,
        mixedCount: 2,
        arrivalSoundEnabled: true
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
