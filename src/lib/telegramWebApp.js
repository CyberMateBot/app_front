import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';

function hasTelegramUser(tg) {
    return Boolean(tg?.initDataUnsafe?.user?.id);
}

function parseUserFromInitData(initData) {
    if (!initData || typeof initData !== 'string') {
        return null;
    }

    try {
        const params = new URLSearchParams(initData);
        const rawUser = params.get('user');

        if (!rawUser) {
            return null;
        }

        const user = JSON.parse(rawUser);

        return user?.id ? user : null;
    } catch {
        return null;
    }
}

/** Desktop/WebView sometimes exposes initData before initDataUnsafe.user. */
export function hydrateTelegramUser(tg) {
    if (!tg || hasTelegramUser(tg)) {
        return tg;
    }

    const user = parseUserFromInitData(tg.initData);

    if (!user) {
        return tg;
    }

    if (!tg.initDataUnsafe) {
        tg.initDataUnsafe = {};
    }

    tg.initDataUnsafe.user = user;

    if (!tg.initDataUnsafe.start_param) {
        const params = new URLSearchParams(tg.initData);
        const startParam = params.get('start_param');

        if (startParam) {
            tg.initDataUnsafe.start_param = startParam;
        }
    }

    return tg;
}

function buildMockInitData(user, startParam) {
    const params = new URLSearchParams();

    params.set('user', JSON.stringify(user));

    if (startParam) {
        params.set('start_param', startParam);
    }

    return params.toString();
}

function createBrowserMock() {
    const user = {
        id: 777000,
        first_name: 'Dev_User',
        last_name: '',
        username: 'Dev_User',
        photo_url: '',
        language_code: 'ru',
    };
    const startParam = 'dev-preview';

    return {
        platform: 'mock',
        ready: () => {},
        expand: () => {},
        disableVerticalSwipes: () => {},
        initData: buildMockInitData(user, startParam),
        initDataUnsafe: {
            user,
            start_param: startParam,
        },
    };
}

export function getTelegramWebApp() {
    if (typeof window === 'undefined') {
        return null;
    }

    const telegramWebApp = window.Telegram?.WebApp ?? null;

    if (telegramWebApp) {
        hydrateTelegramUser(telegramWebApp);
    }

    const shouldUseMock = ENABLE_TELEGRAM_MOCK
        || (import.meta.env.DEV && telegramWebApp && !hasTelegramUser(telegramWebApp));

    if (telegramWebApp && hasTelegramUser(telegramWebApp) && !ENABLE_TELEGRAM_MOCK) {
        return telegramWebApp;
    }

    if (shouldUseMock) {
        return createBrowserMock();
    }

    return telegramWebApp;
}

/**
 * Waits for telegram-web-app.js (race on Telegram Desktop) then resolves WebApp/mock.
 */
export function waitForTelegramWebApp({ timeoutMs = 5000, intervalMs = 50 } = {}) {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const startedAt = Date.now();

        const tick = () => {
            const tg = getTelegramWebApp();

            if (tg && (hasTelegramUser(tg) || tg.initData || ENABLE_TELEGRAM_MOCK)) {
                resolve(hydrateTelegramUser(tg));
                return;
            }

            if (Date.now() - startedAt >= timeoutMs) {
                resolve(getTelegramWebApp());
                return;
            }

            window.setTimeout(tick, intervalMs);
        };

        tick();
    });
}

function applyTelegramLayoutVars(tg) {
    if (typeof document === 'undefined' || !tg) {
        return;
    }

    const root = document.documentElement;
    const height = tg.viewportStableHeight || tg.viewportHeight;

    if (height) {
        root.style.setProperty('--app-height', `${height}px`);
    }

    const inset = tg.safeAreaInset ?? tg.contentSafeAreaInset;

    if (inset) {
        root.style.setProperty('--page-pad-top', `${inset.top ?? 0}px`);
        root.style.setProperty('--page-pad-bottom', `${inset.bottom ?? 0}px`);
    }
}

export function initTelegramMiniApp() {
    const tg = getTelegramWebApp();

    tg?.ready();
    tg?.expand();
    tg?.disableVerticalSwipes?.();
    applyTelegramLayoutVars(tg);

    tg?.onEvent?.('viewportChanged', () => applyTelegramLayoutVars(tg));
    tg?.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));

    return tg;
}

export async function initTelegramMiniAppAsync(options) {
    const tg = await waitForTelegramWebApp(options);

    if (!tg) {
        return null;
    }

    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    applyTelegramLayoutVars(tg);

    tg.onEvent?.('viewportChanged', () => applyTelegramLayoutVars(tg));
    tg.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));

    return hydrateTelegramUser(tg);
}
