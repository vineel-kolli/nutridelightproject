// ============================================================
// Static game configuration
//
// Business configuration such as totalGames and prizes will
// eventually come from the backend/admin system.
//
// These values are technical gameplay timings.
// ============================================================

export const GAME_CONFIG = {
  /**
   * Frontend fallback only.
   *
   * Production source of truth will be backend GameConfig.
   */
  DEFAULT_TOTAL_GAMES: 5,

  // Countdown timing
  COUNTDOWN_STEP_MS: 900,

  // How long GO remains visible
  GO_HOLD_MS: 400,

  // Gesture capture window
  CAPTURE_WINDOW_MS: 2000,

  // Move reveal duration
  REVEAL_DURATION_MS: 800,

  // Game result duration
  GAME_RESULT_HOLD_MS: 1800,

  // Draw result duration
  DRAW_RESULT_HOLD_MS: 1100,

  // Match intro duration
  MATCH_INTRO_MS: 1500,

  // Screen transition animation
  SCREEN_TRANSITION_MS: 300,

  // Delay before Buddy voice
  BUDDY_VOICE_DELAY_MS: 200,
} as const;

export type GameConfig = typeof GAME_CONFIG;