import React, { useEffect, useRef, useState } from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';

const DEFAULT_CHAR_DELAY_MS = 16;

export default function TypingMessage({
    text,
    onComplete,
    charDelayMs = DEFAULT_CHAR_DELAY_MS,
    renderMarkdown = false,
}) {
    const [visibleLength, setVisibleLength] = useState(0);
    const [isDone, setIsDone] = useState(false);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const normalized = text ?? '';
        let cancelled = false;
        let timerId;

        const completeAt = (length) => {
            if (cancelled) {
                return;
            }
            setVisibleLength(length);
            setIsDone(true);
            onCompleteRef.current?.();
        };

        const startTyping = () => {
            if (cancelled) {
                return;
            }

            if (!normalized) {
                completeAt(0);
                return;
            }

            const prefersReducedMotion = typeof window !== 'undefined'
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion) {
                completeAt(normalized.length);
                return;
            }

            setVisibleLength(0);
            setIsDone(false);
            let index = 0;

            timerId = window.setInterval(() => {
                index += 1;
                setVisibleLength(index);

                if (index >= normalized.length) {
                    window.clearInterval(timerId);
                    setIsDone(true);
                    onCompleteRef.current?.();
                }
            }, charDelayMs);
        };

        const frameId = window.requestAnimationFrame(startTyping);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
            if (timerId) {
                window.clearInterval(timerId);
            }
        };
    }, [text, charDelayMs]);

    const visibleText = (text ?? '').slice(0, visibleLength);

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
