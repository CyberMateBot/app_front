import React from 'react';

/**
 * CyberMate brand mark — user-provided "CM" monogram PNG + gradient wordmark.
 *
 * The monogram already ships in the app's aurora palette (cyan → violet)
 * on a black background, so we render it with `mix-blend-mode: screen` in
 * the stylesheet — the black bg maps to transparent while the gradient
 * strokes stay lit up on top of whatever aurora region is behind. The
 * wordmark next to it is an HTML text span filled with the same
 * background-clip gradient so the two halves visually belong together.
 */
export default function BrandLogo({ title = 'CyberMate' }) {
    return (
        <span className="brand-logo" aria-label={title}>
            <img
                className="brand-logo__mark"
                src="/brand-mark.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                width="36"
                height="36"
            />
            <span className="brand-logo__wordmark">{title}</span>
        </span>
    );
}
