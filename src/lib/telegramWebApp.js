import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';

function hasTelegramUser(tg) {
    return Boolean(tg?.initDataUnsafe?.user?.id);
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
