import React from 'react';
import { Plus } from 'lucide-react';
import CoinIcon from './CoinIcon.jsx';

function formatBalance(value) {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return String(value ?? 0);
    }

    return new Intl.NumberFormat('ru-RU').format(numeric);
}

// Single compact "pill" showing the coin balance and (optionally) a plus
// icon to top up — mirrors the home screen's balance button so the same
// widget looks identical everywhere it's used (headers, catalog, etc.)
// instead of splitting into two separate buttons side by side.
export default function CoinBalanceWidget({
    balance = 0,
    onClick,
    onTopUp,
    compact = false,
    showPlus = false,
    className = '',
    topUpLabel = 'Top up coins',
}) {
    const handler = onClick ?? onTopUp;
    const iconSize = compact ? 16 : 18;
    const sizeClass = compact ? 'coin-widget--compact' : '';
    const label = showPlus
        ? `${formatBalance(balance)} CyberCoins · ${topUpLabel}`
        : `${formatBalance(balance)} CyberCoins`;

    const content = (
        <>
            <CoinIcon size={iconSize} className="coin-widget__icon" />
            <span className="coin-widget__value">{formatBalance(balance)}</span>
            {showPlus ? <Plus className="coin-widget__plus" size={12} aria-hidden="true" /> : null}
        </>
    );

    if (typeof handler !== 'function') {
        return (
            <span className={`coin-widget coin-widget--static ${sizeClass} ${className}`.trim()}>
                {content}
            </span>
        );
    }

    return (
        <button
            type="button"
            className={`coin-widget ${sizeClass} ${className}`.trim()}
            onClick={handler}
            aria-label={label}
        >
            {content}
        </button>
    );
}
