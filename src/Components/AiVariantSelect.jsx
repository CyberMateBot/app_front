import React, { useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
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
 * Inline segmented pill control for picking a model variant / tier.
 *
 * Was a dropdown ("media-picker") that required an extra click to see
 * options. In the Sep 2026 redesign we show all pill tabs inline — the
 * strip scrolls horizontally on narrow screens, so it works for both
 * 2-3 tiers (Fast/Standard/Pro) and long lists of variants.
 *
 * Each pill shows:
 *   - Variant label
 *   - Coin price on the right (small pill inside the pill)
 *   - Crown icon + plan name if locked behind a higher subscription tier
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
}) {
    const scrollRef = useRef(null);
    useHorizontalWheelScroll(scrollRef);

    if (!options.length) {
        return null;
    }

    const handleSelect = (option) => {
        if (disabled) return;
        if (option?.locked) {
            onLockedSelect?.(option);
            return;
        }
        if (option?.id !== value) {
            onChange?.(option.id);
        }
    };

    return (
        <div className="ai-variant-select" role="tablist" aria-label={label}>
            {label ? (
                <span id={id ? `${id}-label` : undefined} className="ai-variant-select__label">
                    {label}
                </span>
            ) : null}
            <div className="ai-variant-select__scroll" ref={scrollRef}>
                <div className="ai-variant-select__track" aria-labelledby={id ? `${id}-label` : undefined}>
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
    );
}
