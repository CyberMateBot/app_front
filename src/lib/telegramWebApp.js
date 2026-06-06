import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';
import { applyUiScale } from './uiScale.js';

function hasTelegramUser(tg) {
    return Boolean(tg?.initDataUnsafe?.user?.id);
}

/** True when WebApp has initData or user (real Telegram session). */
function hasValidTelegramSession(tg) {
    if (!tg) {
        return false;
    }
    hydrateTelegramUser(tg);
    return hasTelegramUser(tg) || Boolean(String(tg.initData ?? '').trim());
}

/** Returns numeric Telegram user id from WebApp or initData string. */
export function resolveTelegramUserId(tg) {
    if (!tg) {
        return null;
    }
    hydrateTelegramUser(tg);
    if (tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id;
    }
    const user = parseUserFromInitData(tg.initData);
    return user?.id ?? null;
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

/** Reads tgWebAppData from launch URL (Telegram Desktop / deep links). */
export function readLaunchInitData() {
    if (typeof window === 'undefined') {
        return '';
    }

    const search = new URLSearchParams(window.location.search);
    const fromSearch = search.get('tgWebAppData');

    if (fromSearch) {
        return fromSearch;
    }

    const hash = window.location.hash.replace(/^#/, '');

    if (!hash) {
        return '';
    }

    const hashParams = new URLSearchParams(hash);

    return hashParams.get('tgWebAppData') || '';
}

function applyLaunchParamsToWebApp(tg) {
    if (!tg) {
        return tg;
    }

    if (!tg.initData) {
        const launchInitData = readLaunchInitData();

        if (launchInitData) {
            tg.initData = launchInitData;
        }
    }

    return hydrateTelegramUser(tg);
}

/** Desktop/WebView sometimes exposes initData before initDataUnsafe.user. */
export function hydrateTelegramUser(tg) {
    if (!tg) {
        return tg;
    }

    if (!tg.initData) {
        const launchInitData = readLaunchInitData();

        if (launchInitData) {
            tg.initData = launchInitData;
        }
    }

    if (hasTelegramUser(tg)) {
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
        colorScheme: 'dark',
        ready: () => {},
        expand: () => {},
        disableVerticalSwipes: () => {},
        setHeaderColor: () => {},
        setBackgroundColor: () => {},
        initData: buildMockInitData(user, startParam),
        initDataUnsafe: {
            user,
            start_param: startParam,
        },
    };
}

function getNativeTelegramWebApp() {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.Telegram?.WebApp ?? null;
}

export function isTelegramClientPresent() {
    return Boolean(getNativeTelegramWebApp()) || Boolean(readLaunchInitData());
}

/** Shows a native Telegram alert when available (Mini App). */
export function showTelegramAlert(message) {
    const tg = getTelegramWebApp();

    if (typeof tg?.showAlert === 'function') {
        tg.showAlert(String(message));
        return true;
    }

    if (typeof tg?.showPopup === 'function') {
        tg.showPopup({ message: String(message) });
        return true;
    }

    return false;
}

export function getTelegramWebApp() {
    const native = getNativeTelegramWebApp();

    if (native && hasValidTelegramSession(native)) {
        return applyLaunchParamsToWebApp(native);
    }

    if (ENABLE_TELEGRAM_MOCK) {
        return createBrowserMock();
    }

    const launchInitData = readLaunchInitData();

    if (launchInitData) {
        return applyLaunchParamsToWebApp({
            platform: 'browser',
            ready: () => {},
            expand: () => {},
            initData: launchInitData,
            initDataUnsafe: {},
        });
    }

    if (native) {
        return applyLaunchParamsToWebApp(native);
    }

    return null;
}

function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

/**
 * Waits for telegram-web-app.js (race on Telegram Desktop) then resolves WebApp/mock.
 */
export function waitForTelegramWebApp({ timeoutMs = 12000, intervalMs = 50 } = {}) {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const startedAt = Date.now();

        const tick = async () => {
            const tg = getTelegramWebApp();

            if (tg && (hasTelegramUser(tg) || tg.initData)) {
                resolve(applyLaunchParamsToWebApp(tg));
                return;
            }

            if (ENABLE_TELEGRAM_MOCK && Date.now() - startedAt > 150) {
                resolve(createBrowserMock());
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
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    const height = tg?.viewportStableHeight || tg?.viewportHeight;

    if (height) {
        root.style.setProperty('--app-height', `${height}px`);
    }

    const inset = tg?.safeAreaInset ?? tg?.contentSafeAreaInset;

    if (inset) {
        root.style.setProperty('--page-pad-top', `${inset.top ?? 0}px`);
        root.style.setProperty('--page-pad-bottom', `${inset.bottom ?? 0}px`);
    }
}

export function initTelegramMiniApp() {
    const tg = getTelegramWebApp();

    tg?.ready?.();
    tg?.expand?.();
    tg?.disableVerticalSwipes?.();
    applyTelegramLayoutVars(tg);
    applyUiScale(tg);

    tg?.onEvent?.('viewportChanged', () => {
        applyTelegramLayoutVars(tg);
        applyUiScale(tg);
    });
    tg?.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));

    return applyLaunchParamsToWebApp(tg);
}

export async function initTelegramMiniAppAsync(options = {}) {
    let tg = await waitForTelegramWebApp(options);

    if (!tg) {
        return null;
    }

    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();

    if (!hasTelegramUser(tg) && typeof tg.onEvent === 'function') {
        await new Promise((resolve) => {
            let settled = false;
            const done = () => {
                if (!settled) {
                    settled = true;
                    resolve();
                }
            };

            tg.onEvent('ready', done);
            window.setTimeout(done, 600);
        });
        tg = applyLaunchParamsToWebApp(tg);
    }

    if (!hasTelegramUser(tg)) {
        await wait(250);
        tg = applyLaunchParamsToWebApp(tg);
    }

    applyTelegramLayoutVars(tg);
    applyUiScale(tg);

    tg.onEvent?.('viewportChanged', () => {
        applyTelegramLayoutVars(tg);
        applyUiScale(tg);
    });
    tg.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));

    return applyLaunchParamsToWebApp(tg);
}
