import React, { useState } from 'react';

import {
  loginAdmin,
  type AdminUser,
} from '../api/adminApi';


interface AdminLoginScreenProps {
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginScreen: React.FC<
  AdminLoginScreenProps
> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await loginAdmin(
        username.trim(),
        password,
      );

      onLoginSuccess(response.admin);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div
            className="admin-login-mark"
            aria-hidden="true"
          >
            ND
          </div>

          <h1 className="admin-login-title">
            Admin Portal
          </h1>

          <p className="admin-login-description">
            Manage the game and rewards used at the
            Nutri Delight kiosk.
          </p>
        </div>

        {errorMessage && (
          <div
            className="admin-message admin-message-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label
              className="admin-field-label"
              htmlFor="admin-username"
            >
              Username
            </label>

            <input
              id="admin-username"
              className="admin-input"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              autoFocus
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="admin-form-field">
            <label
              className="admin-field-label"
              htmlFor="admin-password"
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                className="admin-input"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                style={{ paddingRight: '72px' }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                disabled={isSubmitting}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#5f665f',
                  fontSize: '12px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary admin-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Signing in…'
              : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
};