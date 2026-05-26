import { getTelegramWebApp } from './telegramWebApp.js';

export const THEME_STORAGE_KEY = 'cybermate-ui-theme';
const LEGACY_THEME_STORAGE_KEY = 'cybermate-theme';

export const TELEGRAM_THEME_COLORS = {
    dark: { header: '#0a0b10', background: '#0a0b10' },
    light: { header: '#ffffff', background: '#ffffff' },
};

export function normalizeTheme(value) {
    if (value === 'light' || value === 'dark') {
        return value;
    }

    return null;
}

function readLegacyStoredTheme() {
    if (typeof window === 'undefined') {
        return null;
    }

    const legacy = normalizeTheme(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));

    if (!legacy) {
        return null;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);

    return legacy;
}

export function hasStoredThemeChoice() {
    if (typeof window === 'undefined') {
        return false;
    }

    return Boolean(normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) || readLegacyStoredTheme());
}

export function getStoredTheme() {
    if (typeof window === 'undefined') {
        return null;
    }

    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) || readLegacyStoredTheme();
}

export function getSystemTheme() {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getTelegramFallbackTheme(tg) {
    const scheme = tg?.colorScheme;

    if (scheme === 'dark' || scheme === 'light') {
        return scheme;
    }

    return null;
}

/** Авто-тема: Telegram → системная → light */
export function getPreferredAutoTheme(tg) {
    return getTelegramFallbackTheme(tg) ?? getSystemTheme() ?? 'light';
}

export function extractProfileTheme(profilePayload) {
    const profile = profilePayload?.data ?? profilePayload ?? {};

    return normalizeTheme(profile?.theme);
}

/**
 * Применяет тему к DOM, meta theme-color и Telegram WebApp.
 * @param {{ persist?: boolean }} options — persist=false для системной Telegram-темы без явного выбора
 */
export function applyTheme(theme, tg = null, { persist = true } = {}) {
    const normalized = normalizeTheme(theme) ?? 'light';

    if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = normalized;
        document.documentElement.style.colorScheme = normalized;

        const meta = document.querySelector('meta[name="theme-color"]');

        if (meta) {
            meta.setAttribute('content', TELEGRAM_THEME_COLORS[normalized].background);
        }
    }

    if (persist && typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    }

    const webApp = tg ?? getTelegramWebApp();
    const colors = TELEGRAM_THEME_COLORS[normalized];

    webApp?.setHeaderColor?.(colors.header);
    webApp?.setBackgroundColor?.(colors.background);

    return normalized;
}

/**
 * Старт: localStorage → API (синхрон с другого устройства) → авто (Telegram / система)
 */
export function resolveBootstrapTheme({ apiTheme, tg }) {
    const stored = getStoredTheme();

    if (stored) {
        return { theme: stored, persist: false };
    }

    const fromApi = normalizeTheme(apiTheme);

    if (fromApi) {
        return { theme: fromApi, persist: true };
    }

    return { theme: getPreferredAutoTheme(tg), persist: false };
}

export function bindTelegramThemeChanged(tg, onTheme) {
    if (!tg?.onEvent || hasStoredThemeChoice()) {
        return () => {};
    }

    const handler = () => {
        if (hasStoredThemeChoice()) {
            return;
        }

        const next = getPreferredAutoTheme(tg);
        applyTheme(next, tg, { persist: false });
        onTheme(next);
    };

    tg.onEvent('themeChanged', handler);

    return () => {
        tg.offEvent?.('themeChanged', handler);
    };
}

export function bindSystemThemeChanged(onTheme, tg = null) {
    if (typeof window === 'undefined' || !window.matchMedia || hasStoredThemeChoice()) {
        return () => {};
    }

    if (getTelegramFallbackTheme(tg)) {
        return () => {};
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (event) => {
        if (hasStoredThemeChoice()) {
            return;
        }

        const next = event.matches ? 'dark' : 'light';
        applyTheme(next, tg, { persist: false });
        onTheme(next);
    };

    media.addEventListener('change', handler);

    return () => {
        media.removeEventListener('change', handler);
    };
}
