import React from 'react';

export default function GeneratingBubble({ label = 'Generating' }) {
    return (
        <div className="ai-chat__generating" role="status" aria-live="polite">
            <span className="ai-chat__generating-shimmer" aria-hidden="true" />
            <span className="ai-chat__generating-text">{label}</span>
        </div>
    );
}
