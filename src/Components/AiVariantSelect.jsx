import React, { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import CoinIcon from './CoinIcon.jsx';

export default function AiVariantSelect({
    id,
    label,
    value,
    options = [],
    onChange,
    disabled = false,
    onLockedSelect,
    text = {},
}) {
    const [open, setOpen] = useState(false);

    if (!options.length || options.length <= 1) {
        return null;
    }

    const activeOption = options.find((option) => option.id === value) ?? options[0];
    const summary = activeOption?.label ?? value;

    const handleSelect = (nextValue, option) => {
        if (option?.locked) {
            onLockedSelect?.(option);
            setOpen(false);
            return;
        }
        onChange(nextValue);
        setOpen(false);
    };

    return (
        <div className="ai-variant-select">
            <div className={`media-picker ${open ? 'media-picker--open' : ''}`}>
                <button
                    id={id}
                    type="button"
                    className="media-picker__trigger"
                    onClick={() => setOpen((prev) => !prev)}
                    disabled={disabled}
                    aria-expanded={open}
                >
                    <span className="media-picker__label">{label}</span>
                    <span className="media-picker__summary">{summary}</span>
                    {activeOption?.priceCoins ? (
                        <span className="media-picker__price">
                            <CoinIcon size={13} />
                            {activeOption.priceCoins}
                        </span>
                    ) : null}
                    <ChevronDown size={14} className="media-picker__chevron" aria-hidden="true" />
                </button>
                {open ? (
                    <div className="media-picker__panel">
                        <div className="media-options__group">
                            <div className="media-options__chips" role="group" aria-labelledby={id}>
                                {options.map((option) => {
                                    const isActive = option.id === value;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            className={`media-options__chip ${isActive ? 'media-options__chip--active' : ''}${option.locked ? ' media-options__chip--locked' : ''}`}
                                            onClick={() => handleSelect(option.id, option)}
                                            disabled={disabled}
                                            aria-pressed={isActive}
                                        >
                                            <span className="media-options__chip-label">{option.label}</span>
                                            {option.locked ? (
                                                <span className="media-options__chip-lock">
                                                    <Lock size={11} />
                                                    {text[option.requiredPlanLabelKey] ?? option.requiredPlan}
                                                </span>
                                            ) : option.priceCoins ? (
                                                <span className="media-options__chip-price">
                                                    <CoinIcon size={12} />
                                                    {option.priceCoins}
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
