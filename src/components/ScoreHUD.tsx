import React, { useEffect, useRef } from 'react';

interface ScoreHUDProps {
  playerScore: number;
  buddyScore: number;
  currentGame: number;
  totalGames: number;
}

export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  playerScore,
  buddyScore,
  currentGame,
  totalGames,
}) => {
  const playerScoreRef = useRef(playerScore);
  const buddyScoreRef = useRef(buddyScore);

  const playerElRef =
    useRef<HTMLSpanElement | null>(null);

  const buddyElRef =
    useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (
      playerScore !== playerScoreRef.current &&
      playerElRef.current
    ) {
      playerElRef.current.classList.remove(
        'animate-score-pop'
      );

      void playerElRef.current.offsetWidth;

      playerElRef.current.classList.add(
        'animate-score-pop'
      );
    }

    playerScoreRef.current = playerScore;
  }, [playerScore]);

  useEffect(() => {
    if (
      buddyScore !== buddyScoreRef.current &&
      buddyElRef.current
    ) {
      buddyElRef.current.classList.remove(
        'animate-score-pop'
      );

      void buddyElRef.current.offsetWidth;

      buddyElRef.current.classList.add(
        'animate-score-pop'
      );
    }

    buddyScoreRef.current = buddyScore;
  }, [buddyScore]);

  const dots = Array.from({
    length: totalGames,
  });

  return (
    <div className="score-card-container">
      <div className="score-card">

        {/* YOU */}
        <div className="score-side score-you">
          <span className="score-label">
            YOU
          </span>

          <span
            ref={playerElRef}
            className="score-value"
          >
            {playerScore}
          </span>

          <div className="score-dots">
            {dots.map((_, i) => (
              <div
                key={i}
                className="score-dot"
                style={{
                  background:
                    i < playerScore
                      ? 'var(--brand-green)'
                      : '#e5f3e7',
                }}
              />
            ))}
          </div>
        </div>

        {/* VS */}
        <div className="score-vs-circle">
          <span>VS</span>
        </div>

        {/* BUDDY */}
        <div className="score-side score-buddy">
          <span className="score-label">
            BUDDY
          </span>

          <span
            ref={buddyElRef}
            className="score-value"
          >
            {buddyScore}
          </span>

          <div className="score-dots">
            {dots.map((_, i) => (
              <div
                key={i}
                className="score-dot"
                style={{
                  background:
                    i < buddyScore
                      ? 'var(--brand-orange)'
                      : '#fdeece',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current game */}
      <div className="score-round-pill">
        GAME {currentGame} OF {totalGames}
      </div>
    </div>
  );
};