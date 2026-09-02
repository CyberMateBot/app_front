import { getTelegramWebApp } from './telegramWebApp.js';

export const THEME_STORAGE_KEY = 'cybermate-ui-theme';
const LEGACY_THEME_STORAGE_KEY = 'cybermate-theme';

// Light theme has been removed from the product — CyberMate is dark-only now.
// Every resolver below intentionally collapses to 'dark' regardless of
// stored preference, Telegram color scheme, or OS setting so legacy light
// choices persisted before this change never resurface.
export const TELEGRAM_THEME_COLORS = {
    dark: { header: '#0a0b10', background: '#0a0b10' },
};

export function normalizeTheme(_value) {
    return 'dark';
}

function readLegacyStoredTheme() {
    if (typeof window === 'undefined') {
        return null;
    }

    if (window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY) != null) {
        window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    }

    return null;
}

export function hasStoredThemeChoice() {
    return false;
}

export function getStoredTheme() {
    readLegacyStoredTheme();
    return 'dark';
}

export function getSystemTheme() {
    return 'dark';
}

export function getTelegramFallbackTheme() {
    return 'dark';
}

/** Тема всегда тёмная — light theme отключена. */
export function getPreferredAutoTheme() {
    return 'dark';
}

export function extractProfileTheme() {
    return 'dark';
}

/**
 * Применяет (всегда тёмную) тему к DOM, meta theme-color и Telegram WebApp.
 */
export function applyTheme(_theme, tg = null) {
    const normalized = 'dark';

    if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = normalized;
        document.documentElement.style.colorScheme = normalized;

        const meta = document.querySelector('meta[name="theme-color"]');

        if (meta) {
            meta.setAttribute('content', TELEGRAM_THEME_COLORS.dark.background);
        }
    }

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    }

    const webApp = tg ?? getTelegramWebApp();
    const colors = TELEGRAM_THEME_COLORS.dark;

    webApp?.setHeaderColor?.(colors.header);
    webApp?.setBackgroundColor?.(colors.background);

    return normalized;
}

/**
 * Старт: тема всегда тёмная независимо от localStorage / API / системы.
 */
export function resolveBootstrapTheme() {
    return { theme: 'dark', persist: false };
}

export function bindTelegramThemeChanged() {
    return () => {};
}

export function bindSystemThemeChanged() {
    return () => {};
}
