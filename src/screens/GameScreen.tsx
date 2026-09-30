import React, { useReducer, useEffect, useRef, useCallback, useState, } from 'react';
import { gameReducer, INITIAL_STATE } from '../game/gameReducer';
import { generateBuddyMove } from '../game/gameEngine';
import { GAME_CONFIG } from '../game/gameConfig';
import { getGameConfig } from '../admin/api/adminApi';
import { useCamera } from '../camera/useCamera';
import { useGestureDetection } from '../gesture/useGestureDetection';
import { AudioManager } from '../audio/AudioManager';
import { CameraView } from '../components/CameraView';
import { HandLandmarkOverlay } from '../components/HandLandmarkOverlay';
import { ScoreHUD } from '../components/ScoreHUD';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { MoveReveal } from '../components/MoveReveal';
import { BuddyAvatar } from '../components/BuddyAvatar';
import { CameraError } from '../components/CameraError';
import { getBuddyBehavior } from '../avatar/buddyBehavior';
import type { RpsMove } from '../game/gameTypes';

interface GameScreenProps {
  onMatchComplete: (
    result: 'playerWin' | 'buddyWin',
    playerScore: number,
    buddyScore: number
  ) => void;
  onBack: () => void;
}

// ============================================================
// Map game phase → Buddy avatar state
// ============================================================



// ============================================================
// GameScreen — the camera-first game experience
// ============================================================

export const GameScreen: React.FC<GameScreenProps> = ({
  onMatchComplete,
  onBack,
}) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [configuredTotalGames, setConfiguredTotalGames] =
    useState<number | null>(null);

  const [isLoadingGameConfig, setIsLoadingGameConfig] =
    useState(true);
  const [gameConfigError, setGameConfigError] =
    useState<string | null>(null);
  const {
    videoRef,
    errorMessage: cameraError,
    startCamera,
    stopCamera,
  } = useCamera();

  const captureLockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraStartAttemptRef = useRef(false);
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Initialize camera flow ───
  useEffect(() => {
    AudioManager.preload();
    dispatch({ type: 'START_CAMERA' });

    return () => {
      clearTimeout(timerRef.current!);
      clearInterval(countdownTickRef.current!);
      stopCamera();
      cameraStartAttemptRef.current = false;
    };
  }, [stopCamera]);
  // ─── Load active game configuration ───
  useEffect(() => {
    let cancelled = false;

    const loadGameConfig = async () => {
      setIsLoadingGameConfig(true);
      setGameConfigError(null);

      try {
        const config = await getGameConfig();

        if (cancelled) {
          return;
        }

        setConfiguredTotalGames(config.total_games);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setGameConfigError(
          error instanceof Error
            ? error.message
            : 'Unable to load game configuration.',
        );
      } finally {
        if (!cancelled) {
          setIsLoadingGameConfig(false);
        }
      }
    };

    void loadGameConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'cameraSetup') {
      cameraStartAttemptRef.current = false;
      return;
    }

    if (cameraStartAttemptRef.current) return;
    cameraStartAttemptRef.current = true;

    let cancelled = false;

    startCamera()
      .then(() => {
        if (!cancelled) {
          dispatch({ type: 'CAMERA_READY' });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({ type: 'CAMERA_ERROR', payload: err?.message ?? 'Camera error' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state.phase, startCamera]);

  // ─── Gesture detection ───
  const handleStableGesture = useCallback(
    (move: RpsMove) => {
      if (
        state.phase !== 'capture' ||
        captureLockedRef.current
      ) {
        return;
      }

      captureLockedRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      dispatch({
        type: 'PLAYER_CAPTURED',
        payload: {
          playerMove: move,
        },
      });
    },
    [state.phase]
  );

  const { gestureStatus, serviceReady } = useGestureDetection({
    videoRef,
    phase: state.phase,
    onStableGesture: handleStableGesture,
    landmarkCanvasRef,
  });

  // ─── Detection prompt from gesture status ───
  useEffect(() => {
    if (state.phase === 'waitingForStart' || state.phase === 'gameReady') {
      const nextPrompt =
        gestureStatus.kind === 'noHand'
          ? '🖐 Show your hand'
          : gestureStatus.kind === 'moving'
            ? '✋ Hold your hand steady'
            : gestureStatus.kind === 'stable'
              ? '✅ Hand detected — ready!'
              : !serviceReady
                ? '⏳ Loading gesture model...'
                : null;

      if (state.detectionPrompt !== nextPrompt) {
        dispatch({ type: 'SET_DETECTION_PROMPT', payload: nextPrompt });
      }
    }
    if (state.phase === 'capture') {
      const nextPrompt =
        gestureStatus.kind === 'noHand'
          ? '🖐 Show your move!'
          : gestureStatus.kind === 'moving'
            ? '✋ Hold steady!'
            : null;

      if (state.detectionPrompt !== nextPrompt) {
        dispatch({ type: 'SET_DETECTION_PROMPT', payload: nextPrompt });
      }
    }
  }, [gestureStatus, serviceReady, state.detectionPrompt, state.phase]);

  // ─── Phase transitions via game logic timers ───
  useEffect(() => {
    clearTimeout(timerRef.current!);
    clearInterval(countdownTickRef.current!);

    switch (state.phase) {
      case 'matchIntro': {
        AudioManager.play('welcome');
        AudioManager.playVoice('buddyGreet');

        timerRef.current = setTimeout(() => {
          dispatch({
            type: 'MATCH_INTRO_DONE',
            payload: {
              totalGames:
                configuredTotalGames ??
                GAME_CONFIG.DEFAULT_TOTAL_GAMES,
            },
          });
        }, GAME_CONFIG.MATCH_INTRO_MS);

        break;
      }

      case 'gameReady': {
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'GAME_START' });
        }, 800);
        break;
      }

      case 'countdown': {
        let tick = 1;
        dispatch({ type: 'COUNTDOWN_TICK', payload: tick });
        AudioManager.play(`countdown${tick}` as any);
        AudioManager.playVoice('buddyCallRock');

        countdownTickRef.current = setInterval(() => {
          tick++;
          if (tick <= 3) {
            dispatch({ type: 'COUNTDOWN_TICK', payload: tick });
            AudioManager.play(`countdown${tick}` as any);
            if (tick === 2) AudioManager.playVoice('buddyCallPaper');
            if (tick === 3) AudioManager.playVoice('buddyCallScissors');
          } else {
            clearInterval(countdownTickRef.current!);
            // Show GO
            dispatch({ type: 'COUNTDOWN_TICK', payload: 'GO' });
            AudioManager.play('go');
            setTimeout(() => AudioManager.playVoice('buddyCallShoot'), GAME_CONFIG.BUDDY_VOICE_DELAY_MS);

            // Commit Buddy move BEFORE capture window opens
            const buddyMove = generateBuddyMove();
            timerRef.current = setTimeout(() => {
              captureLockedRef.current = false;
              dispatch({ type: 'BEGIN_CAPTURE', payload: { buddyMove } });

              // Capture timeout — if no gesture, retry round
              timerRef.current = setTimeout(() => {
                if (!captureLockedRef.current) {
                  dispatch({ type: 'NO_GESTURE_DETECTED' });
                  AudioManager.play('noMove');
                  AudioManager.playVoice('buddyNoMovePrompt');
                }
              }, GAME_CONFIG.CAPTURE_WINDOW_MS);
            }, GAME_CONFIG.GO_HOLD_MS);
          }
        }, GAME_CONFIG.COUNTDOWN_STEP_MS);
        break;
      }

      case 'reveal': {
        const outcome = state.gameOutcome;
        if (outcome === 'playerWin') {
          AudioManager.play('playerRoundWin');
          AudioManager.playVoice('buddyRoundEncourage');
        } else if (outcome === 'buddyWin') {
          AudioManager.play('buddyRoundWin');
          AudioManager.playVoice('buddyRoundTaunt');
        } else {
          AudioManager.play('draw');
          AudioManager.playVoice('buddyDrawReact');
        }

        timerRef.current = setTimeout(() => {
          dispatch({ type: 'REVEAL_DONE' });
        }, GAME_CONFIG.REVEAL_DURATION_MS);
        break;
      }

      case 'gameResult': {
        const holdMs =
          state.gameOutcome === 'draw'
            ? GAME_CONFIG.DRAW_RESULT_HOLD_MS
            : GAME_CONFIG.GAME_RESULT_HOLD_MS;

        timerRef.current = setTimeout(() => {
          dispatch({ type: 'GAME_RESULT_DONE' });
        }, holdMs);
        break;
      }

      case 'matchResult': {
        if (state.matchResult === 'playerWin') {
          AudioManager.play('playerMatchWin');
          AudioManager.playVoice('buddyMatchConsole');
          onMatchComplete('playerWin', state.playerScore, state.buddyScore);
        } else {
          AudioManager.play('buddyMatchWin');
          AudioManager.playVoice('buddyMatchCelebrate');
          onMatchComplete('buddyWin', state.playerScore, state.buddyScore);
        }
        break;
      }
    }

    return () => {
      clearTimeout(timerRef.current!);
      clearInterval(countdownTickRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, configuredTotalGames]);

  // ─── Derived UI values ───


  const showHUD = [
    'countdown', 'capture', 'reveal', 'gameResult', 'gameReady',
  ].includes(state.phase);

  const showCountdown =
    state.phase === 'countdown' && state.countdownValue !== null;

  const showReveal =
    state.phase === 'reveal' || state.phase === 'gameResult';

  const buddyBehavior = getBuddyBehavior({
    phase: state.phase,
    buddyMove: state.buddyMove,
    gameOutcome: state.gameOutcome,
    matchResult: state.matchResult,
    detectionPrompt: state.detectionPrompt,
  });

  // ─── Camera error state ───
  if (state.phase === 'error') {
    return (
      <CameraError
        message={state.errorMessage ?? cameraError ?? 'Camera could not be started.'}
        onRetry={() => {
          dispatch({ type: 'DISMISS_ERROR' });
          dispatch({ type: 'START_CAMERA' });
        }}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="screen-container portrait-kiosk">

      {/* ========================================================
        HEADER
        ======================================================== */}
      <header className="kiosk-header">
        <div className="kiosk-header-logo">
          <img
            src="/favicon.png"
            alt="Nutri Delight"
          />
        </div>

        <div className="kiosk-header-title">
          <svg className="header-leaf-icon leaf-green" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 4.25S2 11.5 2 11.5s5-1.5 9-2.5 6-.5 6-.5z" />
          </svg>
          <span>ROCK</span>
          <b>•</b>
          <span>PAPER</span>
          <b>•</b>
          <span>SCISSORS</span>
          <svg className="header-leaf-icon leaf-orange" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 4.25S2 11.5 2 11.5s5-1.5 9-2.5 6-.5 6-.5z" />
          </svg>
        </div>

        <button
          className="kiosk-exit"
          onClick={onBack}
          aria-label="Exit game"
        >
          EXIT
        </button>
      </header>

      {/* ========================================================
        SINGLE GAME ARENA
        Player + Buddy exist in the SAME space.
        ======================================================== */}
      <main className="game-arena">

        {/* LIVE CAMERA */}
        <div className="arena-camera">
          <CameraView videoRef={videoRef} />

          <HandLandmarkOverlay
            canvasRef={landmarkCanvasRef}
          />

          {/* Camera darkening for HUD readability */}
          <div className="arena-top-gradient" />
          <div className="arena-bottom-gradient" />

          {/* Camera detection corners */}
          <div className="camera-bracket bracket-tl" />
          <div className="camera-bracket bracket-tr" />
          <div className="camera-bracket bracket-bl" />
          <div className="camera-bracket bracket-br" />

          {gestureStatus?.kind === 'stable' && (
            <div className="hand-detected-indicator">
              <span className="dot" />
              HAND DETECTED
            </div>
          )}

          {/* COUNTDOWN */}
          {showCountdown && (
            <CountdownOverlay
              value={state.countdownValue}
            />
          )}

          {/* MOVE REVEAL */}
          <MoveReveal
            playerMove={state.playerMove}
            buddyMove={state.buddyMove}
            outcome={state.gameOutcome}
            visible={showReveal}
          />
        </div>

        {/* ======================================================
          TOP HUD
          ====================================================== */}
        {showHUD && (
          <div className="arena-score-layer">
            <ScoreHUD
              playerScore={state.playerScore}
              buddyScore={state.buddyScore}
              currentGame={state.currentGame}
              totalGames={state.totalGames}
            />
          </div>
        )}

        {/* ======================================================
          BUDDY
          ====================================================== */}
        <div className={`buddy-arena ${showReveal ? 'buddy-arena-reveal' : ''}`}>
          {/* Soft golden stage glow behind Buddy */}
          <div className="buddy-stage-glow" aria-hidden="true" />

          {/* Grounding floor spotlight */}
          <div className="buddy-ground" aria-hidden="true" />

          {/* Ambient brand leaves floating in the foreground */}
          <div className="arena-ambient-leaves" aria-hidden="true">
            <span className="leaf-particle leaf-p1" />
            <span className="leaf-particle leaf-p2" />
            <span className="leaf-particle leaf-p3" />
            <span className="leaf-particle leaf-p4" />
          </div>

          <BuddyAvatar
            state={buddyBehavior.state}
            message={buddyBehavior.message || null}
          />
        </div>

        {/* ======================================================
          START GAME
          ====================================================== */}
        {state.phase === 'waitingForStart' && (
          <div className="arena-start-layer">
            {isLoadingGameConfig ? (
              <div className="kiosk-config-loading">
                Loading game settings…
              </div>
            ) : gameConfigError ? (
              <div className="kiosk-config-error">
                <div>{gameConfigError}</div>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  TRY AGAIN
                </button>
              </div>
            ) : (
              <button
                className="kiosk-start-button"
                onClick={() => {
                  AudioManager.preload();
                  dispatch({ type: 'START_MATCH' });
                }}
                id="game-start-match-btn"
              >
                START GAME
              </button>
            )}
          </div>
        )}

        {/* ======================================================
          MATCH INTRO
          ====================================================== */}
        {state.phase === 'matchIntro' && (
          <div className="kiosk-intro-overlay">
            <div className="animate-bounce-in kiosk-intro-card">
              <div>
                PLAY {state.totalGames} GAMES!
              </div>

              <div>
                LET'S GO!
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
