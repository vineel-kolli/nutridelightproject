import React from 'react';
import type {
  GameOutcome,
  RpsMove,
} from '../game/gameTypes';

export function resolveBuddySpeechMessage(
  phase: string,
  buddyMove: RpsMove | null,
  gameOutcome: GameOutcome | null,
  gestureKind: string | null,
  detectionPrompt: string | null
): string {
  if (phase === 'waitingForStart') {
    return 'Ready when you are!';
  }

  if (phase === 'cameraSetup') {
    return 'Getting ready...';
  }

  if (phase === 'matchIntro') {
    return 'Let the games begin!';
  }

  if (phase === 'gameReady') {
    return 'Show me your move!';
  }

  if (phase === 'countdown') {
    return 'Here we go!';
  }

  if (phase === 'capture') {
    if (gestureKind === 'noHand') {
      return "I can't see your hand yet";
    }

    if (gestureKind === 'moving') {
      return 'Hold it steady!';
    }

    if (
      detectionPrompt?.includes(
        'Show your move'
      )
    ) {
      return 'Show me your move!';
    }

    return 'My turn is coming...';
  }

  if (
    phase === 'reveal' ||
    phase === 'gameResult'
  ) {
    if (buddyMove === 'rock') {
      return 'Rock!';
    }

    if (buddyMove === 'paper') {
      return 'Paper!';
    }

    if (buddyMove === 'scissors') {
      return 'Scissors!';
    }

    if (gameOutcome === 'playerWin') {
      return 'Nice move!';
    }

    if (gameOutcome === 'buddyWin') {
      return 'Yes! This game is mine!';
    }

    if (gameOutcome === 'draw') {
      return 'Same move! Again?';
    }
  }

  if (phase === 'matchResult') {
    return 'Good game!';
  }

  return 'Ready when you are!';
}

interface BuddySpeechBubbleProps {
  phase: string;
  buddyMove: RpsMove | null;
  gameOutcome: GameOutcome | null;
  gestureKind: string | null;
  detectionPrompt: string | null;
}

export const BuddySpeechBubble: React.FC<
  BuddySpeechBubbleProps
> = ({
  phase,
  buddyMove,
  gameOutcome,
  gestureKind,
  detectionPrompt,
}) => {
  const message =
    resolveBuddySpeechMessage(
      phase,
      buddyMove,
      gameOutcome,
      gestureKind,
      detectionPrompt
    );

  return (
    <div
      className="buddy-speech-bubble"
      aria-live="polite"
    >
      <span>{message}</span>
    </div>
  );
};