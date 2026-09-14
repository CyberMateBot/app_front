import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, FileDown, RefreshCw, Smartphone, Monitor, ExternalLink } from 'lucide-react';
import { copyTextToClipboard } from '../lib/copyText.js';
import { downloadGeneratedFile } from '../lib/downloadMedia.js';
import { guessHtmlFilename } from '../lib/chatHtml.js';
import { openExternalLink } from '../lib/homeWidgets.js';

/**
 * Modal that renders a runnable HTML/CSS/JS document produced by the assistant.
 *
 * ## Why this implementation
 *
 * We tried three variants of iframe rendering in Telegram Mini App WebView
 * and they all produced blank white iframes:
 *   1. `<iframe sandbox="allow-scripts" srcDoc={html}>`
 *   2. `<iframe sandbox="allow-scripts" src={blobUrl}>`
 *   3. `<iframe srcDoc={html} onLoad={writeContent}>` (with conditional write)
 *
 * The final trick that actually works everywhere:
 *   - iframe navigates to `about:blank` (rock-solid across every WebView)
 *   - once it fires `onLoad` (which for about:blank fires almost instantly),
 *     we open the iframe's document and `document.write(html)` — this replaces
 *     the entire iframe body with the assistant's HTML unconditionally.
 *   - we don't check "is the body empty first?" because in some WebViews
 *     the body reports non-empty for a blank iframe.
 *   - we don't set `srcDoc` because that competes with the write.
 *   - `injected` ref guards against re-writing on the second onLoad that
 *     `document.close()` triggers.
 *
 * Plus: a permanent "Open in browser" button that pipes the HTML through
 * a blob URL to `openLink` (Telegram) / `window.open` — that always works
 * even if the iframe render fails on some exotic device.
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
        openInBrowserLabel = 'Открыть в браузере',
    } = labels;

    const [tab, setTab] = useState('preview');
    const [device, setDevice] = useState('mobile');
    const [copied, setCopied] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [injectError, setInjectError] = useState('');
    const iframeRef = useRef(null);
    const injectedRef = useRef(false);
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

    // Reset transient state when the modal (re)opens or content changes.
    useEffect(() => {
        if (open) {
            setTab('preview');
            setCopied(false);
            setInjectError('');
            injectedRef.current = false;
            setIframeKey((k) => k + 1);
        }
    }, [open, htmlDocument]);

    // Also reset the "already injected" flag when the tab flips back to
    // "preview" so a fresh iframe write happens on Reload.
    useEffect(() => {
        if (tab === 'preview') {
            injectedRef.current = false;
        }
    }, [tab, iframeKey]);

    /* onLoad handler — fires when about:blank finishes loading. We then
       unconditionally write the assistant's HTML into the iframe. If the
       host WebView blocks contentDocument access (rare but possible), we
       surface a helpful error state instead of a silent white screen. */
    const handleIframeLoad = useCallback(() => {
        if (injectedRef.current || !htmlDocument) return;
        const frame = iframeRef.current;
        if (!frame) return;
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (!doc) {
                setInjectError('Не удалось получить доступ к iframe.');
                return;
            }
            doc.open();
            doc.write(htmlDocument);
            doc.close();
            injectedRef.current = true;
        } catch (err) {
            setInjectError(String(err?.message || err) || 'Ошибка отрисовки предпросмотра.');
        }
    }, [htmlDocument]);

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

    const handleOpenInBrowser = () => {
        try {
            const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            // Give the browser a moment to grab the URL before we revoke it.
            openExternalLink(url);
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch {
            /* silent */
        }
    };

    const handleReload = () => {
        injectedRef.current = false;
        setInjectError('');
        setIframeKey((k) => k + 1);
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
                                    onClick={handleReload}
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
                            onClick={handleOpenInBrowser}
                            aria-label={openInBrowserLabel}
                            title={openInBrowserLabel}
                        >
                            <ExternalLink size={15} aria-hidden="true" />
                        </button>
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
                            <iframe
                                key={iframeKey}
                                ref={iframeRef}
                                className="code-preview__frame"
                                title={title}
                                src="about:blank"
                                onLoad={handleIframeLoad}
                            />
                            {injectError ? (
                                <div className="code-preview__fallback" role="alert">
                                    <p className="code-preview__fallback-text">
                                        {injectError}
                                    </p>
                                    <button
                                        type="button"
                                        className="code-preview__fallback-btn"
                                        onClick={handleOpenInBrowser}
                                    >
                                        <ExternalLink size={14} aria-hidden="true" />
                                        {openInBrowserLabel}
                                    </button>
                                </div>
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
