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

  const playerElRef = useRef<HTMLSpanElement | null>(null);
  const buddyElRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (playerScore !== playerScoreRef.current && playerElRef.current) {
      playerElRef.current.classList.remove('animate-score-pop');
      void playerElRef.current.offsetWidth;
      playerElRef.current.classList.add('animate-score-pop');
    }
    playerScoreRef.current = playerScore;
  }, [playerScore]);

  useEffect(() => {
    if (buddyScore !== buddyScoreRef.current && buddyElRef.current) {
      buddyElRef.current.classList.remove('animate-score-pop');
      void buddyElRef.current.offsetWidth;
      buddyElRef.current.classList.add('animate-score-pop');
    }
    buddyScoreRef.current = buddyScore;
  }, [buddyScore]);

  const dots = Array.from({ length: totalGames });

  return (
    <div
      className="score-card-container"
      role="region"
      aria-label={`Score: You ${playerScore}, Buddy ${buddyScore}. Game ${currentGame} of ${totalGames}`}
    >
      <div className="score-card">
        {/* PLAYER (YOU) SIDE */}
        <div className="score-side score-you">
          <span className="score-label">YOU</span>
          <span ref={playerElRef} className="score-value">
            {playerScore}
          </span>
        </div>

        {/* CENTER COLUMN: VS & SUBTLE MATCH PROGRESS DOTS */}
        <div className="score-center">
          <div className="score-vs-circle" aria-hidden="true">
            <span>VS</span>
          </div>

          <div
            className="score-dots"
            aria-label={`Game ${currentGame} of ${totalGames}`}
          >
            {dots.map((_, index) => {
              const isCurrent = index === currentGame - 1;
              const isPast = index < currentGame - 1;
              return (
                <span
                  key={index}
                  className={`score-dot ${
                    isCurrent ? 'is-current' : isPast ? 'is-completed' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* BUDDY SIDE */}
        <div className="score-side score-buddy">
          <span className="score-label">BUDDY</span>
          <span ref={buddyElRef} className="score-value">
            {buddyScore}
          </span>
        </div>
      </div>

      {/* GAME ROUND PILL OVERLAPPING BOTTOM EDGE */}
      <div className="score-round-pill">
        GAME {currentGame} OF {totalGames}
      </div>
    </div>
  );
};