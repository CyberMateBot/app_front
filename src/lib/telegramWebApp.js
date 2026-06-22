import { ENABLE_TELEGRAM_MOCK } from '../config/env.js';
import { applyUiScale } from './uiScale.js';

const DESKTOP_PLATFORMS = new Set(['tdesktop', 'macos', 'web', 'weba', 'unigram']);
const MINI_PC_MAX_WIDTH = 520;

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

/** Launch params from URL hash (#tgWebAppData=...&tgWebAppPlatform=...). */
export function readLaunchParams() {
    if (typeof window === 'undefined') {
        return new URLSearchParams();
    }

    const hash = window.location.hash.replace(/^#/, '');

    if (!hash) {
        return new URLSearchParams();
    }

    return new URLSearchParams(hash);
}

export function readLaunchParam(name) {
    return readLaunchParams().get(name) ?? '';
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

    return readLaunchParams().get('tgWebAppData') || '';
}

export function isDesktopTelegramPlatform(tg) {
    const platform = String(tg?.platform ?? readLaunchParam('tgWebAppPlatform') ?? '').toLowerCase();
    return DESKTOP_PLATFORMS.has(platform);
}

/** True when the mini app runs inside Telegram Desktop external shell (chat list launch). */
export function isTelegramIframe() {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.parent !== window;
    } catch {
        return true;
    }
}

export function getTelegramViewportWidth(tg) {
    const tgWidth = Number(tg?.viewportStableWidth || tg?.viewportWidth);
    if (Number.isFinite(tgWidth) && tgWidth > 0) {
        return tgWidth;
    }

    if (typeof window !== 'undefined' && window.innerWidth > 0) {
        return window.innerWidth;
    }

    return 0;
}

/**
 * mobile — phone clients
 * mini-pc — Telegram Desktop embedded in bot chat (phone-sized panel)
 * desktop-full — Telegram Desktop from chat list / wide window (browser-like)
 */
export function resolveTelegramLayoutMode(tg) {
    if (!isDesktopTelegramPlatform(tg)) {
        return 'mobile';
    }

    if (isTelegramIframe()) {
        return 'desktop-full';
    }

    const width = getTelegramViewportWidth(tg);
    if (width > 0 && width <= MINI_PC_MAX_WIDTH) {
        return 'mini-pc';
    }

    return 'desktop-full';
}

function applyTelegramLayoutMode(tg) {
    if (typeof document === 'undefined') {
        return resolveTelegramLayoutMode(tg);
    }

    const mode = resolveTelegramLayoutMode(tg);
    document.documentElement.dataset.tgLayout = mode;
    return mode;
}

function requestDesktopFullscreen(tg) {
    if (!tg || resolveTelegramLayoutMode(tg) !== 'desktop-full') {
        return;
    }

    tg.expand?.();

    if (tg.isFullscreen) {
        return;
    }

    if (typeof tg.requestFullscreen !== 'function') {
        return;
    }

    try {
        tg.requestFullscreen();
    } catch {
        // Telegram client may reject fullscreen in unsupported contexts.
    }
}

function scheduleDesktopFullscreen(tg) {
    requestDesktopFullscreen(tg);

    if (typeof window === 'undefined' || resolveTelegramLayoutMode(tg) !== 'desktop-full') {
        return;
    }

    window.setTimeout(() => requestDesktopFullscreen(tg), 120);
    window.setTimeout(() => requestDesktopFullscreen(tg), 600);
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

    const viewportHeight = typeof window !== 'undefined' && window.innerHeight > 0
        ? window.innerHeight
        : 800;
    const viewportWidth = typeof window !== 'undefined' && window.innerWidth > 0
        ? window.innerWidth
        : 390;

    return {
        platform: 'mock',
        colorScheme: 'dark',
        viewportHeight,
        viewportStableHeight: viewportHeight,
        viewportWidth,
        viewportStableWidth: viewportWidth,
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
    const rawHeight = tg?.viewportStableHeight || tg?.viewportHeight;
    const tgHeight = Number(rawHeight);
    const windowHeight = typeof window !== 'undefined' ? Number(window.innerHeight) : 0;
    const height = (
        Number.isFinite(tgHeight) && tgHeight > 0
            ? tgHeight
            : (Number.isFinite(windowHeight) && windowHeight > 0 ? windowHeight : 0)
    );

    if (height > 0) {
        root.style.setProperty('--app-height', `${height}px`);
    } else {
        root.style.removeProperty('--app-height');
    }

    const inset = tg?.safeAreaInset ?? tg?.contentSafeAreaInset;

    if (inset) {
        root.style.setProperty('--page-pad-top', `${inset.top ?? 0}px`);
        root.style.setProperty('--page-pad-bottom', `${inset.bottom ?? 0}px`);
    }
}

function syncTelegramViewport(tg) {
    applyTelegramLayoutVars(tg);
    applyTelegramLayoutMode(tg);
    applyUiScale(tg);
}

export function initTelegramMiniApp() {
    const tg = getTelegramWebApp();

    tg?.ready?.();
    tg?.expand?.();
    tg?.disableVerticalSwipes?.();
    syncTelegramViewport(tg);
    scheduleDesktopFullscreen(tg);

    tg?.onEvent?.('viewportChanged', () => {
        syncTelegramViewport(tg);
    });
    tg?.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));
    tg?.onEvent?.('fullscreenChanged', () => {
        syncTelegramViewport(tg);
    });

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

    syncTelegramViewport(tg);
    scheduleDesktopFullscreen(tg);

    tg.onEvent?.('viewportChanged', () => {
        syncTelegramViewport(tg);
    });
    tg.onEvent?.('safeAreaChanged', () => applyTelegramLayoutVars(tg));
    tg.onEvent?.('fullscreenChanged', () => {
        syncTelegramViewport(tg);
    });

    return applyLaunchParamsToWebApp(tg);
}
