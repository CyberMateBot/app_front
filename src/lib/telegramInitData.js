import { getTelegramWebApp, readLaunchInitData } from './telegramWebApp.js';

/**
 * Shared helper for API modules that need to prove ownership of a
 * telegram id to the backend (subscription, referrals, profile, theme).
 * Kept in its own module (instead of duplicated per-file logic) to avoid a
 * circular import with `api/telegramApi.js`, which itself imports from
 * `api/referrals.js`.
 */
function buildInitDataFromUnsafe(tg) {
    const user = tg?.initDataUnsafe?.user;

    if (!user) {
        return '';
    }

    const params = new URLSearchParams();
    params.set('user', JSON.stringify(user));

    if (tg?.initDataUnsafe?.start_param) {
        params.set('start_param', tg.initDataUnsafe.start_param);
    }

    return params.toString();
}

export function getTelegramInitDataRaw() {
    const tg = getTelegramWebApp();
    let initData = tg?.initData || buildInitDataFromUnsafe(tg);

    if (!initData) {
        initData = readLaunchInitData();
    }

    return String(initData || '').trim();
}

/**
 * Returns headers with `X-Telegram-Init-Data` set when init data is
 * available. Silently omits it otherwise (callers fall back to whatever the
 * backend does for unauthenticated requests, e.g. 401/403) instead of
 * throwing, since some of these calls are used opportunistically (mock mode,
 * pre-registration UI).
 */
export function getTelegramInitDataHeaders(extraHeaders = {}) {
    const initData = getTelegramInitDataRaw();

    if (!initData) {
        return { ...extraHeaders };
    }

    return {
        ...extraHeaders,
        'X-Telegram-Init-Data': initData,
    };
}
