import { API_BASE_URL, SUPPORT_TELEGRAM_INVITE_URL } from '../config/env.js';

let cachedSupportUrl = SUPPORT_TELEGRAM_INVITE_URL;

/** Loads support_chat_url from backend when API is configured. */
export async function resolveSupportUrl() {
    if (!API_BASE_URL) {
        return cachedSupportUrl;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/app/links`);
        if (response.ok) {
            const data = await response.json();
            if (data?.support_chat_url) {
                cachedSupportUrl = data.support_chat_url;
            }
        }
    } catch {
        /* use env default */
    }

    return cachedSupportUrl;
}

/** Opens CyberMate community chat (invite link), not the bot DM. */
export function openSupport(url) {
    const target = url || cachedSupportUrl;
    const tg = window.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
        tg.openTelegramLink(target);
        return;
    }

    window.open(target, '_blank', 'noopener,noreferrer');
}
