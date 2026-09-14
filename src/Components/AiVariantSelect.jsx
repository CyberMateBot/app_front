import React, { useEffect, useRef, useState } from 'react';
import { Crown, ChevronDown } from 'lucide-react';
import CoinIcon from './CoinIcon.jsx';

// Desktop mice only emit vertical wheel deltas, so this horizontally
// scrollable strip of model pills is otherwise unreachable on PC without a
// trackpad. Convert vertical wheel intent into horizontal scroll when the
// strip actually overflows horizontally. Mirrors the helper used for the
// catalog/subscription plan strips.
function useHorizontalWheelScroll(ref) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const onWheel = (event) => {
            if (el.scrollWidth <= el.clientWidth) return;
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

            event.preventDefault();
            el.scrollBy({ left: event.deltaY, behavior: 'smooth' });
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [ref]);
}

/**
 * Model / tier picker for AI screens.
 *
 * The Sep 2026 redesign turned this into a collapsible dropdown (like
 * the parameter cards) so the top panel of AI chats can shrink — the
 * previous inline horizontal strip ate ~64px vertically all the time.
 *
 * Closed state: a single trigger row with the label ("Модель") on
 * the left and the current variant's name + coin price on the right,
 * plus a chevron. Clicking anywhere on the row expands the panel.
 *
 * Open state: horizontally-scrollable strip of pills, one per
 * option. Each pill shows:
 *   - Variant label
 *   - Coin price on the right (small pill inside the pill)
 *   - Crown icon + plan name if locked behind a higher subscription tier
 *
 * `defaultOpen` lets consumers keep the strip open on wide/tablet
 * layouts if they ever want; the default is collapsed.
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
    const scrollRef = useRef(null);
    useHorizontalWheelScroll(scrollRef);

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
        // Auto-collapse after a selection so the reading area comes
        // back — mirrors the parameter card UX.
        setOpen(false);
    };

    const triggerId = id ? `${id}-trigger` : undefined;
    const labelId = id ? `${id}-label` : undefined;

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
                    role="tablist"
                    aria-labelledby={labelId}
                >
                    <div className="ai-variant-select__scroll" ref={scrollRef}>
                        <div className="ai-variant-select__track">
                            {options.map((option) => {
                                const isActive = option.id === value;
                                const priceCoins = isActive
                                    ? (activePriceCoins ?? option.priceCoins)
                                    : option.priceCoins;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        className={
                                            'ai-variant-select__pill'
                                            + (isActive ? ' ai-variant-select__pill--active' : '')
                                            + (option.locked ? ' ai-variant-select__pill--locked' : '')
                                        }
                                        onClick={() => handleSelect(option)}
                                        disabled={disabled && !isActive}
                                    >
                                        <span className="ai-variant-select__pill-label">
                                            {option.label}
                                        </span>
                                        {option.locked ? (
                                            <span className="ai-variant-select__pill-lock">
                                                <Crown size={9} aria-hidden="true" />
                                                {text[option.requiredPlanLabelKey] ?? option.requiredPlan}
                                            </span>
                                        ) : priceCoins ? (
                                            <span className="ai-variant-select__pill-price">
                                                <CoinIcon size={11} />
                                                {priceCoins}
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
    );
}
