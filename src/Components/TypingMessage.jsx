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

    onCompleteRef.current = onComplete;

    useEffect(() => {
        if (!text) {
            setVisibleLength(0);
            setIsDone(true);
            onCompleteRef.current?.();
            return undefined;
        }

        const prefersReducedMotion = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setVisibleLength(text.length);
            setIsDone(true);
            onCompleteRef.current?.();
            return undefined;
        }

        setVisibleLength(0);
        setIsDone(false);
        let index = 0;

        const timerId = window.setInterval(() => {
            index += 1;
            setVisibleLength(index);

            if (index >= text.length) {
                window.clearInterval(timerId);
                setIsDone(true);
                onCompleteRef.current?.();
            }
        }, charDelayMs);

        return () => {
            window.clearInterval(timerId);
        };
    }, [text, charDelayMs]);

    const visibleText = text.slice(0, visibleLength);

    if (renderMarkdown && isDone) {
        return <MarkdownMessage content={text} />;
    }

    return (
        <p>
            {visibleText}
            {!isDone ? <span className="ai-chat__typing-cursor" aria-hidden="true">|</span> : null}
        </p>
    );
}
