import React, { useEffect, useState } from 'react';

import {
  createPrizeRule,
  updatePrizeRule,
  deletePrizeRule,
  type PrizeRule,
} from '../api/adminApi';

import { PrizeRuleForm } from './PrizeRuleForm';

interface PrizeRulesCardProps {
  gameConfigId: number;
  totalGames: number;
  prizes: PrizeRule[];
  onPrizesChanged: (prizes: PrizeRule[]) => void;
}

export const PrizeRulesCard: React.FC<PrizeRulesCardProps> = ({
  gameConfigId,
  totalGames,
  prizes,
  onPrizesChanged,
}) => {
  const [editingRule, setEditingRule] =
    useState<PrizeRule | null>(null);

  const [isAdding, setIsAdding] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const sortedPrizes = [...prizes].sort(
    (a, b) => b.required_wins - a.required_wins,
  );

  const isModalOpen =
    isAdding || editingRule !== null;

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        closeModal();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isModalOpen, isSaving]);

  const handleSubmit = async (data: {
    required_wins: number;
    prize_name: string;
    prize_image_url: string;
    is_active: boolean;
  }) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingRule) {
        const updatedRule =
          await updatePrizeRule(
            gameConfigId,
            editingRule.id,
            data,
          );

        onPrizesChanged(
          prizes.map((prize) =>
            prize.id === updatedRule.id
              ? updatedRule
              : prize,
          ),
        );

        closeModal();
      } else {
        const createdRule =
          await createPrizeRule(
            gameConfigId,
            data,
          );

        onPrizesChanged([
          ...prizes,
          createdRule,
        ]);

        closeModal();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save prize rule.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    prize: PrizeRule,
  ) => {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      `Delete this prize rule?\n\n${prize.required_wins} wins — ${prize.prize_name}`,
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await deletePrizeRule(
        gameConfigId,
        prize.id,
      );

      onPrizesChanged(
        prizes.filter(
          (item) => item.id !== prize.id,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete prize rule.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingRule(null);
    setErrorMessage(null);
    setIsAdding(true);
  };

  const openEditModal = (
    prize: PrizeRule,
  ) => {
    setIsAdding(false);
    setErrorMessage(null);
    setEditingRule(prize);
  };

  function closeModal() {
    if (isSaving) {
      return;
    }

    setEditingRule(null);
    setIsAdding(false);
    setErrorMessage(null);
  }

  return (
    <>
      <div className="admin-rewards">
        <div className="admin-rewards-header">
          <div className="admin-rewards-title">
            <span className="admin-eyebrow">
              REWARDS
            </span>

            <span className="admin-rewards-count">
              {sortedPrizes.length}{' '}
              {sortedPrizes.length === 1
                ? 'reward'
                : 'rewards'}
            </span>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={openAddModal}
          >
            + Add reward
          </button>
        </div>

        {errorMessage && !isModalOpen && (
          <div
            className="admin-message admin-message-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {sortedPrizes.length === 0 ? (
          <div className="admin-empty-state">
            <h4>No rewards configured</h4>

            <p>
              Add a reward for a player's final
              score.
            </p>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openAddModal}
            >
              + Add reward
            </button>
          </div>
        ) : (
          <div className="admin-reward-table">
            <div className="admin-reward-table-head">
              <span>Wins</span>
              <span>Reward</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {sortedPrizes.map((prize) => (
              <article
                key={prize.id}
                className="admin-reward-row"
              >
                <div className="admin-reward-wins">
                  <strong>
                    {prize.required_wins}
                  </strong>

                  <span>
                    {prize.required_wins === 1
                      ? 'win'
                      : 'wins'}
                  </span>
                </div>

                <div className="admin-reward-name">
                  {prize.prize_image_url ? (
                    <img
                      src={prize.prize_image_url}
                      alt=""
                      className="admin-reward-image"
                    />
                  ) : (
                    <div
                      className="admin-reward-image-placeholder"
                      aria-hidden="true"
                    >
                      ★
                    </div>
                  )}

                  <span>
                    {prize.prize_name}
                  </span>
                </div>

                <div>
                  {prize.is_active ? (
                    <span className="admin-status">
                      <span className="admin-status-dot" />
                      Active
                    </span>
                  ) : (
                    <span className="admin-status admin-status-inactive">
                      <span className="admin-status-dot" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="admin-reward-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary admin-btn-small"
                    onClick={() =>
                      openEditModal(prize)
                    }
                    disabled={isSaving}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-danger admin-btn-small"
                    onClick={() =>
                      handleDelete(prize)
                    }
                    disabled={isSaving}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prize-modal-title"
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-eyebrow">
                  REWARD
                </span>

                <h2 id="prize-modal-title">
                  {editingRule
                    ? 'Edit reward'
                    : 'Add reward'}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div
                className="admin-message admin-message-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <div className="admin-modal-body">
              <PrizeRuleForm
                totalGames={totalGames}
                initialRule={editingRule}
                isSaving={isSaving}
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
};