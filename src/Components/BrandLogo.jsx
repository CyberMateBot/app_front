import React from 'react';

/**
 * CyberMate brand mark — a glass-tile "CM" monogram + gradient wordmark.
 *
 * Designed to sit on the aurora page background: the badge picks up the
 * app's accent palette (cyan → violet → mint) as a stroke gradient so it
 * pops on the deep-navy hero without the awkward black rectangle the
 * previous JPG had. The mark is 100% inline SVG + HTML text, so it scales
 * crisply on every device and swaps theme colors instantly.
 *
 * The `unique` prop appends a suffix to gradient ids so multiple
 * BrandLogo instances on the same page don't collide.
 */
export default function BrandLogo({ unique = 'home', title = 'CyberMate' }) {
    const gradientId = `cm-brand-grad-${unique}`;
    const tileId = `cm-brand-tile-${unique}`;

    return (
        <span className="brand-logo" aria-label={title}>
            <svg
                className="brand-logo__mark"
                width="36"
                height="36"
                viewBox="0 0 40 40"
                aria-hidden="true"
                focusable="false"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="55%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#5eead4" />
                    </linearGradient>
                    <linearGradient id={tileId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(125, 211, 252, 0.14)" />
                        <stop offset="100%" stopColor="rgba(167, 139, 250, 0.14)" />
                    </linearGradient>
                </defs>

                {/* Glass tile background — subtle gradient tint that blends
                    with the aurora page while still giving the monogram
                    something to sit on. */}
                <rect
                    x="1.5"
                    y="1.5"
                    width="37"
                    height="37"
                    rx="11"
                    fill={`url(#${tileId})`}
                    stroke={`url(#${gradientId})`}
                    strokeWidth="1.5"
                />

                {/* Top-left corner highlight — the "chrome edge" that
                    reads on both dark and light aurora regions. */}
                <path
                    d="M6 3 L34 3"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                />

                {/* "CM" — bold, gradient-filled, K2D display. Kept as
                    text so it inherits the font stack used elsewhere in
                    the app and stays crisp at any zoom. */}
                <text
                    x="20"
                    y="27"
                    textAnchor="middle"
                    fontFamily="'K2D', 'Inter', sans-serif"
                    fontWeight="800"
                    fontSize="15"
                    letterSpacing="0.5"
                    fill={`url(#${gradientId})`}
                >
                    CM
                </text>
            </svg>
            <span className="brand-logo__wordmark">{title}</span>
        </span>
    );
}
