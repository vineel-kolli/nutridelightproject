import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { gameReducer, INITIAL_STATE } from '../game/gameReducer';
import { generateBuddyMove } from '../game/gameEngine';
import { GAME_CONFIG } from '../game/gameConfig';
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
import type { AvatarState } from '../avatar/avatarTypes';
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

function resolveBuddyState(
  phase: string,
  buddyMove: RpsMove | null,
  roundOutcome: string | null,
  matchResult: string | null
): AvatarState {
  if (matchResult === 'playerWin') return 'matchWin';  // Buddy lost the match
  if (matchResult === 'buddyWin') return 'matchLoss';  // Buddy won the match

  if (phase === 'reveal' || phase === 'roundResult') {
    if (buddyMove) return buddyMove as AvatarState;
    if (roundOutcome === 'playerWin') return 'roundWin';
    if (roundOutcome === 'buddyWin') return 'roundLoss';
    if (roundOutcome === 'draw') return 'draw';
  }

  if (phase === 'countdown' || phase === 'capture') return 'countdown';
  if (phase === 'waitingForStart') return 'listening';
  if (phase === 'roundReady' || phase === 'matchIntro') return 'ready';
  return 'idle';
}

// ============================================================
// GameScreen — the camera-first game experience
// ============================================================

export const GameScreen: React.FC<GameScreenProps> = ({
  onMatchComplete,
  onBack,
}) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
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
  const handleStableGesture = useCallback((move: RpsMove) => {
    if (state.phase !== 'capture' || captureLockedRef.current) return;
    captureLockedRef.current = true;
    dispatch({ type: 'PLAYER_CAPTURED', payload: { playerMove: move } });
  }, [state.phase]);

  const { gestureStatus, debugInfo, serviceReady } = useGestureDetection({
    videoRef,
    phase: state.phase,
    onStableGesture: handleStableGesture,
    landmarkCanvasRef,
  });

  // ─── Detection prompt from gesture status ───
  useEffect(() => {
    if (state.phase === 'waitingForStart' || state.phase === 'roundReady') {
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
          dispatch({ type: 'MATCH_INTRO_DONE' });
        }, GAME_CONFIG.MATCH_INTRO_MS);
        break;
      }

      case 'roundReady': {
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'ROUND_START' });
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
        const outcome = state.roundOutcome;
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

      case 'roundResult': {
        const holdMs =
          state.roundOutcome === 'draw'
            ? GAME_CONFIG.DRAW_RESULT_HOLD_MS
            : GAME_CONFIG.ROUND_RESULT_HOLD_MS;

        timerRef.current = setTimeout(() => {
          dispatch({ type: 'ROUND_RESULT_DONE' });
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
  }, [state.phase]);

  // ─── Derived UI values ───
  const buddyAvatarState = resolveBuddyState(
    state.phase,
    state.buddyMove,
    state.roundOutcome,
    state.matchResult
  );

  const showHUD = [
    'countdown', 'capture', 'reveal', 'roundResult', 'roundReady',
  ].includes(state.phase);

  const showCountdown =
    state.phase === 'countdown' && state.countdownValue !== null;

  const showReveal =
    state.phase === 'reveal' || state.phase === 'roundResult';

  const detectionPromptText =
    state.phase === 'cameraSetup'
      ? 'Starting camera...'
      : state.phase === 'waitingForStart' && !serviceReady
        ? '⏳ Loading gesture model...'
        : state.detectionPrompt;

  const buddyMoveAsset =
    state.buddyMove === 'rock'
      ? '/avatar/buddy_rock.png'
      : state.buddyMove === 'paper'
        ? '/avatar/buddy_paper.png'
        : state.buddyMove === 'scissors'
          ? '/avatar/buddy_scissors.png'
          : null;

  const showBuddyMoveVisual =
    (state.phase === 'reveal' || state.phase === 'roundResult') &&
    !!buddyMoveAsset;

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

﻿  return (
    <div className="screen-container portrait-kiosk">
      <header className="kiosk-header">
        <div className="kiosk-header-logo">
          <img src="/favicon.svg" alt="Nutri Delight" />
        </div>
        <div className="kiosk-header-title">
          ROCK <span>•</span> PAPER <span>•</span> SCISSORS
        </div>
        <button className="kiosk-exit" onClick={onBack} aria-label="Exit game">
          EXIT
        </button>
      </header>

      {/* Main Content Area */}
      <main className="kiosk-main-content">
        {/* Score HUD at top */}
        {showHUD && (
          <div className="kiosk-score-wrapper">
            <ScoreHUD
              playerScore={state.playerScore}
              buddyScore={state.buddyScore}
              round={state.round}
            />
          </div>
        )}

        {/* Camera Area */}
        <section className="kiosk-camera-section">
          <div className="camera-container-box">
            {/* Corner brackets */}
            <div className="camera-bracket bracket-tl" />
            <div className="camera-bracket bracket-tr" />
            <div className="camera-bracket bracket-bl" />
            <div className="camera-bracket bracket-br" />

            {/* Hand Detected Indicator */}
            {gestureStatus?.kind === 'stable' && (
              <div className="hand-detected-indicator">
                <span className="dot"></span> HAND DETECTED
              </div>
            )}

            <div className="player-camera">
              <CameraView videoRef={videoRef} />
              <HandLandmarkOverlay canvasRef={landmarkCanvasRef} />
              {showCountdown && <CountdownOverlay value={state.countdownValue} />}
              <MoveReveal
                playerMove={state.playerMove}
                buddyMove={state.buddyMove}
                outcome={state.roundOutcome}
                visible={showReveal}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Buddy Area */}
      <section className="kiosk-buddy-section">
        {/* Buddy Speech Bubble */}
        <div className="buddy-speech-bubble">
          <span>I'm ready!</span><br/>
          <strong>Beat me<br/>if you can! 💪</strong>
        </div>

        {/* Mascot */}
        <div className="buddy-mascot-container">
          {showBuddyMoveVisual ? (
            <img className="buddy-avatar" src={buddyMoveAsset!} alt="Buddy Move" />
          ) : (
            <BuddyAvatar state={buddyAvatarState} />
          )}
        </div>
        
        {/* Background text graphic */}
        <div className="buddy-bg-text">
          BUDDY<br/><span>BEAT ME!</span>
        </div>
      </section>

      {/* Overlays */}
      {state.phase === 'waitingForStart' && (
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

      {state.phase === 'matchIntro' && (
        <div className="kiosk-intro-overlay">
          <div className="animate-bounce-in kiosk-intro-card">
            <div>FIRST TO {GAME_CONFIG.WINS_TO_MATCH}</div>
            <div>WINS! 🏆</div>
          </div>
        </div>
      )}

      {import.meta.env.DEV && debugInfo && (
        <div
          className="absolute top-20 left-2 z-50 text-xs font-mono p-2 rounded"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#0f0',
            maxWidth: 200,
          }}
        >
          <div>phase: {state.phase}</div>
          <div>label: {debugInfo.label}</div>
          <div>conf: {(debugInfo.confidence * 100).toFixed(0)}%</div>
          <div>vote: {(debugInfo.voteRatio * 100).toFixed(0)}%</div>
          <div>consec: {debugInfo.consecutiveCount}</div>
          <div>motion: {debugInfo.motion.toFixed(3)}</div>
          <div>status: {debugInfo.status.kind}</div>
        </div>
      )}
    </div>
  );
};
