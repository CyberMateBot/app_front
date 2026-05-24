function readEnvFlag(name, fallback) {
    const raw = import.meta.env[name];

    if (raw === undefined || raw === '') {
        return fallback;
    }

    return String(raw).toLowerCase() === 'true';
}

/**
 * Vite bakes VITE_* at build time. Must be absolute URL with scheme, e.g.
 * https://tgapp-production-469a.up.railway.app
 */
function normalizeApiBaseUrl(raw) {
    if (raw === undefined || raw === null) {
        return '';
    }

    let value = String(raw).trim();
    if (!value) {
        return '';
    }

    // Railway UI sometimes copies URL without scheme — breaks new URL() in Safari/Telegram WebView.
    if (!/^https?:\/\//i.test(value)) {
        value = `https://${value}`;
    }

    try {
        const parsed = new URL(value);
        return parsed.origin;
    } catch {
        console.error('[CyberMate] Invalid VITE_API_BASE_URL (fix in Railway → Redeploy):', raw);
        return '';
    }
}

const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
const normalizedBase = normalizeApiBaseUrl(configuredApiBase);

export const API_BASE_URL = (
    configuredApiBase === undefined
        ? (import.meta.env.DEV ? '' : '')
        : normalizedBase
);

export const API_BASE_URL_MISCONFIGURED = Boolean(
    import.meta.env.PROD
    && configuredApiBase !== undefined
    && String(configuredApiBase).trim() !== ''
    && !normalizedBase,
);

export const API_BASE_URL_MISSING_IN_PROD = Boolean(
    import.meta.env.PROD && !API_BASE_URL,
);

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'CyberMate';
export const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? 'CyberMateBot';

/** В dev по умолчанию true — иначе в Chrome без Telegram user запросы не уходят. */
export const ENABLE_TELEGRAM_MOCK = readEnvFlag('VITE_ENABLE_TELEGRAM_MOCK', import.meta.env.DEV);
