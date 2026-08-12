import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';
import GeneratingBubble from './GeneratingBubble.jsx';
import { copyTextToClipboard } from '../lib/copyText.js';

export default function ChatMessageBubble({
    message,
    generatingLabel,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
}) {
    const renderMarkdown = message.role === 'assistant';
    const [isCopied, setIsCopied] = useState(false);
    const canCopy = message.role === 'assistant'
        && !message.isPending
        && !message.isTyping
        && Boolean(String(message.content ?? '').trim());

    useEffect(() => {
        if (!isCopied) {
            return undefined;
        }

        const timer = window.setTimeout(() => setIsCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [isCopied]);

    const handleCopy = useCallback(async (event) => {
        event.stopPropagation();

        const copied = await copyTextToClipboard(message.content);

        if (copied) {
            setIsCopied(true);
        }
    }, [message.content]);

    const copyButton = canCopy ? (
        <button
            type="button"
            className={`ai-chat__bubble-copy ${isCopied ? 'ai-chat__bubble-copy--copied' : ''}`}
            onClick={handleCopy}
            aria-label={isCopied ? copiedLabel : copyLabel}
            title={isCopied ? copiedLabel : copyLabel}
        >
            {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
    ) : null;

    if (message.role === 'assistant' && message.isPending) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--pending`}>
                <GeneratingBubble label={generatingLabel} />
            </div>
        );
    }

    if (message.role === 'assistant' && message.isTyping) {
        return (
            <div className={`ai-chat__bubble ai-chat__bubble--${message.role} ai-chat__bubble--typing`}>
                <TypingMessage
                    messageId={message.id}
                    text={message.content ?? ''}
                    typingProgress={message.typingProgress ?? 0}
                    renderMarkdown={renderMarkdown}
                />
            </div>
        );
    }

    return (
        <div className={`ai-chat__bubble ai-chat__bubble--${message.role}`}>
            {copyButton}
            {message.imagePreview ? (
                <img
                    className="ai-chat__bubble-image"
                    src={message.imagePreview}
                    alt=""
                />
            ) : null}
            {renderMarkdown ? (
                <MarkdownMessage content={message.content} />
            ) : (
                <p>{message.content}</p>
            )}
        </div>
    );
}
