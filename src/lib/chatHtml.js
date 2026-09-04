const HTML_FENCE_RE = /```(?:html|htm|xhtml)\s*\r?\n([\s\S]*?)```/gi;
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
