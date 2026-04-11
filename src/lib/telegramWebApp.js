import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';

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

    if (window.Telegram?.WebApp) {
        return window.Telegram.WebApp;
    }

    return ENABLE_TELEGRAM_MOCK ? createBrowserMock() : null;
}

export function initTelegramMiniApp() {
    const tg = getTelegramWebApp();

    tg?.ready();
    tg?.expand();
    tg?.disableVerticalSwipes?.();

    return tg;
}
