import React from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import { getTypingProgress } from '../lib/typingProgress.js';

export default function TypingMessage({
    text,
    messageId,
    typingProgress = 0,
    renderMarkdown = false,
}) {
    const normalized = text ?? '';
    const visibleLength = Math.min(
        Math.max(Number(typingProgress) || 0, getTypingProgress(messageId)),
        normalized.length,
    );
    const visibleText = normalized.slice(0, visibleLength);
    const isDone = visibleLength >= normalized.length;

    if (renderMarkdown) {
        return (
            <div className="typing-message">
                <MarkdownMessage content={visibleText} />
                {!isDone ? (
                    <span className="ai-chat__typing-cursor" aria-hidden="true">|</span>
                ) : null}
            </div>
        );
    }

    return (
        <p>
            {visibleText}
            {!isDone ? <span className="ai-chat__typing-cursor" aria-hidden="true">|</span> : null}
        </p>
    );
}
