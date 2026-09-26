import type { AvatarState } from './avatarTypes';
import type {
  GameOutcome,
  GamePhase,
  RpsMove,
} from '../game/gameTypes';

export interface BuddyBehavior {
  state: AvatarState;
  message: string;
}

interface GetBuddyBehaviorParams {
  phase: GamePhase;
  buddyMove: RpsMove | null;
  gameOutcome: GameOutcome | null;
  matchResult: 'playerWin' | 'buddyWin' | null;
  detectionPrompt: string | null;
}

export function getBuddyBehavior({
  phase,
  buddyMove,
  gameOutcome,
  matchResult,
  detectionPrompt,
}: GetBuddyBehaviorParams): BuddyBehavior {
  // Final match result
  if (matchResult === 'playerWin') {
    return {
      state: 'matchWin',
      message: 'You got me! Great game!',
    };
  }

  if (matchResult === 'buddyWin') {
    return {
      state: 'matchLoss',
      message: 'I win! Better luck next time!',
    };
  }

  // Reveal / game result — dedicated round result overlay takes over, no speech bubble
  if (phase === 'reveal' || phase === 'gameResult') {
    const avatarState: AvatarState =
      buddyMove ??
      (gameOutcome === 'playerWin'
        ? 'roundWin'
        : gameOutcome === 'buddyWin'
          ? 'roundLoss'
          : 'draw');

    return {
      state: avatarState,
      message: '', // Speech bubble removed during round result
    };
  }

  // Countdown
  if (phase === 'countdown') {
    return {
      state: 'countdown',
      message: 'Rock... Paper... Scissors... Shoot!',
    };
  }

  // Player gesture capture
  if (phase === 'capture') {
    if (detectionPrompt?.includes('Hold') || detectionPrompt?.includes('steady')) {
      return {
        state: 'listening',
        message: 'Hold it steady!',
      };
    }

    return {
      state: 'listening',
      message: 'Show me your move!',
    };
  }

  // Waiting to start — minimal or no speech bubble
  if (phase === 'waitingForStart') {
    return {
      state: 'idle',
      message: '',
    };
  }

  // Match introduction
  if (phase === 'matchIntro') {
    return {
      state: 'ready',
      message: '',
    };
  }

  // Game ready
  if (phase === 'gameReady') {
    return {
      state: 'ready',
      message: 'Ready when you are!',
    };
  }

  // Default
  return {
    state: 'idle',
    message: '',
  };
}