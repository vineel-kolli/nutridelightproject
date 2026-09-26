import React from 'react';
import type {
  GameOutcome,
  RpsMove,
} from '../game/gameTypes';

const MOVE_EMOJI: Record<RpsMove, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const MOVE_LABEL: Record<RpsMove, string> = {
  rock: 'ROCK',
  paper: 'PAPER',
  scissors: 'SCISSORS',
};

interface MoveRevealProps {
  playerMove: RpsMove | null;
  buddyMove: RpsMove | null;
  outcome: GameOutcome | null;
  visible: boolean;
}

export const MoveReveal: React.FC<MoveRevealProps> = ({
  playerMove,
  buddyMove,
  outcome,
  visible,
}) => {
  if (
    !visible ||
    !playerMove ||
    !buddyMove ||
    !outcome
  ) {
    return null;
  }

  const resultText =
    outcome === 'playerWin'
      ? 'YOU WIN THIS GAME!'
      : outcome === 'buddyWin'
        ? 'BUDDY WINS THIS GAME!'
        : "IT'S A DRAW!";

  const outcomeClass =
    outcome === 'playerWin'
      ? 'outcome-player-win'
      : outcome === 'buddyWin'
        ? 'outcome-buddy-win'
        : 'outcome-draw';

  return (
    <div
      className={`round-result-overlay ${outcomeClass}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="round-result-container animate-bounce-in">
        {/* SUBTLE BRAND STAMP */}
        <div className="round-result-brand">
          <img
            src="/favicon.png"
            alt=""
            className="round-result-brand-icon"
            aria-hidden="true"
          />
          <span>NUTRI DELIGHT</span>
        </div>

        {/* MOVE SHOWDOWN */}
        <div className="round-result-moves">
          {/* PLAYER MOVE CARD */}
          <div className="result-move-card card-player animate-slide-in-left">
            <span className="result-move-header">YOU</span>
            <span className="result-move-emoji" aria-hidden="true">
              {MOVE_EMOJI[playerMove]}
            </span>
            <span className="result-move-name">
              {MOVE_LABEL[playerMove]}
            </span>
          </div>

          {/* VS CIRCLE */}
          <div className="result-vs-circle" aria-hidden="true">
            <span>VS</span>
          </div>

          {/* BUDDY MOVE CARD */}
          <div className="result-move-card card-buddy animate-slide-in-right">
            <span className="result-move-header">BUDDY</span>
            <span className="result-move-emoji" aria-hidden="true">
              {MOVE_EMOJI[buddyMove]}
            </span>
            <span className="result-move-name">
              {MOVE_LABEL[buddyMove]}
            </span>
          </div>
        </div>

        {/* OUTCOME BANNER */}
        <div className="round-result-banner animate-fade-in">
          <span>{resultText}</span>
        </div>
      </div>
    </div>
  );
};