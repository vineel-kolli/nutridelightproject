import React from 'react';
import type { AvatarState } from '../avatar/avatarTypes';

const AVATAR_IMAGES: Partial<Record<AvatarState, string>> = {
  idle: '/avatar/buddy_idle.png',
  listening: '/avatar/buddy_idle.png',
  ready: '/avatar/buddy_idle.png',
  countdown: '/avatar/buddy_idle.png',

  rock: '/avatar/buddy_rock.png',
  paper: '/avatar/buddy_paper.png',
  scissors: '/avatar/buddy_scissors.png',

  roundWin: '/avatar/buddy_loss.png',
  roundLoss: '/avatar/buddy_win.png',
  draw: '/avatar/buddy_idle.png',

  matchWin: '/avatar/buddy_loss.png',
  matchLoss: '/avatar/buddy_win.png',
};

const STATE_ANIMATION: Partial<Record<AvatarState, string>> = {
  idle: 'animate-buddy-float',
  listening: 'animate-buddy-float',
  ready: 'animate-buddy-float',
  countdown: 'animate-buddy-float',

  matchWin: 'animate-buddy-celebrate',
  roundLoss: 'animate-buddy-celebrate',

  matchLoss: '',
  roundWin: '',
};

interface BuddyAvatarProps {
  state: AvatarState;
  className?: string;
  message?: string | null;
}

export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  state,
  className = '',
  message = null,
}) => {
  const imgSrc = AVATAR_IMAGES[state] ?? '/avatar/buddy_idle.png';
  const animation = STATE_ANIMATION[state] ?? 'animate-buddy-float';

  return (
    <div
      className={`buddy-arena-character ${className}`}
      aria-label={`Buddy is ${state}`}
    >
      {/* =====================================================
          SPEECH BUBBLE (Anchored directly to Buddy's head)
          ===================================================== */}
      {message && message.trim().length > 0 && (
        <div className="buddy-head-anchor" aria-live="polite">
          {/* Subtle playful dialogue sparkle/accent marks */}
          <div className="buddy-speech-accents" aria-hidden="true">
            <span className="accent-bar bar-1" />
            <span className="accent-bar bar-2" />
          </div>

          <div className="buddy-arena-speech">
            <span>{message}</span>
            <div className="buddy-speech-tail" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* =====================================================
          GROUNDING SHADOWS
          Direct sneaker contact shadow + ambient floor shadow
          ===================================================== */}
      <div className="buddy-contact-shadow" aria-hidden="true" />
      <div className="buddy-ambient-shadow" aria-hidden="true" />

      {/* =====================================================
          BUDDY CHARACTER IMAGE
          Prominent standing posture with crisp Nutri Delight hoodie logo
          ===================================================== */}
      <img
        src={imgSrc}
        alt="Nutri Delight Buddy"
        draggable={false}
        className={`buddy-arena-image ${animation}`}
      />

      <span className="sr-only">Buddy is {state}</span>
    </div>
  );
};