import React from 'react';

export default function GeneratingBubble({ label = 'Generating' }) {
    return (
        <p className="ai-chat__generating-text" role="status" aria-live="polite">
            {label}
        </p>
    );
}
