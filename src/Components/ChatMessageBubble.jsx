import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileDown, PlayCircle, User } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage.jsx';
import TypingMessage from './TypingMessage.jsx';
import GeneratingBubble from './GeneratingBubble.jsx';
import CodePreviewModal from './CodePreviewModal.jsx';
import { copyTextToClipboard } from '../lib/copyText.js';
import { extractHtmlFromChat, extractPreviewDocument, guessHtmlFilename } from '../lib/chatHtml.js';
import { downloadGeneratedFile } from '../lib/downloadMedia.js';

/**
 * Chat message row — avatar + bubble + optional action strip below.
 *
 * The layout is aligned around an inline-flex row: assistant messages sit
 * on the left with the brand-mark avatar (using the same PNG as the home
 * logo), user messages sit on the right with a neutral silhouette icon.
 * Copy/preview/download actions live in a small strip *under* the bubble
 * so long messages never fight for space with the action buttons.
 */
export default function ChatMessageBubble({
    message,
    generatingLabel,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    downloadHtmlLabel = 'Download HTML',
    htmlDownloadedLabel = 'HTML saved',
    htmlDownloadFailedLabel = 'Could not download HTML.',
    previewLabel = 'Открыть предпросмотр',
    previewModalLabels,
}) {
    const renderMarkdown = message.role === 'assistant';
    const [isCopied, setIsCopied] = useState(false);
    const [htmlState, setHtmlState] = useState('idle');
    const [previewOpen, setPreviewOpen] = useState(false);
    const canCopy = message.role === 'assistant'
        && !message.isPending
        && !message.isTyping
        && Boolean(String(message.content ?? '').trim());
    const htmlDocument = useMemo(
        () => (canCopy ? extractHtmlFromChat(message.content) : null),
        [canCopy, message.content],
    );
    // A wider preview that also matches standalone css/js and mixed blocks.
    const previewDocument = useMemo(
        () => (canCopy ? extractPreviewDocument(message.content) : null),
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

    const role = message.role === 'assistant' ? 'assistant' : 'user';
    const rowClass = `ai-chat__row ai-chat__row--${role}`;

    const avatar = (
        <div className={`ai-chat__avatar ai-chat__avatar--${role}`} aria-hidden="true">
            {role === 'assistant' ? (
                <img
                    className="ai-chat__avatar-img"
                    src="/brand-mark.png"
                    alt=""
                    draggable={false}
                />
            ) : (
                <User size={14} aria-hidden="true" />
            )}
        </div>
    );

    const actions = canCopy ? (
        <div className="ai-chat__bubble-actions">
            {previewDocument ? (
                <button
                    type="button"
                    className="ai-chat__bubble-copy ai-chat__bubble-copy--preview"
                    onClick={(event) => {
                        event.stopPropagation();
                        setPreviewOpen(true);
                    }}
                    aria-label={previewLabel}
                    title={previewLabel}
                >
                    <PlayCircle size={14} aria-hidden="true" />
                </button>
            ) : null}
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
            <div className={rowClass}>
                {avatar}
                <div className="ai-chat__bubble-stack">
                    <div className={`ai-chat__bubble ai-chat__bubble--${role} ai-chat__bubble--pending`}>
                        <GeneratingBubble label={generatingLabel} />
                    </div>
                </div>
            </div>
        );
    }

    if (message.role === 'assistant' && message.isTyping) {
        return (
            <div className={rowClass}>
                {avatar}
                <div className="ai-chat__bubble-stack">
                    <div className={`ai-chat__bubble ai-chat__bubble--${role} ai-chat__bubble--typing`}>
                        <TypingMessage
                            messageId={message.id}
                            text={message.content ?? ''}
                            typingProgress={message.typingProgress ?? 0}
                            renderMarkdown={renderMarkdown}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={rowClass}>
            {avatar}
            <div className="ai-chat__bubble-stack">
                <div className={`ai-chat__bubble ai-chat__bubble--${role}`}>
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
                {actions}
                <CodePreviewModal
                    open={previewOpen}
                    document={previewDocument}
                    onClose={() => setPreviewOpen(false)}
                    labels={previewModalLabels}
                />
            </div>
        </div>
    );
}
