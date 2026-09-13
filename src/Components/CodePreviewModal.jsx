import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, FileDown, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { copyTextToClipboard } from '../lib/copyText.js';
import { downloadGeneratedFile } from '../lib/downloadMedia.js';
import { guessHtmlFilename } from '../lib/chatHtml.js';

/**
 * Modal that renders a runnable HTML/CSS/JS document produced by the assistant
 * inside an iframe.
 *
 * ## History of "why does it render blank"
 *
 * 1. First attempt: `<iframe sandbox="allow-scripts" srcDoc={html}>`.
 *    → In the Telegram Android WebView (and some in-app browsers) this
 *    combination silently renders a blank white iframe. The sandbox
 *    null-origin + srcdoc navigation gets swallowed by an internal
 *    navigation guard.
 * 2. Second attempt: same sandbox, but `src` set to a `blob:` URL.
 *    → Also blank in the same WebView — blob URLs on sandboxed iframes
 *    hit a similar limitation and additionally introduce URL-revocation
 *    race conditions with React strict-mode double-effects.
 *
 * Solution used here (Sep 2026):
 *  - No `sandbox` restriction (see security note below).
 *  - `srcDoc` populated declaratively AND, once the iframe mounts,
 *    we also write the document via `contentWindow.document.write` as
 *    a belt-and-suspenders fallback. Whichever loads first wins.
 *  - Reload button bumps `iframeKey` to force a full remount.
 *
 * Security tradeoff: without sandbox, HTML/JS the assistant produced
 * could theoretically reach `window.parent`. But the preview is only
 * opened on demand from the user's own AI response, we don't expose
 * secrets as globals in the parent (Telegram initData is server-side),
 * and any navigation attempt would be user-visible. The alternative
 * ("safer but blank preview") isn't safer — it just hides the code
 * from the user entirely.
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
    const iframeRef = useRef(null);
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

    /* Belt-and-suspenders: also write the document into the iframe via
       `contentWindow.document.write`. This runs *after* srcDoc has had
       a chance to load; whichever populates the iframe body first wins.
       On WebViews that silently ignore srcDoc, the direct write kicks in
       and the preview actually shows up. */
    const populateIframe = useCallback(() => {
        if (tab !== 'preview' || !htmlDocument) return;
        const frame = iframeRef.current;
        if (!frame) return;
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (!doc) return;
            // Only rewrite if the iframe body looks empty (srcDoc hasn't
            // loaded, or the WebView blanked it).
            const isEmpty = !doc.body
                || !doc.body.innerHTML
                || doc.body.innerHTML.trim() === ''
                || doc.body.innerHTML.trim() === '<!--empty-->';
            if (!isEmpty) return;
            doc.open();
            doc.write(htmlDocument);
            doc.close();
        } catch {
            /* Cross-origin or WebView threw — nothing we can do; the
               srcDoc render should already be showing what it can. */
        }
    }, [tab, htmlDocument]);

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
                            <iframe
                                key={iframeKey}
                                ref={iframeRef}
                                className="code-preview__frame"
                                title={title}
                                srcDoc={htmlDocument}
                                onLoad={populateIframe}
                            />
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
