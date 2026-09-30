import React from 'react';
import type {
  GameOutcome,
  RpsMove,
} from '../game/gameTypes';

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
      <div className="round-result-container">

        <div className="round-result-moves">

          <div className="result-move-card card-player">
            <span className="result-move-header">YOU</span>

            <div className="result-move-visual">
              <span aria-hidden="true">
                {playerMove === 'rock' && '✊'}
                {playerMove === 'paper' && '✋'}
                {playerMove === 'scissors' && '✌️'}
              </span>
            </div>

            <span className="result-move-label">
              {MOVE_LABEL[playerMove]}
            </span>
          </div>

          <div className="result-vs-circle" aria-hidden="true">
            VS
          </div>

          <div className="result-move-card card-buddy">
            <span className="result-move-header">BUDDY</span>

            <div className="result-move-visual">
              <span aria-hidden="true">
                {buddyMove === 'rock' && '✊'}
                {buddyMove === 'paper' && '✋'}
                {buddyMove === 'scissors' && '✌️'}
              </span>
            </div>

            <span className="result-move-label">
              {MOVE_LABEL[buddyMove]}
            </span>
          </div>

        </div>

        <div className="round-result-banner">
          <span>{resultText}</span>
        </div>

      </div>
    </div>
  );
};