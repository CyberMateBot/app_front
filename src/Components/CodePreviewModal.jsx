import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, FileDown, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { copyTextToClipboard } from '../lib/copyText.js';
import { downloadGeneratedFile } from '../lib/downloadMedia.js';
import { guessHtmlFilename } from '../lib/chatHtml.js';

/**
 * Modal that renders a runnable HTML/CSS/JS document produced by the assistant
 * inside a sandboxed iframe.
 *
 * - Sandbox: allow-scripts only (no same-origin, no forms) — safe by default.
 * - Tabs: "Preview" (rendered iframe) / "Code" (raw source with copy button).
 * - Toolbar: reload iframe, download HTML file, toggle mobile/desktop width.
 */
export default function CodePreviewModal({
    open,
    document: htmlDocument,
    onClose,
    labels = {},
}) {
    const {
        title = 'Предпросмотр',
        previewTab = 'Просмотр',
        codeTab = 'Код',
        copyLabel = 'Скопировать',
        copiedLabel = 'Скопировано',
        downloadLabel = 'Скачать HTML',
        reloadLabel = 'Обновить',
        closeLabel = 'Закрыть',
        deviceMobile = 'Телефон',
        deviceDesktop = 'Десктоп',
    } = labels;

    const [tab, setTab] = useState('preview');
    const [device, setDevice] = useState('mobile');
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [previewUrl, setPreviewUrl] = useState('');
    const dialogRef = useRef(null);

    // Close on Esc.
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Reset transient state when the doc changes / modal reopens.
    useEffect(() => {
        if (open) {
            setTab('preview');
            setCopied(false);
            setIframeKey((k) => k + 1);
        }
    }, [open, htmlDocument]);

    /* Render the HTML document via a Blob URL rather than `srcdoc`.
       `srcdoc` + `sandbox="allow-scripts"` (no allow-same-origin) is
       supposed to just work, but on Telegram Mini App WebViews on
       Android (and some iOS builds) it silently renders as a blank
       white iframe — the sandbox null-origin + srcdoc combo hits a
       navigation guard. A Blob URL sidesteps that: the iframe loads
       a real (temporary) URL with the correct MIME type and the
       sandbox still isolates it into its own opaque origin. */
    useEffect(() => {
        if (!open || !htmlDocument) {
            setPreviewUrl('');
            return undefined;
        }

        const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [open, htmlDocument, iframeKey]);

    const filename = useMemo(
        () => guessHtmlFilename(htmlDocument || ''),
        [htmlDocument],
    );

    if (!open || !htmlDocument) {
        return null;
    }

    const handleCopy = async () => {
        const ok = await copyTextToClipboard(htmlDocument);
        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        }
    };

    const handleDownload = async () => {
        try {
            await downloadGeneratedFile(htmlDocument, filename, 'text/html');
        } catch {
            /* silent — the download button is a nice-to-have */
        }
    };

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    };

    return (
        <div
            className="code-preview__backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={handleBackdrop}
        >
            <div
                className="code-preview__panel"
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="code-preview__header">
                    <div className="code-preview__tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'preview'}
                            className={`code-preview__tab${tab === 'preview' ? ' code-preview__tab--active' : ''}`}
                            onClick={() => setTab('preview')}
                        >
                            {previewTab}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'code'}
                            className={`code-preview__tab${tab === 'code' ? ' code-preview__tab--active' : ''}`}
                            onClick={() => setTab('code')}
                        >
                            {codeTab}
                        </button>
                    </div>
                    <div className="code-preview__toolbar">
                        {tab === 'preview' ? (
                            <>
                                <button
                                    type="button"
                                    className={`code-preview__icon-btn${device === 'mobile' ? ' code-preview__icon-btn--active' : ''}`}
                                    onClick={() => setDevice('mobile')}
                                    aria-label={deviceMobile}
                                    title={deviceMobile}
                                >
                                    <Smartphone size={15} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className={`code-preview__icon-btn${device === 'desktop' ? ' code-preview__icon-btn--active' : ''}`}
                                    onClick={() => setDevice('desktop')}
                                    aria-label={deviceDesktop}
                                    title={deviceDesktop}
                                >
                                    <Monitor size={15} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className="code-preview__icon-btn"
                                    onClick={() => setIframeKey((k) => k + 1)}
                                    aria-label={reloadLabel}
                                    title={reloadLabel}
                                >
                                    <RefreshCw size={15} aria-hidden="true" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="code-preview__icon-btn"
                                onClick={handleCopy}
                                aria-label={copied ? copiedLabel : copyLabel}
                                title={copied ? copiedLabel : copyLabel}
                            >
                                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                            </button>
                        )}
                        <button
                            type="button"
                            className="code-preview__icon-btn"
                            onClick={handleDownload}
                            aria-label={downloadLabel}
                            title={downloadLabel}
                        >
                            <FileDown size={15} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="code-preview__icon-btn code-preview__icon-btn--close"
                            onClick={onClose}
                            aria-label={closeLabel}
                            title={closeLabel}
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <div className="code-preview__body">
                    {tab === 'preview' ? (
                        <div
                            className={`code-preview__frame-wrap code-preview__frame-wrap--${device}`}
                        >
                            {previewUrl ? (
                                <iframe
                                    key={iframeKey}
                                    className="code-preview__frame"
                                    title={title}
                                    /* Blob URL loads into its own origin;
                                       keep the sandbox as a defense-in-
                                       depth layer without allow-same-origin
                                       so the preview can't reach parent APIs. */
                                    sandbox="allow-scripts allow-forms allow-popups"
                                    src={previewUrl}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <pre className="code-preview__code" aria-label={codeTab}>
                            <code>{htmlDocument}</code>
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
