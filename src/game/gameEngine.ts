import type {
  GameOutcome,
  RpsMove,
} from './gameTypes';

// ============================================================
// Pure RPS game logic
// ============================================================

const WIN_MAP: Record<RpsMove, RpsMove> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

/**
 * Determines the outcome of ONE game.
 *
 * This function does not know:
 * - how many games are in a match
 * - the current score
 * - prizes
 * - UI
 *
 * It only determines the result of the two moves.
 */
export function determineWinner(
  playerMove: RpsMove,
  buddyMove: RpsMove
): GameOutcome {
  if (playerMove === buddyMove) {
    return 'draw';
  }

  if (WIN_MAP[playerMove] === buddyMove) {
    return 'playerWin';
  }

  return 'buddyWin';
}

const MOVES: RpsMove[] = [
  'rock',
  'paper',
  'scissors',
];

/**
 * Generate Buddy's move.
 *
 * This is intentionally called before the capture window opens.
 */
export function generateBuddyMove(): RpsMove {
  return MOVES[
    Math.floor(Math.random() * MOVES.length)
  ];
}