import { API_BASE_URL, BOT_USERNAME } from '../config/env.js';
import { getTelegramWebApp } from '../lib/telegramWebApp.js';

function resolveApiUrl(pathname) {
    return new URL(pathname, `${API_BASE_URL}/`).toString();
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return window.btoa(binary);
}

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

export async function registerTelegramUser() {
    const tg = getTelegramWebApp();
    const initData = tg?.initData || buildInitDataFromUnsafe(tg);

    if (!initData) {
        throw new Error('Telegram initData not found. Open this Mini App inside Telegram or enable local mock mode.');
    }

    const res = await fetch(resolveApiUrl('/v1/register'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            initDataRaw: encodeBase64(initData),
            startParam: tg?.initDataUnsafe?.start_param ?? '',
        }),
    });

    if (res.status === 409) {
        return { alreadyRegistered: true };
    }

    if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to register Telegram user.');
    }

    return res.json();
}

function getCurrentTelegramId() {
    const tg = getTelegramWebApp();
    const telegramId = tg?.initDataUnsafe?.user?.id;

    if (!telegramId) {
        throw new Error('Telegram user id not found.');
    }

    return telegramId;
}

async function fetchTelegramResource(pathname, fallbackMessage) {
    const res = await fetch(resolveApiUrl(pathname), {
        headers: {
            Accept: 'application/json',
        },
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error((await res.text()) || fallbackMessage);
    }

    return res.json();
}

export async function getMyProfile() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/users/telegram/${telegramId}`, 'Failed to load Telegram profile.');
}

export async function getMyWallet() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/wallet/telegram/${telegramId}`, 'Failed to load wallet data.');
}

export async function getMyReferrals() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/referrals/telegram/${telegramId}`, 'Failed to load referrals.');
}

export async function getMyPromptHistory() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/prompts/history/telegram/${telegramId}`, 'Failed to load prompt history.');
}

export async function savePromptHistory({ prompt, category = 'general' }) {
    const telegramId = getCurrentTelegramId();

    const res = await fetch(resolveApiUrl('/v1/prompts/history'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            telegramId: String(telegramId),
            prompt,
            category,
        }),
    });

    if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to save prompt history.');
    }

    return res.json();
}

export function normalizeProfileResponse(payload, telegramUser) {
    const profile = payload?.data ?? payload ?? {};

    return {
        ...profile,
        backendId: profile?.id ? String(profile.id) : '',
        telegramId: telegramUser?.id ? String(telegramUser.id) : '',
        name: profile?.name ?? telegramUser?.first_name ?? 'Telegram User',
        surname: profile?.surname ?? telegramUser?.last_name ?? '',
        username: telegramUser?.username ?? profile?.username ?? profile?.surname ?? '',
        avatarUrl: telegramUser?.photo_url ?? profile?.avatarUrl ?? '',
        language: telegramUser?.language_code ?? profile?.language ?? 'ru',
    };
}

export function buildReferralLink(telegramUser, startParam = '') {
    const referralCode = telegramUser?.id ? `ref_${telegramUser.id}` : (startParam || 'ref_demo');

    return `https://t.me/${BOT_USERNAME}?startapp=${referralCode}`;
}
