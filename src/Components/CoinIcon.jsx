import React from 'react';

export default function CoinIcon({ size = 18, className = '', alt = 'CyberCoin' }) {
    return (
        <img
            src="/assets/coin-cm-v2.png"
            width={size}
            height={size}
            className={`coin-icon ${className}`.trim()}
            alt={alt}
            aria-hidden={alt ? undefined : true}
            draggable={false}
        />
    );
}
