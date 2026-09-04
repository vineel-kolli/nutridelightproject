import {
  determineWinner,
} from './gameEngine';

import {
  GAME_CONFIG,
} from './gameConfig';

import type {
  GameAction,
  GameOutcome,
  GameState,
} from './gameTypes';

// ============================================================
// Initial state
// ============================================================

export const INITIAL_STATE: GameState = {
  phase: 'idle',

  totalGames: GAME_CONFIG.DEFAULT_TOTAL_GAMES,
  currentGame: 1,

  playerScore: 0,
  buddyScore: 0,

  countdownValue: null,

  buddyMove: null,
  playerMove: null,

  gameOutcome: null,

  matchResult: null,

  errorMessage: null,
  detectionPrompt: null,
};

// ============================================================
// Game reducer
// ============================================================

export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    case 'START_CAMERA':
      return {
        ...state,
        phase: 'cameraSetup',
        errorMessage: null,
      };

    case 'CAMERA_READY':
      return {
        ...state,
        phase: 'waitingForStart',
      };

    case 'CAMERA_ERROR':
      return {
        ...state,
        phase: 'error',
        errorMessage: action.payload,
      };

    // --------------------------------------------------------
    // MATCH START
    // --------------------------------------------------------

    case 'START_MATCH':
      return {
        ...state,
        phase: 'matchIntro',
      };

    case 'MATCH_INTRO_DONE': {
      const totalGames =
        action.payload?.totalGames ??
        GAME_CONFIG.DEFAULT_TOTAL_GAMES;

      if (!Number.isInteger(totalGames) || totalGames < 1) {
        return {
          ...state,
          phase: 'error',
          errorMessage: 'Invalid number of games.',
        };
      }

      return {
        ...state,

        phase: 'gameReady',

        totalGames,
        currentGame: 1,

        playerScore: 0,
        buddyScore: 0,

        countdownValue: null,

        buddyMove: null,
        playerMove: null,

        gameOutcome: null,
        matchResult: null,

        errorMessage: null,
        detectionPrompt: null,
      };
    }

    // --------------------------------------------------------
    // GAME START
    // --------------------------------------------------------

    case 'GAME_START':
      return {
        ...state,

        phase: 'countdown',

        countdownValue: 1,

        buddyMove: null,
        playerMove: null,

        gameOutcome: null,

        detectionPrompt: null,
      };

    // --------------------------------------------------------
    // COUNTDOWN
    // --------------------------------------------------------

    case 'COUNTDOWN_TICK':
      return {
        ...state,
        countdownValue: action.payload,
      };

    // --------------------------------------------------------
    // CAPTURE
    // --------------------------------------------------------

    case 'BEGIN_CAPTURE':
      return {
        ...state,

        phase: 'capture',

        buddyMove: action.payload.buddyMove,

        countdownValue: null,

        detectionPrompt: 'Show your move!',
      };

    // --------------------------------------------------------
    // PLAYER MOVE CAPTURED
    // --------------------------------------------------------

    case 'PLAYER_CAPTURED': {
      const playerMove =
        action.payload.playerMove;

      if (state.buddyMove === null) {
        return {
          ...state,
          phase: 'error',
          errorMessage:
            'Buddy move is missing.',
        };
      }

      const outcome: GameOutcome =
        determineWinner(
          playerMove,
          state.buddyMove
        );

      // ------------------------------------------------------
      // DRAW
      //
      // A draw is NOT a counted game.
      //
      // No score increment.
      // No currentGame increment.
      // Match cannot finish.
      // ------------------------------------------------------

      if (outcome === 'draw') {
        return {
          ...state,

          phase: 'reveal',

          playerMove,

          gameOutcome: 'draw',

          detectionPrompt: null,
        };
      }

      // ------------------------------------------------------
      // NON-DRAW
      //
      // This game is now counted.
      // ------------------------------------------------------

      return {
        ...state,

        phase: 'reveal',

        playerMove,

        gameOutcome: outcome,

        playerScore:
          outcome === 'playerWin'
            ? state.playerScore + 1
            : state.playerScore,

        buddyScore:
          outcome === 'buddyWin'
            ? state.buddyScore + 1
            : state.buddyScore,

        detectionPrompt: null,
      };
    }

    // --------------------------------------------------------
    // NO GESTURE
    // --------------------------------------------------------

    case 'NO_GESTURE_DETECTED':
      return {
        ...state,

        phase: 'gameReady',

        buddyMove: null,
        playerMove: null,

        gameOutcome: null,

        detectionPrompt:
          "Move not detected. Let's try again!",
      };

    // --------------------------------------------------------
    // REVEAL
    // --------------------------------------------------------

    case 'REVEAL_DONE':
      return {
        ...state,
        phase: 'gameResult',
      };

    // --------------------------------------------------------
    // GAME RESULT
    // --------------------------------------------------------

    case 'GAME_RESULT_DONE': {

      // ------------------------------------------------------
      // DRAW
      //
      // Retry the same counted game.
      // ------------------------------------------------------

      if (state.gameOutcome === 'draw') {
        return {
          ...state,

          phase: 'gameReady',

          buddyMove: null,
          playerMove: null,

          gameOutcome: null,

          detectionPrompt: null,
        };
      }

      // ------------------------------------------------------
      // Defensive state validation
      // ------------------------------------------------------

      if (state.gameOutcome === null) {
        return {
          ...state,

          phase: 'error',

          errorMessage:
            'Game result is missing.',
        };
      }

      // ------------------------------------------------------
      // HAS THE REQUIRED NUMBER OF GAMES BEEN COMPLETED?
      //
      // IMPORTANT:
      //
      // We check currentGame.
      //
      // We DO NOT check playerScore.
      //
      // Therefore:
      //
      // 3-0 after Game 3
      //
      // does NOT finish a 5-game match.
      // ------------------------------------------------------

      const allGamesCompleted =
        state.currentGame >= state.totalGames;

      if (allGamesCompleted) {
        if (state.playerScore === state.buddyScore) {
          return {
            ...state,
            phase: 'error',
            errorMessage:
              'Match ended in a tie. Total games must be odd.',
          };
        }

        return {
          ...state,

          phase: 'matchResult',

          matchResult:
            state.playerScore > state.buddyScore
              ? 'playerWin'
              : 'buddyWin',
        };
      }

      // ------------------------------------------------------
      // MORE GAMES REMAIN
      // ------------------------------------------------------

      return {
        ...state,

        phase: 'gameReady',

        currentGame:
          state.currentGame + 1,

        buddyMove: null,
        playerMove: null,

        gameOutcome: null,

        detectionPrompt: null,
      };
    }

    // --------------------------------------------------------
    // PLAY AGAIN
    // --------------------------------------------------------

    case 'PLAY_AGAIN':
      return {
        ...INITIAL_STATE,
        phase: 'waitingForStart',
      };

    // --------------------------------------------------------
    // DETECTION PROMPT
    // --------------------------------------------------------

    case 'SET_DETECTION_PROMPT':
      return {
        ...state,
        detectionPrompt: action.payload,
      };

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    case 'DISMISS_ERROR':
      return {
        ...state,

        phase: 'idle',

        errorMessage: null,
      };

    default:
      return state;
  }
}