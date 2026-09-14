import React, { useState } from 'react';
import { Crown, ChevronDown } from 'lucide-react';
import CoinIcon from './CoinIcon.jsx';

/**
 * Model / tier picker for AI screens.
 *
 * Renders as a collapsible drop-down "window" — a trigger row with
 * the currently-selected model on it, and (when open) a full panel
 * listing every option vertically. This mirrors the parameter card
 * UX so the top panel of AI chats stays compact and the picker
 * doesn't rely on a horizontal scroll (which used to leave adjacent
 * pills peeking as tiny dark dots at the strip edges).
 *
 * Each option in the open panel shows:
 *   - Model label
 *   - Coin price on the right (small pill)
 *   - Crown icon + plan name if locked behind a higher subscription
 *   - "Редактирование" badge if the model can edit an EXISTING
 *      image/video (flagged via `option.editing`)
 *   - "По фото" badge if the model needs a photo to seed a brand
 *      new generation, e.g. image-to-video (flagged via
 *      `option.photoSeed`) — distinct from real editing, so users
 *      don't expect to upload/edit a video on these.
 */
export default function AiVariantSelect({
    id,
    label,
    value,
    options = [],
    onChange,
    disabled = false,
    onLockedSelect,
    text = {},
    activePriceCoins,
    defaultOpen = false,
}) {
    const [open, setOpen] = useState(defaultOpen);

    if (!options.length) {
        return null;
    }

    const activeOption = options.find((option) => option.id === value) ?? options[0];
    const activePrice = activePriceCoins ?? activeOption?.priceCoins;

    const handleSelect = (option) => {
        if (disabled) return;
        if (option?.locked) {
            onLockedSelect?.(option);
            return;
        }
        if (option?.id !== value) {
            onChange?.(option.id);
        }
        setOpen(false);
    };

    const triggerId = id ? `${id}-trigger` : undefined;
    const labelId = id ? `${id}-label` : undefined;
    const editingLabel = text.mediaModelEditingBadge ?? 'Редактирование';
    const photoSeedLabel = text.mediaModelPhotoBadge ?? 'По фото';

    return (
        <div className={`ai-variant-select ${open ? 'ai-variant-select--open' : ''}`} role="group" aria-label={label}>
            <button
                id={triggerId}
                type="button"
                className="ai-variant-select__trigger"
                onClick={() => setOpen((prev) => !prev)}
                disabled={disabled}
                aria-expanded={open}
                aria-controls={id ? `${id}-panel` : undefined}
            >
                {label ? (
                    <span id={labelId} className="ai-variant-select__label">{label}</span>
                ) : null}
                <span className="ai-variant-select__current">
                    <span className="ai-variant-select__current-label">
                        {activeOption?.label ?? ''}
                    </span>
                    {activeOption?.editing ? (
                        <span className="ai-variant-select__edit-badge">
                            {editingLabel}
                        </span>
                    ) : activeOption?.photoSeed ? (
                        <span className="ai-variant-select__photo-badge">
                            {photoSeedLabel}
                        </span>
                    ) : null}
                    {activeOption?.locked ? (
                        <span className="ai-variant-select__pill-lock">
                            <Crown size={9} aria-hidden="true" />
                            {text[activeOption.requiredPlanLabelKey] ?? activeOption.requiredPlan}
                        </span>
                    ) : activePrice ? (
                        <span className="ai-variant-select__current-price">
                            <CoinIcon size={11} />
                            {activePrice}
                        </span>
                    ) : null}
                </span>
                <ChevronDown
                    size={14}
                    className="ai-variant-select__chevron"
                    aria-hidden="true"
                />
            </button>

            {open ? (
                <div
                    id={id ? `${id}-panel` : undefined}
                    className="ai-variant-select__panel"
                    role="listbox"
                    aria-labelledby={labelId}
                >
                    {options.map((option) => {
                        const isActive = option.id === value;
                        const priceCoins = isActive
                            ? (activePriceCoins ?? option.priceCoins)
                            : option.priceCoins;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={
                                    'ai-variant-select__option'
                                    + (isActive ? ' ai-variant-select__option--active' : '')
                                    + (option.locked ? ' ai-variant-select__option--locked' : '')
                                }
                                onClick={() => handleSelect(option)}
                                disabled={disabled && !isActive}
                            >
                                <span className="ai-variant-select__option-label">
                                    {option.label}
                                    {option.editing ? (
                                        <span className="ai-variant-select__option-badge">
                                            {editingLabel}
                                        </span>
                                    ) : option.photoSeed ? (
                                        <span className="ai-variant-select__option-badge ai-variant-select__option-badge--photo">
                                            {photoSeedLabel}
                                        </span>
                                    ) : null}
                                </span>
                                {option.locked ? (
                                    <span className="ai-variant-select__pill-lock">
                                        <Crown size={9} aria-hidden="true" />
                                        {text[option.requiredPlanLabelKey] ?? option.requiredPlan}
                                    </span>
                                ) : priceCoins ? (
                                    <span className="ai-variant-select__option-price">
                                        <CoinIcon size={12} />
                                        {priceCoins}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
