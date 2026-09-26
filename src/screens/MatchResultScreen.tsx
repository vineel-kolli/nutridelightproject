import React from 'react';
import { Confetti } from '../components/Confetti';

export type MatchResult = 'playerWin' | 'buddyWin' | 'draw';

interface MatchResultScreenProps {
  result: MatchResult;
  playerScore: number;
  buddyScore: number;
  rewardEligible: boolean;
  prizeName: string | null;
  prizeImageUrl: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

const RESULT_META: Record<
  MatchResult,
  {
    title: string;
    image: string;
    alt: string;
    color: string;
    message: string;
    accent: string;
    background: string;
    particleCount: number;
  }
> = {
  buddyWin: {
    title: 'BUDDY WINS!',
    image: '/avatar/buddy_win.png',
    alt: 'Buddy celebrating after winning the match',
    color: 'var(--brand-orange)',
    message: 'Buddy takes the match. Ready for a rematch?',
    accent: 'rgba(232, 123, 26, 0.16)',
    background: 'linear-gradient(135deg, #fff8ec 0%, #ffe6c6 100%)',
    particleCount: 28,
  },

  playerWin: {
    title: 'YOU WIN!',
    image: '/avatar/buddy_loss.png',
    alt: 'Buddy reacting after losing the match',
    color: 'var(--brand-green)',
    message: 'Great match! Buddy wants a rematch.',
    accent: 'rgba(45, 138, 62, 0.16)',
    background: 'linear-gradient(135deg, #fffdf7 0%, #edf8ee 100%)',
    particleCount: 36,
  },

  draw: {
    title: 'MATCH DRAW!',
    image: '/avatar/buddy_idle.png',
    alt: 'Buddy with a thoughtful reaction after a draw',
    color: '#2f3a3d',
    message: 'That was close. One more match?',
    accent: 'rgba(47, 58, 61, 0.14)',
    background: 'linear-gradient(135deg, #fff9ef 0%, #f5efe7 100%)',
    particleCount: 0,
  },
};

export const MatchResultScreen: React.FC<MatchResultScreenProps> = ({
  result,
  playerScore,
  buddyScore,
  rewardEligible,
  prizeName,
  prizeImageUrl,
  isLoading,
  errorMessage,
  onPlayAgain,
  onExit,
}) => {
  const meta = RESULT_META[result];

  const announcement =
    result === 'draw'
      ? `Match complete. It is a draw at ${buddyScore} to ${playerScore}.`
      : result === 'buddyWin'
        ? `Match complete. Buddy wins ${buddyScore} to ${playerScore}.`
        : `Match complete. You win ${playerScore} to ${buddyScore}.`;

  return (
    <div
      className="screen-container result-screen"
      style={{ background: meta.background }}
      role="status"
      aria-live="polite"
    >
      <div
        className="result-speckle result-speckle-left"
        style={{ background: meta.accent }}
      />

      <div
        className="result-speckle result-speckle-right"
        style={{ background: meta.accent }}
      />

      {meta.particleCount > 0 && (
        <Confetti count={meta.particleCount} />
      )}

      <main className="result-stage">
        <p className="sr-only">{announcement}</p>

        <div className="result-buddy-wrap">
          <div className="result-buddy-shadow" />

          <img
            src={meta.image}
            alt={meta.alt}
            className="result-buddy"
            draggable={false}
            style={{
              height: 'clamp(300px, 38vh, 460px)',
            }}
          />
        </div>

        <h1
          className="result-heading"
          style={{ color: meta.color }}
        >
          {meta.title}
        </h1>

        <div
          className="result-score-card"
          style={{ borderColor: meta.accent }}
        >
          <div className="result-score-label">
            FINAL SCORE
          </div>

          <div className="result-score-grid">
            {/* YOU — always left */}
            <div
              className={`result-score-column result-score-player ${
                result === 'playerWin' ? 'is-match-winner' : ''
              }`}
            >
              <span className="result-score-tag">YOU</span>

              <span className="result-score-number">
                {playerScore}
              </span>
            </div>

            {/* VS — always center */}
            <div className="result-score-divider">
              VS
            </div>

            {/* BUDDY — always right */}
            <div
              className={`result-score-column result-score-buddy ${
                result === 'buddyWin' ? 'is-match-winner' : ''
              }`}
            >
              <span className="result-score-tag">BUDDY</span>

              <span className="result-score-number">
                {buddyScore}
              </span>
            </div>
          </div>
        </div>

        {rewardEligible && prizeName ? (
          <section
            className="result-reward-card"
            aria-label="Reward"
          >
            <div className="result-reward-label">
              YOUR REWARD
            </div>

            {prizeImageUrl && (
              <img
                src={prizeImageUrl}
                alt=""
                className="result-reward-image"
                draggable={false}
              />
            )}

            <div className="result-reward-name">
              {prizeName}
            </div>
          </section>
        ) : (
          <p className="result-message">
            {meta.message}
          </p>
        )}

        <button
          type="button"
          className="result-primary-btn"
          onClick={onPlayAgain}
          disabled={isLoading}
          id={
            result === 'playerWin'
              ? 'player-win-play-again-btn'
              : result === 'buddyWin'
                ? 'buddy-win-play-again-btn'
                : 'draw-play-again-btn'
          }
        >
          PLAY AGAIN
        </button>

        <button
          type="button"
          className="result-secondary-btn"
          onClick={onExit}
          disabled={isLoading}
        >
          EXIT GAME
        </button>

        {errorMessage && (
          <p
            role="alert"
            className="result-error"
          >
            {errorMessage}
          </p>
        )}
      </main>
    </div>
  );
};