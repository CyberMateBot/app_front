/**
 * Whether `url` is safe to hand to `window.open` / `Telegram.WebApp.openLink`
 * or to use as a link `href`. Only `http:`/`https:` are allowed — this
 * blocks `javascript:`, `data:`, `vbscript:`, and similar schemes that could
 * execute code if a user (or an AI response, or a compromised API response)
 * ever supplies a crafted URL that ends up opened or clicked.
 *
 * Protocol-relative (`//host/...`) and root-relative (`/path`) URLs are
 * treated as safe (resolved against the current origin).
 */
export function isSafeExternalUrl(url) {
    const value = String(url ?? '').trim();
    if (!value) {
        return false;
    }

    // Root-relative or protocol-relative URLs inherit the page's own scheme.
    if (value.startsWith('/') || value.startsWith('#')) {
        return true;
    }

    try {
        const parsed = new URL(value, window.location.origin);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}
