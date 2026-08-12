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

export default function CoinBalanceWidget({
    balance = 0,
    onClick,
    onTopUp,
    compact = false,
    showPlus = false,
    className = '',
    topUpLabel = 'Top up coins',
}) {
    const topUpHandler = onTopUp ?? onClick;
    const iconSize = compact ? 16 : 18;

    const balanceControl = typeof onClick === 'function' ? (
        <button
            type="button"
            className={`coin-widget ${compact ? 'coin-widget--compact' : ''}`.trim()}
            onClick={onClick}
            aria-label={`${formatBalance(balance)} CyberCoins`}
        >
            <CoinIcon size={iconSize} className="coin-widget__icon" />
            <span className="coin-widget__value">{formatBalance(balance)}</span>
        </button>
    ) : (
        <span className={`coin-widget coin-widget--static ${compact ? 'coin-widget--compact' : ''}`.trim()}>
            <CoinIcon size={iconSize} className="coin-widget__icon" />
            <span className="coin-widget__value">{formatBalance(balance)}</span>
        </span>
    );

    if (!showPlus || typeof topUpHandler !== 'function') {
        if (showPlus && typeof onClick === 'function') {
            return (
                <button
                    type="button"
                    className={`coin-widget ${compact ? 'coin-widget--compact' : ''} ${className}`.trim()}
                    onClick={onClick}
                    aria-label={`${formatBalance(balance)} CyberCoins · ${topUpLabel}`}
                >
                    <CoinIcon size={iconSize} className="coin-widget__icon" />
                    <span className="coin-widget__value">{formatBalance(balance)}</span>
                    <Plus className="coin-widget__plus" size={12} aria-hidden="true" />
                </button>
            );
        }

        return (
            <span className={`coin-widget-row ${className}`.trim()}>
                {balanceControl}
            </span>
        );
    }

    return (
        <div className={`coin-widget-row ${className}`.trim()}>
            {balanceControl}
            <button
                type="button"
                className="coin-widget-row__plus"
                onClick={topUpHandler}
                aria-label={topUpLabel}
            >
                <Plus size={14} aria-hidden="true" />
            </button>
        </div>
    );
}
