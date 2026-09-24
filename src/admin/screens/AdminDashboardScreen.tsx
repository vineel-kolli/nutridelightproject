import React, { useEffect, useState } from 'react';

import {
  getGameConfig,
  logoutAdmin,
  updateGameConfig,
  type AdminUser,
  type GameConfig,
} from '../api/adminApi';

import { PrizeRulesCard } from '../components/PrizeRulesCard';

interface AdminDashboardScreenProps {
  admin: AdminUser;
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<
  AdminDashboardScreenProps
> = ({ admin, onLogout }) => {
  const [gameConfig, setGameConfig] =
    useState<GameConfig | null>(null);

  const [totalGames, setTotalGames] = useState('');

  const [isLoadingConfig, setIsLoadingConfig] =
    useState(true);

  const [isSavingConfig, setIsSavingConfig] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      setIsLoadingConfig(true);
      setErrorMessage(null);

      try {
        const config = await getGameConfig();

        if (cancelled) {
          return;
        }

        setGameConfig(config);
        setTotalGames(String(config.total_games));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load game configuration.',
        );
      } finally {
        if (!cancelled) {
          setIsLoadingConfig(false);
        }
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  

  const handleSaveConfig = async () => {
    if (isSavingConfig) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedTotalGames = Number(totalGames);

    if (!Number.isInteger(parsedTotalGames)) {
      setErrorMessage('Total games must be a whole number.');
      return;
    }

    if (parsedTotalGames < 1 || parsedTotalGames > 99) {
      setErrorMessage(
        'Total games must be between 1 and 99.',
      );
      return;
    }

    if (parsedTotalGames % 2 === 0) {
      setErrorMessage(
        'Total games must be an odd number.',
      );
      return;
    }

    setIsSavingConfig(true);

    try {
      const updatedConfig =
        await updateGameConfig(parsedTotalGames);

      setGameConfig(updatedConfig);
      setTotalGames(String(updatedConfig.total_games));

      setSuccessMessage(
        'Game configuration saved successfully.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save game configuration.',
      );
    } finally {
      setIsSavingConfig(false);
    }
  };



  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutAdmin();
      onLogout();
    } catch (error) {
      console.error('Admin logout failed:', error);

      setErrorMessage(
        'Unable to sign out. Please try again.',
      );

      setIsLoggingOut(false);
    }
  };


  const adminInitial =
    admin.username.charAt(0).toUpperCase();

  return (
  <main className="admin-page">
    <div className="admin-shell">

      {/* Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <div
            className="admin-brand-mark"
            aria-hidden="true"
          >
            ND
          </div>

          <div className="admin-brand-text">
            <h1>Nutri Delight</h1>
            <p>Admin</p>
          </div>
        </div>

        <div className="admin-account">
          <div className="admin-user">
            <div
              className="admin-avatar"
              aria-hidden="true"
            >
              {adminInitial}
            </div>

            <div className="admin-user-info">
              <span className="admin-user-name">
                {admin.username}
              </span>

              <span className="admin-user-role">
                Administrator
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut
              ? 'Signing out…'
              : 'Sign out'}
          </button>
        </div>
      </header>

      {/* Messages */}
      {errorMessage && (
        <div
          className="admin-message admin-message-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="admin-message admin-message-success"
          role="status"
        >
          ✓ {successMessage}
        </div>
      )}

      {/* Loading */}
      {isLoadingConfig && (
        <div className="admin-loading">
          Loading configuration…
        </div>
      )}

      {/* Main controls */}
      {!isLoadingConfig && gameConfig && (
        <div className="admin-content">

          {/* Game configuration */}
          <section className="admin-control-section">
            <div className="admin-control-header">
              <div>
                <span className="admin-eyebrow">
                  GAME
                </span>

                <h2>
                  Games per match
                </h2>
              </div>

              <span className="admin-status">
                <span className="admin-status-dot" />
                Active
              </span>
            </div>

            <div className="admin-game-control">
              <button
                type="button"
                className="admin-stepper-button"
                onClick={() => {
                  const current = Number(totalGames);

                  const next = Math.max(
                    1,
                    current - 2,
                  );

                  setTotalGames(String(next));
                }}
                disabled={
                  isSavingConfig ||
                  Number(totalGames) <= 1
                }
                aria-label="Decrease games"
              >
                −
              </button>

              <div className="admin-game-value">
                <strong>
                  {totalGames ||
                    gameConfig.total_games}
                </strong>

                <span>games</span>
              </div>

              <button
                type="button"
                className="admin-stepper-button"
                onClick={() => {
                  const current = Number(totalGames);

                  const next = Math.min(
                    99,
                    current + 2,
                  );

                  setTotalGames(String(next));
                }}
                disabled={
                  isSavingConfig ||
                  Number(totalGames) >= 99
                }
                aria-label="Increase games"
              >
                +
              </button>

              {Number(totalGames) !==
                gameConfig.total_games && (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig
                    ? 'Saving…'
                    : 'Save'}
                </button>
              )}
            </div>
          </section>

          {/* Rewards */}
          <section className="admin-control-section admin-rewards-section">
            <PrizeRulesCard
              gameConfigId={gameConfig.id}
              totalGames={gameConfig.total_games}
              prizes={gameConfig.prizes}
              onPrizesChanged={(prizes) => {
                setGameConfig((current) =>
                  current
                    ? {
                        ...current,
                        prizes,
                      }
                    : current,
                );
              }}
            />
          </section>

        </div>
      )}
    </div>
  </main>
);
};