import React, { useState } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { GameScreen } from '../screens/GameScreen';
import { MatchResultScreen } from '../screens/MatchResultScreen';
import { GestureLab } from '../screens/GestureLab';
import {
  completeMatch,
  type MatchCompletionResponse,
} from '../api/matchApi';

type AppScreen =
  | 'welcome'
  | 'game'
  | 'playerWin'
  | 'buddyWin'
  | 'lab';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(() => {
    if (
      window.location.pathname === '/lab' ||
      new URLSearchParams(window.location.search).get('lab') === 'true'
    ) {
      return 'lab';
    }

    return 'welcome';
  });

  const [matchSummary, setMatchSummary] =
    useState<MatchCompletionResponse | null>(null);

  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);

  const handleMatchComplete = async (
    _result: 'playerWin' | 'buddyWin',
    playerScore: number,
    buddyScore: number
  ) => {
    if (isCompletingMatch) {
      return;
    }

    setIsCompletingMatch(true);
    setCompletionError(null);

    try {
      const summary = await completeMatch({
        player_wins: playerScore,
        buddy_wins: buddyScore,
      });

      setMatchSummary(summary);

      setScreen(
        summary.winner === 'player'
          ? 'playerWin'
          : 'buddyWin'
      );
    } catch (error) {
      console.error('Failed to complete match:', error);

      setCompletionError(
        error instanceof Error
          ? error.message
          : 'Unable to complete the match.'
      );
    } finally {
      setIsCompletingMatch(false);
    }
  };

  const handlePlayAgain = () => {
    setCompletionError(null);
    setMatchSummary(null);
    setScreen('game');
  };

  const handleExit = () => {
    setCompletionError(null);
    setMatchSummary(null);
    setScreen('welcome');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#111',
      }}
    >
      {screen === 'welcome' && (
        <WelcomeScreen onStart={() => setScreen('game')} />
      )}

      {screen === 'game' && (
        <GameScreen
          onMatchComplete={handleMatchComplete}
          onBack={() => setScreen('welcome')}
        />
      )}

      {(screen === 'playerWin' || screen === 'buddyWin') &&
        matchSummary && (
          <MatchResultScreen
            result={
              matchSummary.winner === 'player'
                ? 'playerWin'
                : 'buddyWin'
            }
            playerScore={matchSummary.player_wins}
            buddyScore={matchSummary.buddy_wins}
            rewardEligible={matchSummary.reward_eligible}
            prizeName={matchSummary.prize_name}
            prizeImageUrl={matchSummary.prize_image_url}
            isLoading={isCompletingMatch}
            errorMessage={completionError}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        )}

      {screen === 'game' && isCompletingMatch && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.55)',
          }}
        >
          <div
            style={{
              padding: '24px 32px',
              borderRadius: '16px',
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <strong>Finishing your game…</strong>
          </div>
        </div>
      )}

      {screen === 'game' && completionError && !isCompletingMatch && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0, 0, 0, 0.55)',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              margin: '20px',
              padding: '28px',
              borderRadius: '16px',
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <h2>Unable to finish the game</h2>

            <p>{completionError}</p>

            <button
              type="button"
              onClick={() => {
                setCompletionError(null);
                setScreen('game');
              }}
            >
              TRY AGAIN
            </button>

            <button
              type="button"
              onClick={handleExit}
            >
              EXIT GAME
            </button>
          </div>
        </div>
      )}

      {screen === 'lab' && (
        <GestureLab onExit={() => setScreen('welcome')} />
      )}
    </div>
  );
};