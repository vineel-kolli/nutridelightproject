import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  uploadPrizeImage,
  type PrizeRule,
} from '../api/adminApi';

interface PrizeRuleFormProps {
  totalGames: number;
  initialRule?: PrizeRule | null;
  isSaving: boolean;
  onSubmit: (data: {
    required_wins: number;
    prize_name: string;
    prize_image_url: string;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const PrizeRuleForm: React.FC<
  PrizeRuleFormProps
> = ({
  totalGames,
  initialRule,
  isSaving,
  onSubmit,
  onCancel,
}) => {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [requiredWins, setRequiredWins] =
    useState('');

  const [prizeName, setPrizeName] =
    useState('');

  const [prizeImageUrl, setPrizeImageUrl] =
    useState('');

  const [imageFileName, setImageFileName] =
    useState('');

  const [isActive, setIsActive] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  useEffect(() => {
    if (initialRule) {
      setRequiredWins(
        String(initialRule.required_wins),
      );

      setPrizeName(
        initialRule.prize_name,
      );

      setPrizeImageUrl(
        initialRule.prize_image_url,
      );

      setImageFileName(
        initialRule.prize_image_url
          .split('/')
          .pop() ?? '',
      );

      setIsActive(
        initialRule.is_active,
      );
    } else {
      setRequiredWins('');
      setPrizeName('');
      setPrizeImageUrl('');
      setImageFileName('');
      setIsActive(true);
    }

    setValidationError(null);
    setIsUploading(false);
  }, [initialRule]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setValidationError(null);

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      setValidationError(
        'Use JPG, PNG, or WebP.',
      );

      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setValidationError(
        'Image must be 5 MB or smaller.',
      );

      event.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const result =
        await uploadPrizeImage(file);

      setPrizeImageUrl(result.url);
      setImageFileName(file.name);
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : 'Unable to upload image.',
      );

      setPrizeImageUrl('');
      setImageFileName('');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setValidationError(null);

    const wins =
      Number(requiredWins);

    if (!Number.isInteger(wins)) {
      setValidationError(
        'Required wins must be a whole number.',
      );
      return;
    }

    if (
      wins < 1 ||
      wins > totalGames
    ) {
      setValidationError(
        `Required wins must be between 1 and ${totalGames}.`,
      );
      return;
    }

    const trimmedName =
      prizeName.trim();

    if (!trimmedName) {
      setValidationError(
        'Prize name is required.',
      );
      return;
    }

    if (!prizeImageUrl) {
      setValidationError(
        'Please select a prize image.',
      );
      return;
    }

    if (isUploading) {
      setValidationError(
        'Please wait for the image upload to finish.',
      );
      return;
    }

    onSubmit({
      required_wins: wins,
      prize_name: trimmedName,
      prize_image_url: prizeImageUrl,
      is_active: isActive,
    });
  };

  const openFilePicker = () => {
    if (
      isSaving ||
      isUploading
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <form
      className="admin-prize-form"
      onSubmit={handleSubmit}
    >
      <div className="admin-form-field">
        <label
          htmlFor="prize-required-wins"
          className="admin-field-label"
        >
          Required wins
        </label>

        <input
          id="prize-required-wins"
          className="admin-input"
          type="number"
          min={1}
          max={totalGames}
          step={1}
          value={requiredWins}
          onChange={(event) =>
            setRequiredWins(
              event.target.value,
            )
          }
          disabled={
            isSaving ||
            isUploading
          }
          required
        />
      </div>

      <div className="admin-form-field">
        <label
          htmlFor="prize-name"
          className="admin-field-label"
        >
          Reward name
        </label>

        <input
          id="prize-name"
          className="admin-input"
          type="text"
          maxLength={100}
          value={prizeName}
          onChange={(event) =>
            setPrizeName(
              event.target.value,
            )
          }
          disabled={
            isSaving ||
            isUploading
          }
          placeholder="e.g. 30% Discount"
          required
        />
      </div>

      <div className="admin-form-field">
        <span className="admin-field-label">
          Reward image
        </span>

        <div className="admin-image-upload">
          <div className="admin-image-preview">
            {prizeImageUrl ? (
              <img
                src={prizeImageUrl}
                alt=""
              />
            ) : (
              <span aria-hidden="true">
                ★
              </span>
            )}
          </div>

          <div className="admin-image-upload-info">
            <strong className="admin-image-upload-title">
              {imageFileName
                ? 'Image selected'
                : 'Choose an image'}
            </strong>

            <span className="admin-image-file">
              JPG, PNG or WebP · Max 5 MB
            </span>

            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-small"
              onClick={openFilePicker}
              disabled={
                isSaving ||
                isUploading
              }
            >
              {isUploading
                ? 'Uploading…'
                : imageFileName
                  ? 'Change image'
                  : 'Choose image'}
            </button>
          </div>

          <input
            ref={fileInputRef}
            id="prize-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={
              isSaving ||
              isUploading
            }
            className="admin-file-input"
          />
        </div>
      </div>

      <label className="admin-active-setting">
        <span>
          <strong>Active</strong>

          <small>
            Available when calculating rewards
          </small>
        </span>

        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) =>
            setIsActive(
              event.target.checked,
            )
          }
          disabled={
            isSaving ||
            isUploading
          }
        />
      </label>

      {validationError && (
        <div
          className="admin-form-error"
          role="alert"
        >
          {validationError}
        </div>
      )}

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onCancel}
          disabled={
            isSaving ||
            isUploading
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={
            isSaving ||
            isUploading
          }
        >
          {isSaving
            ? 'Saving…'
            : isUploading
              ? 'Uploading…'
              : initialRule
                ? 'Save reward'
                : 'Add reward'}
        </button>
      </div>
    </form>
  );
};