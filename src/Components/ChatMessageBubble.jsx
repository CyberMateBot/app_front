import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileDown } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';
import GeneratingBubble from './GeneratingBubble.jsx';
import { copyTextToClipboard } from '../lib/copyText.js';
import { extractHtmlFromChat, guessHtmlFilename } from '../lib/chatHtml.js';
import { downloadGeneratedFile } from '../lib/downloadMedia.js';

export default function ChatMessageBubble({
    message,
    generatingLabel,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    downloadHtmlLabel = 'Download HTML',
    htmlDownloadedLabel = 'HTML saved',
    htmlDownloadFailedLabel = 'Could not download HTML.',
}) {
    const renderMarkdown = message.role === 'assistant';
    const [isCopied, setIsCopied] = useState(false);
    const [htmlState, setHtmlState] = useState('idle');
    const canCopy = message.role === 'assistant'
        && !message.isPending
        && !message.isTyping
        && Boolean(String(message.content ?? '').trim());
    const htmlDocument = useMemo(
        () => (canCopy ? extractHtmlFromChat(message.content) : null),
        [canCopy, message.content],
    );

    useEffect(() => {
        if (!isCopied) {
            return undefined;
        }

        const timer = window.setTimeout(() => setIsCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [isCopied]);

    useEffect(() => {
        if (htmlState !== 'done') {
            return undefined;
        }

        const timer = window.setTimeout(() => setHtmlState('idle'), 2000);
        return () => window.clearTimeout(timer);
    }, [htmlState]);

    const handleCopy = useCallback(async (event) => {
        event.stopPropagation();

        const copied = await copyTextToClipboard(message.content);

        if (copied) {
            setIsCopied(true);
        }
    }, [message.content]);

    const handleDownloadHtml = useCallback(async (event) => {
        event.stopPropagation();
        if (!htmlDocument) {
            return;
        }

        setHtmlState('saving');
        try {
            await downloadGeneratedFile(htmlDocument, guessHtmlFilename(htmlDocument), 'text/html');
            setHtmlState('done');
        } catch {
            setHtmlState('error');
        }
    }, [htmlDocument]);

    const actions = canCopy ? (
        <div className="ai-chat__bubble-actions">
            {htmlDocument ? (
                <button
                    type="button"
                    className={`ai-chat__bubble-copy${htmlState === 'done' ? ' ai-chat__bubble-copy--copied' : ''}${htmlState === 'error' ? ' ai-chat__bubble-copy--error' : ''}`}
                    onClick={handleDownloadHtml}
                    disabled={htmlState === 'saving'}
                    aria-label={htmlState === 'done' ? htmlDownloadedLabel : downloadHtmlLabel}
                    title={htmlState === 'error' ? htmlDownloadFailedLabel : (htmlState === 'done' ? htmlDownloadedLabel : downloadHtmlLabel)}
                >
                    {htmlState === 'done' ? <Check size={14} aria-hidden="true" /> : <FileDown size={14} aria-hidden="true" />}
                </button>
            ) : null}
            <button
                type="button"
                className={`ai-chat__bubble-copy ${isCopied ? 'ai-chat__bubble-copy--copied' : ''}`}
                onClick={handleCopy}
                aria-label={isCopied ? copiedLabel : copyLabel}
                title={isCopied ? copiedLabel : copyLabel}
            >
                {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
        </div>
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
            {actions}
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
