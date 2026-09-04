// ============================================================
// Core RPS game types
// ============================================================

export type RpsMove = 'rock' | 'paper' | 'scissors';

export type GameOutcome =
  | 'playerWin'
  | 'buddyWin'
  | 'draw';

export type GamePhase =
  | 'idle'
  | 'cameraSetup'
  | 'cameraReady'
  | 'waitingForStart'
  | 'matchIntro'
  | 'gameReady'
  | 'countdown'
  | 'capture'
  | 'reveal'
  | 'gameResult'
  | 'matchResult'
  | 'reward'
  | 'error';

export type MatchResult =
  | 'playerWin'
  | 'buddyWin';

export interface GameState {
  phase: GamePhase;

  /**
   * Number of counted games required for this match.
   */
  totalGames: number;

  /**
   * Current counted game.
   * Starts at 1.
   *
   * A draw does not increment this value.
   */
  currentGame: number;

  /**
   * Final match scores.
   *
   * These increase only after a non-draw game.
   */
  playerScore: number;
  buddyScore: number;

  /**
   * Countdown UI state.
   */
  countdownValue: number | 'GO' | null;

  /**
   * Current game's moves.
   */
  buddyMove: RpsMove | null;
  playerMove: RpsMove | null;

  /**
   * Current game's outcome.
   */
  gameOutcome: GameOutcome | null;

  /**
   * Final result of the entire match.
   *
   * This is only set after all counted games are complete.
   */
  matchResult: MatchResult | null;

  errorMessage: string | null;
  detectionPrompt: string | null;
}

// ============================================================
// Action types
// ============================================================

export type GameAction =
  | { type: 'START_CAMERA' }

  | { type: 'CAMERA_READY' }

  | {
      type: 'CAMERA_ERROR';
      payload: string;
    }

  | { type: 'START_MATCH' }

  | {
      type: 'MATCH_INTRO_DONE';
      payload?: {
        totalGames?: number;
      };
    }

  | { type: 'GAME_START' }

  | {
      type: 'COUNTDOWN_TICK';
      payload: number | 'GO';
    }

  | {
      type: 'BEGIN_CAPTURE';
      payload: {
        buddyMove: RpsMove;
      };
    }

  | {
      type: 'PLAYER_CAPTURED';
      payload: {
        playerMove: RpsMove;
      };
    }

  | { type: 'NO_GESTURE_DETECTED' }

  | { type: 'REVEAL_DONE' }

  | { type: 'GAME_RESULT_DONE' }

  | { type: 'PLAY_AGAIN' }

  | {
      type: 'SET_DETECTION_PROMPT';
      payload: string | null;
    }

  | { type: 'DISMISS_ERROR' };