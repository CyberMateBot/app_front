const HTML_FENCE_RE = /```(?:html|htm|xhtml)\s*\r?\n([\s\S]*?)```/gi;
const CSS_FENCE_RE = /```(?:css|scss|less)\s*\r?\n([\s\S]*?)```/gi;
const JS_FENCE_RE = /```(?:js|jsx|javascript|ts|tsx|typescript)\s*\r?\n([\s\S]*?)```/gi;
const GENERIC_FENCE_RE = /```[a-z0-9_+-]*\s*\r?\n([\s\S]*?)```/gi;

function looksLikeHtml(text) {
    const value = String(text || '').trim();
    if (!value) {
        return false;
    }

    if (/<!DOCTYPE\s+html/i.test(value) || /<html[\s>]/i.test(value)) {
        return true;
    }

    const tags = value.match(/<\/?[a-z][\w-]*\b[^>]*>/gi) || [];
    return tags.length >= 3 && /<(div|section|article|body|head|style|h1|h2|nav|main|header|footer|p)\b/i.test(value);
}

function collectFencedBlocks(text, pattern) {
    const blocks = [];
    const source = String(text || '');
    pattern.lastIndex = 0;
    let match = pattern.exec(source);

    while (match) {
        const body = String(match[1] || '').trim();
        if (body) {
            blocks.push(body);
        }
        match = pattern.exec(source);
    }

    return blocks;
}

function pickLargest(blocks) {
    return blocks.reduce((best, current) => (
        current.length > best.length ? current : best
    ), '');
}

export function wrapHtmlDocument(html) {
    const body = String(html || '').trim();
    if (!body) {
        return '';
    }

    if (/<!DOCTYPE\s+html/i.test(body) || /<html[\s>]/i.test(body)) {
        return body;
    }

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CyberMate</title>
</head>
<body>
${body}
</body>
</html>
`;
}

export function extractHtmlFromChat(content) {
    const text = String(content || '');
    if (!text.trim()) {
        return null;
    }

    const htmlFences = collectFencedBlocks(text, HTML_FENCE_RE);
    if (htmlFences.length) {
        return wrapHtmlDocument(pickLargest(htmlFences));
    }

    const genericHtml = collectFencedBlocks(text, GENERIC_FENCE_RE).filter(looksLikeHtml);
    if (genericHtml.length) {
        return wrapHtmlDocument(pickLargest(genericHtml));
    }

    const doctypeIndex = text.search(/<!DOCTYPE\s+html/i);
    const htmlIndex = text.search(/<html[\s>]/i);
    const start = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;
    if (start >= 0) {
        return wrapHtmlDocument(text.slice(start).trim());
    }

    if (looksLikeHtml(text)) {
        return wrapHtmlDocument(text.trim());
    }

    return null;
}

/**
 * Extract a runnable HTML/CSS/JS preview from an assistant message.
 * Priority:
 *   1) Explicit ```html fence — used as-is (wrapped if it's a fragment).
 *   2) Combination of ```css / ```js / ```html fences — merged into a single document.
 *   3) Naked <!DOCTYPE html> / <html> in the text.
 *   4) Standalone ```css or ```js — wrapped in a minimal viewer document.
 * Returns null when no previewable code is found.
 */
export function extractPreviewDocument(content) {
    const text = String(content || '');
    if (!text.trim()) {
        return null;
    }

    const htmlBlocks = collectFencedBlocks(text, HTML_FENCE_RE);
    const cssBlocks = collectFencedBlocks(text, CSS_FENCE_RE);
    const jsBlocks = collectFencedBlocks(text, JS_FENCE_RE);

    if (htmlBlocks.length) {
        const html = pickLargest(htmlBlocks);
        // Merge sibling css/js fences into the same document so the LLM can
        // separate concerns and we still get a runnable preview.
        return injectAssets(wrapHtmlDocument(html), cssBlocks, jsBlocks);
    }

    const genericHtml = collectFencedBlocks(text, GENERIC_FENCE_RE).filter(looksLikeHtml);
    if (genericHtml.length) {
        return injectAssets(wrapHtmlDocument(pickLargest(genericHtml)), cssBlocks, jsBlocks);
    }

    const doctypeIndex = text.search(/<!DOCTYPE\s+html/i);
    const htmlIndex = text.search(/<html[\s>]/i);
    const start = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;
    if (start >= 0) {
        return injectAssets(wrapHtmlDocument(text.slice(start).trim()), cssBlocks, jsBlocks);
    }

    if (looksLikeHtml(text)) {
        return injectAssets(wrapHtmlDocument(text.trim()), cssBlocks, jsBlocks);
    }

    // No HTML — but we still may have standalone CSS or JS. Wrap them in a
    // minimal viewer so the user can visually confirm what the model produced.
    if (cssBlocks.length || jsBlocks.length) {
        const styles = cssBlocks.join('\n\n');
        const scripts = jsBlocks.join('\n\n');
        return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CyberMate preview</title>
<style>
${styles || '/* no styles */'}
</style>
</head>
<body>
<div id="app"></div>
<script>
${scripts || '// no script'}
</script>
</body>
</html>
`;
    }

    return null;
}

function injectAssets(html, cssBlocks, jsBlocks) {
    let out = String(html || '');
    if (cssBlocks && cssBlocks.length) {
        const styleTag = `<style>\n${cssBlocks.join('\n\n')}\n</style>`;
        if (/<\/head>/i.test(out)) {
            out = out.replace(/<\/head>/i, `${styleTag}\n</head>`);
        } else {
            out = `${styleTag}\n${out}`;
        }
    }
    if (jsBlocks && jsBlocks.length) {
        const scriptTag = `<script>\n${jsBlocks.join('\n\n')}\n</script>`;
        if (/<\/body>/i.test(out)) {
            out = out.replace(/<\/body>/i, `${scriptTag}\n</body>`);
        } else {
            out = `${out}\n${scriptTag}`;
        }
    }
    return out;
}

export function guessHtmlFilename(html) {
    const title = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        ?.replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const heading = String(html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        ?.replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const raw = (title || heading || 'cybermate-page')
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);

    return `${raw || 'cybermate-page'}.html`;
}
