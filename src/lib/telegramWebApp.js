import { ENABLE_TELEGRAM_MOCK, BOT_USERNAME } from '../config/env.js';
import { applyUiScale } from './uiScale.js';

const DESKTOP_PLATFORMS = new Set(['tdesktop', 'macos', 'web', 'weba', 'unigram']);
const EMBEDDED_CHAT_MAX_WIDTH = 560;
const EMBEDDED_CHAT_MAX_HEIGHT = 900;
const LAUNCH_HASH_STORAGE_KEY = 'cybermate.tg_launch_hash';
const FULLSCREEN_RELAUNCH_KEY = 'cybermate.tg_fullscreen_relaunch_attempted';
const EXPAND_DISMISS_KEY = 'cybermate.tg_expand_dismissed';

const layoutListeners = new Set();
let desktopFullscreenUnsupported = false;
let desktopEventBridgeInstalled = false;

const DESKTOP_PARENT_ORIGINS = [
    'https://web.telegram.org',
    'https://webk.telegram.org',
    'https://weba.telegram.org',
];

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

    persistLaunchHash();

    const hash = window.location.hash.replace(/^#/, '');
    const stored = sessionStorage.getItem(LAUNCH_HASH_STORAGE_KEY) ?? '';

    if (hash) {
        return new URLSearchParams(hash);
    }

    if (stored) {
        return new URLSearchParams(stored);
    }

    return new URLSearchParams();
}

function persistLaunchHash() {
    if (typeof window === 'undefined') {
        return;
    }

    const hash = window.location.hash.replace(/^#/, '');
    if (hash && hash.includes('tgWebApp')) {
        try {
            sessionStorage.setItem(LAUNCH_HASH_STORAGE_KEY, hash);
        } catch {
            // Ignore storage errors in private mode.
        }
    }
}

export function readLaunchParam(name) {
    return readLaunchParams().get(name) ?? '';
}

/** True when Telegram launched the Mini App already in fullscreen (Main Mini App / mode=fullscreen). */
export function readLaunchFullscreenFlag() {
    const value = String(readLaunchParam('tgWebAppFullscreen') ?? '').toLowerCase();
    return value === '1' || value === 'true';
}

/** True when launch URL requested compact mode (half-height panel). */
export function readLaunchCompactFlag() {
    const mode = String(readLaunchParam('tgWebAppMode') ?? readLaunchParam('mode') ?? '').toLowerCase();
    return mode === 'compact';
}

/** True when Desktop fullscreen should be requested (chat list / Main Mini App, not in-bot chat). */
export function shouldAllowDesktopFullscreen(tg) {
    if (!isDesktopTelegramPlatform(tg)) {
        return false;
    }

    if (readLaunchCompactFlag()) {
        return false;
    }

    if (isDesktopInBotChatPanel(tg)) {
        return false;
    }

    return true;
}

/**
 * On Telegram Desktop, Main Mini App (chat list) includes chat markers in initData.
 * In-bot menu / attachment usually does not — use narrow viewport for that case.
 */
export function isChatListMainAppLaunch(tg) {
    return hasBotChatContext(tg);
}

/** Desktop side panel opened from inside a bot chat (compact, not fullscreen). */
export function isDesktopInBotChatPanel(tg) {
    if (!isDesktopTelegramPlatform(tg)) {
        return false;
    }

    if (readLaunchCompactFlag()) {
        return true;
    }

    if (isChatListMainAppLaunch(tg)) {
        return false;
    }

    return isNarrowDesktopViewport(tg);
}

/** initData fields present when opened from chat-list Main Mini App on Desktop. */
export function hasBotChatContext(tg) {
    const unsafe = tg?.initDataUnsafe ?? {};
    if (unsafe.chat?.id) {
        return true;
    }
    if (unsafe.chat_type) {
        return true;
    }
    if (unsafe.chat_instance) {
        return true;
    }

    const initData = String(tg?.initData ?? '');
    if (!initData) {
        return false;
    }

    const params = new URLSearchParams(initData);
    return Boolean(params.get('chat_type') || params.get('chat_instance') || params.get('chat'));
}

/**
 * Deep link that asks Telegram Desktop to open the Main Mini App in fullscreen.
 * https://core.telegram.org/api/bots/webapps#main-mini-apps
 */
export function buildMainMiniAppFullscreenLink(botUsername, startParam = '') {
    const username = String(botUsername ?? '').replace(/^@/, '').trim();
    if (!username) {
        return '';
    }

    const base = `https://t.me/${username}?startapp`;
    const param = String(startParam ?? '').trim();
    if (param) {
        return `${base}=${encodeURIComponent(param)}&mode=fullscreen`;
    }
    return `${base}&mode=fullscreen`;
}

/** Opens Main Mini App via t.me deep link (fullscreen flag for Telegram Desktop). */
export function openMainMiniAppFullscreen(urlOrUsername) {
    const tg = getTelegramWebApp();
    const startParam = tg?.initDataUnsafe?.start_param ?? '';
    let target = String(urlOrUsername ?? '').includes('t.me/')
        ? urlOrUsername
        : buildMainMiniAppFullscreenLink(urlOrUsername || BOT_USERNAME, startParam);

    if (!target) {
        target = buildMainMiniAppFullscreenLink(BOT_USERNAME, startParam);
    }

    if (!target) {
        return false;
    }

    if (typeof tg?.openTelegramLink === 'function') {
        tg.openTelegramLink(target);
        return true;
    }

    window.open(target, '_blank', 'noopener,noreferrer');
    return true;
}

function readExpandDismissed() {
    try {
        return sessionStorage.getItem(EXPAND_DISMISS_KEY) === '1';
    } catch {
        return false;
    }
}

function hasAttemptedFullscreenRelaunch() {
    try {
        return sessionStorage.getItem(FULLSCREEN_RELAUNCH_KEY) === '1';
    } catch {
        return false;
    }
}

function markFullscreenRelaunchAttempted() {
    try {
        sessionStorage.setItem(FULLSCREEN_RELAUNCH_KEY, '1');
    } catch {
        // Ignore storage errors.
    }
}

/**
 * Auto-relaunch Main Mini App with mode=fullscreen when Desktop opened a phone-sized window.
 * Telegram only applies the fullscreen flag on requestMainWebView / deep links, not from JS expand.
 */
function maybeAutoRelaunchFullscreen(tg) {
    if (typeof window === 'undefined' || !tg || hasAttemptedFullscreenRelaunch()) {
        return;
    }

    if (readExpandDismissed()) {
        return;
    }

    if (!shouldAllowDesktopFullscreen(tg)) {
        return;
    }

    if (tg.isFullscreen || readLaunchFullscreenFlag()) {
        return;
    }

    if (readLaunchCompactFlag()) {
        return;
    }

    if (!isTelegramDesktopEmbeddedPanel(tg)) {
        return;
    }

    markFullscreenRelaunchAttempted();
    window.setTimeout(() => {
        openMainMiniAppFullscreen();
    }, 1200);
}

/** Show banner when Desktop still uses a phone-sized host window (chat list path). */
export function shouldShowDesktopExpandPrompt(tg) {
    if (readExpandDismissed()) {
        return false;
    }

    if (!shouldAllowDesktopFullscreen(tg)) {
        return false;
    }

    if (!isNarrowDesktopViewport(tg)) {
        return false;
    }

    if (tg?.isFullscreen || readLaunchFullscreenFlag()) {
        return false;
    }

    return true;
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

/** True when launched from Telegram Desktop external shell (chat picker / chat list). */
export function isTelegramExternalShellFrame() {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        if (window.parent !== window) {
            return true;
        }
    } catch {
        return true;
    }

    const ancestorOrigins = window.location.ancestorOrigins;
    if (ancestorOrigins && ancestorOrigins.length > 0) {
        for (let index = 0; index < ancestorOrigins.length; index += 1) {
            if (/telegram\.org/i.test(ancestorOrigins[index])) {
                return true;
            }
        }
    }

    const referrer = String(document.referrer ?? '');
    if (/telegram\.org|t\.me/i.test(referrer)) {
        return true;
    }

    return false;
}

/** @deprecated use isTelegramExternalShellFrame */
export function isTelegramIframe() {
    return isTelegramExternalShellFrame();
}

export function getTelegramViewportHeight(tg) {
    const tgHeight = Number(tg?.viewportStableHeight || tg?.viewportHeight);
    const visualHeight = typeof window !== 'undefined' ? Number(window.visualViewport?.height) : 0;
    const clientHeight = typeof document !== 'undefined' ? Number(document.documentElement?.clientHeight) : 0;
    const innerHeight = typeof window !== 'undefined' ? Number(window.innerHeight) : 0;

    const candidates = [tgHeight, visualHeight, clientHeight, innerHeight].filter(
        (value) => Number.isFinite(value) && value > 0,
    );

    if (!candidates.length) {
        return 0;
    }

    return Math.min(...candidates);
}

export function getTelegramViewportWidth(tg) {
    const tgWidth = Number(tg?.viewportStableWidth || tg?.viewportWidth);
    const visualWidth = typeof window !== 'undefined' ? Number(window.visualViewport?.width) : 0;
    const clientWidth = typeof document !== 'undefined' ? Number(document.documentElement?.clientWidth) : 0;
    const innerWidth = typeof window !== 'undefined' ? Number(window.innerWidth) : 0;

    const candidates = [tgWidth, visualWidth, clientWidth, innerWidth].filter(
        (value) => Number.isFinite(value) && value > 0,
    );

    if (!candidates.length) {
        return 0;
    }

    return Math.min(...candidates);
}

/**
 * Phone-sized panel on Telegram Desktop (usually in-chat embed after fullscreen is unsupported).
 */
export function isTelegramEmbeddedChatPanel(tg) {
    return isDesktopInBotChatPanel(tg);
}

function isNarrowDesktopViewport(tg) {
    const width = getTelegramViewportWidth(tg);
    const height = getTelegramViewportHeight(tg);
    if (width <= 0 || height <= 0) {
        return false;
    }
    if (width <= EMBEDDED_CHAT_MAX_WIDTH) {
        return true;
    }
    return height <= EMBEDDED_CHAT_MAX_HEIGHT && width <= 640;
}

/**
 * Telegram Desktop phone-sized host window (chat menu embed or mis-launched main app).
 * Uses the smallest reported viewport dimension, not the monitor width.
 */
export function isTelegramDesktopEmbeddedPanel(tg) {
    if (!isDesktopTelegramPlatform(tg)) {
        return false;
    }

    if (tg?.isFullscreen || readLaunchFullscreenFlag()) {
        return false;
    }

    if (isDesktopInBotChatPanel(tg)) {
        return true;
    }

    if (desktopFullscreenUnsupported && isChatListMainAppLaunch(tg) && isNarrowDesktopViewport(tg)) {
        return true;
    }

    return false;
}

function shouldUseMiniPcLayout(tg) {
    return isDesktopInBotChatPanel(tg);
}

function normalizeFullscreenError(payload) {
    if (!payload) {
        return '';
    }
    if (typeof payload === 'string') {
        return payload;
    }
    return String(payload.error ?? payload.reason ?? '');
}

function handleFullscreenFailed(payload) {
    const error = normalizeFullscreenError(payload).toUpperCase();
    if (error === 'UNSUPPORTED') {
        desktopFullscreenUnsupported = true;
        syncTelegramViewport(getTelegramWebApp());
    }
}

function handleTelegramClientEvent(eventType, eventData) {
    const tg = getNativeTelegramWebApp() ?? getTelegramWebApp();

    switch (eventType) {
        case 'fullscreen_failed':
            handleFullscreenFailed(eventData);
            break;
        case 'fullscreen_changed':
            if (eventData?.is_fullscreen) {
                desktopFullscreenUnsupported = false;
            }
            syncTelegramViewport(tg);
            scheduleDesktopFullscreen(tg);
            break;
        case 'viewport_changed':
            syncTelegramViewport(tg);
            scheduleDesktopFullscreen(tg);
            break;
        default:
            break;
    }
}

function installTelegramDesktopEventBridge() {
    if (typeof window === 'undefined' || desktopEventBridgeInstalled) {
        return;
    }

    desktopEventBridgeInstalled = true;

    const wrapReceive = (target, key) => {
        const current = target?.[key];
        const receiver = typeof current === 'function' ? current : null;

        target[key] = (eventType, eventData) => {
            handleTelegramClientEvent(eventType, eventData);
            if (receiver) {
                receiver(eventType, eventData);
            }
        };
    };

    window.TelegramGameProxy = window.TelegramGameProxy ?? {};
    wrapReceive(window.TelegramGameProxy, 'receiveEvent');

    window.Telegram = window.Telegram ?? {};
    window.Telegram.WebView = window.Telegram.WebView ?? {};
    wrapReceive(window.Telegram.WebView, 'receiveEvent');

    window.TelegramGameProxy_receiveEvent = (eventType, eventData) => {
        handleTelegramClientEvent(eventType, eventData);
    };
}

/**
 * mobile — phone clients
 * mini-pc — Telegram Desktop embedded in bot chat (phone-sized panel)
 * desktop-full — Telegram Desktop from chat list / chat picker (browser-like)
 */
export function resolveTelegramLayoutMode(tg) {
    if (!isDesktopTelegramPlatform(tg)) {
        return 'mobile';
    }

    if (isDesktopInBotChatPanel(tg)) {
        return 'mini-pc';
    }

    if (tg?.isFullscreen || readLaunchFullscreenFlag()) {
        return 'desktop-full';
    }

    if (isChatListMainAppLaunch(tg)) {
        return 'desktop-full';
    }

    return isNarrowDesktopViewport(tg) ? 'mini-pc' : 'desktop-full';
}

export function subscribeTelegramLayout(listener) {
    if (typeof listener !== 'function') {
        return () => {};
    }

    layoutListeners.add(listener);
    listener(resolveTelegramLayoutMode(getTelegramWebApp()));

    return () => {
        layoutListeners.delete(listener);
    };
}

function notifyTelegramLayoutListeners(tg) {
    const mode = resolveTelegramLayoutMode(tg);
    layoutListeners.forEach((listener) => {
        listener(mode);
    });
    return mode;
}

function applyTelegramLayoutMode(tg) {
    if (typeof document === 'undefined') {
        return notifyTelegramLayoutListeners(tg);
    }

    const mode = notifyTelegramLayoutListeners(tg);
    const embedded = isTelegramDesktopEmbeddedPanel(tg);
    document.documentElement.dataset.tgLayout = mode;
    document.documentElement.dataset.tgDesktopEmbedded = embedded ? '1' : '0';
    if (typeof document.body !== 'undefined' && document.body) {
        document.body.dataset.tgLayout = mode;
        document.body.dataset.tgDesktopEmbedded = embedded ? '1' : '0';
    }
    return mode;
}

function postTelegramWebEvent(eventType, payload = {}) {
    if (typeof window === 'undefined') {
        return false;
    }

    let sent = false;
    const data = JSON.stringify(payload);
    const envelope = JSON.stringify({ eventType, eventData: payload });

    const webApp = window.Telegram?.WebApp;
    if (typeof webApp?.postEvent === 'function') {
        try {
            webApp.postEvent(eventType, payload);
            sent = true;
        } catch {
            // Try other bridges.
        }
    }

    if (typeof window.TelegramWebviewProxy?.postEvent === 'function') {
        try {
            window.TelegramWebviewProxy.postEvent(eventType, data);
            sent = true;
        } catch {
            // Try other bridges.
        }
    }

    if (typeof window.TelegramGameProxy?.postEvent === 'function') {
        try {
            window.TelegramGameProxy.postEvent(eventType, data);
            sent = true;
        } catch {
            // Try other bridges.
        }
    }

    if (window.parent !== window) {
        try {
            window.parent.postMessage(envelope, '*');
            sent = true;
        } catch {
            // Try origin-specific postMessage below.
        }

        DESKTOP_PARENT_ORIGINS.forEach((origin) => {
            try {
                window.parent.postMessage(envelope, origin);
                sent = true;
            } catch {
                // Ignore origin mismatch.
            }
        });
    }

    if (typeof window.external?.invoke === 'function') {
        try {
            window.external.invoke(JSON.stringify([eventType, data]));
            sent = true;
        } catch {
            // Legacy bridge unavailable.
        }
    }

    return sent;
}

function requestDesktopFullscreen(tg) {
    if (!tg || !shouldAllowDesktopFullscreen(tg)) {
        return;
    }

    if (tg.isFullscreen) {
        return;
    }

    tg.ready?.();
    tg.expand?.();
    tg.disableVerticalSwipes?.();

    if (typeof tg.requestFullscreen === 'function') {
        try {
            tg.requestFullscreen();
        } catch {
            // Fall through to native bridge.
        }
    }

    postTelegramWebEvent('web_app_request_fullscreen', {});
    postTelegramWebEvent('web_app_request_viewport', {});
}

function scheduleDesktopFullscreen(tg) {
    if (typeof window === 'undefined' || !tg || !shouldAllowDesktopFullscreen(tg)) {
        return;
    }

    const delays = [0, 50, 150, 350, 800, 1600, 3200];
    delays.forEach((delay) => {
        window.setTimeout(() => requestDesktopFullscreen(tg), delay);
    });
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

function bindTelegramMiniAppEvents(tg) {
    if (!tg || typeof tg.onEvent !== 'function') {
        return;
    }

    tg.onEvent('viewportChanged', () => {
        syncTelegramViewport(tg);
        scheduleDesktopFullscreen(tg);
    });
    tg.onEvent('safeAreaChanged', () => applyTelegramLayoutVars(tg));
    tg.onEvent('fullscreenChanged', () => {
        if (tg.isFullscreen) {
            desktopFullscreenUnsupported = false;
        }
        syncTelegramViewport(tg);
    });
    tg.onEvent('fullscreenFailed', (payload) => {
        handleFullscreenFailed(payload);
    });
    tg.onEvent('activated', () => {
        syncTelegramViewport(tg);
        scheduleDesktopFullscreen(tg);
    });
}

export function initTelegramMiniApp() {
    installTelegramDesktopEventBridge();
    const tg = getTelegramWebApp();

    tg?.ready?.();
    tg?.expand?.();
    tg?.disableVerticalSwipes?.();
    syncTelegramViewport(tg);
    scheduleDesktopFullscreen(tg);
    maybeAutoRelaunchFullscreen(tg);
    bindTelegramMiniAppEvents(tg);

    return applyLaunchParamsToWebApp(tg);
}

export async function initTelegramMiniAppAsync(options = {}) {
    installTelegramDesktopEventBridge();
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
    maybeAutoRelaunchFullscreen(tg);
    bindTelegramMiniAppEvents(tg);

    return applyLaunchParamsToWebApp(tg);
}
