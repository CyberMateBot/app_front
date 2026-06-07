import {
    getTelegramWebApp,
    readLaunchInitData,
    resolveTelegramUserId,
} from '../lib/telegramWebApp.js';
import { errorFromResponse } from './apiError.js';
import { fetchReferralLink, fetchReferrals } from './referrals.js';
import { apiFetch } from './httpClient.js';

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
    let initData = tg?.initData || buildInitDataFromUnsafe(tg);

    if (!initData) {
        initData = readLaunchInitData();
    }

    if (!initData) {
        throw new Error('Telegram initData not found. Open this Mini App inside Telegram or enable local mock mode.');
    }

    const res = await apiFetch('/v1/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            initDataRaw: encodeBase64(initData),
            start_param: tg?.initDataUnsafe?.start_param ?? '',
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
    const telegramId = resolveTelegramUserId(tg);

    if (!telegramId) {
        throw new Error(
            'Telegram user id not found. Open the Mini App in Telegram or set VITE_ENABLE_TELEGRAM_MOCK=true for local dev.',
        );
    }

    return telegramId;
}

async function fetchTelegramResource(pathname, fallbackMessage) {
    const res = await apiFetch(pathname, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw await errorFromResponse(res, fallbackMessage);
    }

    return res.json();
}

export async function getMyProfile() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/users/telegram/${telegramId}`, 'Failed to load Telegram profile.');
}

export async function patchUserTheme(theme) {
    const telegramId = String(getCurrentTelegramId());
    const normalizedTheme = theme === 'light' ? 'light' : 'dark';

    const res = await apiFetch(`/v1/users/telegram/${telegramId}/theme`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ theme: normalizedTheme }),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to update theme.');
    }

    return res.json().catch(() => ({}));
}

export async function getMyWallet() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/wallet/telegram/${telegramId}`, 'Failed to load wallet data.');
}

export async function getMyReferrals() {
    const telegramId = getCurrentTelegramId();

    return fetchReferrals(telegramId);
}

export async function getMyReferralLink() {
    const telegramId = getCurrentTelegramId();

    return fetchReferralLink(telegramId);
}

export { fetchReferralLink, fetchReferrals, resolveReferralAvatarUrl } from './referrals.js';

export async function getMyPromptHistory() {
    const telegramId = getCurrentTelegramId();

    return fetchTelegramResource(`/v1/prompts/history/telegram/${telegramId}`, 'Failed to load prompt history.');
}

export async function clearMyPromptHistory() {
    const telegramId = getCurrentTelegramId();

    const res = await apiFetch(`/v1/prompts/history/telegram/${telegramId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to clear prompt history.');
    }

    return res.json().catch(() => ({}));
}

/** @deprecated use GET /v1/generate/models; kept for legacy history entries */
export const LEGACY_TEXT_MODEL_IDS = ['gemini-flash', 'openai', 'gemini'];
export const IMAGE_MODEL_IDS = [
    'nano-banana',
    'nano-banana-pro',
    'nano-banana-2',
    'gpt-image-2',
    'gpt-image-1.5',
    'flux-dev',
    'alice-ai-art',
];
export const VIDEO_MODEL_IDS = ['kling-v3-std', 'kling-v3-pro'];

export async function fetchTextModels() {
    const res = await apiFetch('/v1/generate/models', {
        headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to load text models.');
    }

    const payload = await res.json();
    const models = payload?.text_models ?? payload?.data?.text_models ?? [];

    if (!Array.isArray(models)) {
        return [];
    }

    return models
        .map((model) => ({
            id: String(model.id || '').trim(),
            label: String(model.label || model.id || '').trim(),
            group: String(model.group || 'Other').trim(),
            description: String(model.description || '').trim(),
            tier: String(model.tier || 'standard').trim(),
            provider: String(model.provider || '').trim(),
            supports_image: Boolean(model.supports_image),
        }))
        .filter((model) => model.id);
}

export function getTextCategoryLabel() {
    return 'text';
}

export async function generateText({
    prompt,
    model = 'yandexgpt',
    messages = [],
    category,
    sessionId,
    imageBase64,
    imageMimeType,
    signal,
}) {
    const telegramId = getCurrentTelegramId();
    const trimmedPrompt = prompt?.trim();
    const normalizedModel = String(model || 'yandexgpt').trim() || 'yandexgpt';
    const normalizedMessages = Array.isArray(messages)
        ? messages
            .map((message) => ({
                role: String(message.role || '').trim(),
                content: String(message.content || '').trim(),
            }))
            .filter((message) => (
                (message.role === 'user' || message.role === 'assistant')
                && message.content
            ))
        : [];

    const trimmedImage = imageBase64?.trim() ?? '';
    if (!trimmedPrompt && !trimmedImage) {
        throw new Error('Prompt or image is required.');
    }

    const body = {
        telegramId: String(telegramId),
        prompt: trimmedPrompt || '',
        category: category?.trim() || getTextCategoryLabel(),
        model: normalizedModel,
    };

    const trimmedSessionId = sessionId?.trim();
    if (trimmedSessionId) {
        body.sessionId = trimmedSessionId;
    }

    if (normalizedMessages.length > 0) {
        body.messages = normalizedMessages;
    }

    if (trimmedImage) {
        body.imageBase64 = trimmedImage;
        if (imageMimeType?.trim()) {
            body.imageMimeType = imageMimeType.trim();
        }
    }

    const res = await apiFetch('/v1/generate/text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate text.');
    }

    let payload;
    try {
        payload = await res.json();
    } catch {
        throw new Error('API вернул не-JSON ответ. Проверьте VITE_API_BASE_URL (должен указывать на бэкенд, не на фронт).');
    }
    const data = payload?.data ?? payload;

    return {
        text: data?.text ?? data?.result ?? data?.content ?? '',
        tokensUsed: data?.tokensUsed ?? data?.tokens ?? null,
        item: data?.item ?? null,
    };
}

export async function generateImage({
    prompt,
    model = 'nano-banana',
    messages = [],
    sessionId,
    sourceImageUrl,
    mode,
    numImages,
    aspectRatio,
    resolution,
    quality,
    outputFormat,
}) {
    const telegramId = getCurrentTelegramId();
    const trimmedPrompt = prompt?.trim();
    const normalizedModel = IMAGE_MODEL_IDS.includes(model) ? model : 'nano-banana';
    const normalizedMessages = Array.isArray(messages)
        ? messages
            .map((message) => ({
                role: String(message.role || '').trim(),
                content: String(message.content || '').trim(),
            }))
            .filter((message) => (
                (message.role === 'user' || message.role === 'assistant')
                && message.content
            ))
        : [];

    if (!trimmedPrompt) {
        throw new Error('Prompt is required.');
    }

    const body = {
        telegramId: String(telegramId),
        prompt: trimmedPrompt,
        category: 'image',
        model: normalizedModel,
    };

    if (normalizedMessages.length > 0) {
        body.messages = normalizedMessages;
    }

    const trimmedSource = sourceImageUrl?.trim();
    if (trimmedSource) {
        body.sourceImageUrl = trimmedSource;
    }

    if (mode?.trim()) {
        body.mode = mode.trim();
    }

    if (Number.isFinite(numImages) && numImages > 0) {
        body.num_images = numImages;
    }

    if (aspectRatio?.trim()) {
        body.aspect_ratio = aspectRatio.trim();
    }

    if (resolution?.trim()) {
        body.resolution = resolution.trim();
    }

    if (quality?.trim()) {
        body.quality = quality.trim();
    }

    if (outputFormat?.trim()) {
        body.output_format = outputFormat.trim();
    }

    const trimmedSessionId = sessionId?.trim();
    if (trimmedSessionId) {
        body.sessionId = trimmedSessionId;
    }

    const res = await apiFetch('/v1/generate/image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate image.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    const imageBase64 = data?.imageBase64 ?? data?.image_base64 ?? '';
    let imageUrl = data?.imageUrl ?? data?.image_url ?? '';

    if (!imageUrl && imageBase64) {
        const trimmed = String(imageBase64).trim();
        imageUrl = trimmed.startsWith('data:')
            ? trimmed
            : `data:image/png;base64,${trimmed}`;
    }

    const imageUrls = Array.isArray(data?.imageUrls ?? data?.image_urls)
        ? (data.imageUrls ?? data.image_urls).filter(Boolean)
        : [];

    return {
        imageUrl,
        imageUrls: imageUrls.length ? imageUrls : (imageUrl ? [imageUrl] : []),
        model: data?.model ?? normalizedModel,
        tokensUsed: data?.tokensUsed ?? data?.tokens ?? null,
    };
}

export async function generateVideo({
    prompt,
    model = 'kling-v3-std',
    messages = [],
    aspectRatio,
    duration,
    sessionId,
}) {
    const telegramId = getCurrentTelegramId();
    const trimmedPrompt = prompt?.trim();
    const normalizedModel = VIDEO_MODEL_IDS.includes(model) ? model : 'kling-v3-std';

    if (!trimmedPrompt) {
        throw new Error('Prompt is required.');
    }

    const normalizedMessages = Array.isArray(messages)
        ? messages
            .map((message) => ({
                role: String(message.role || '').trim(),
                content: String(message.content || '').trim(),
            }))
            .filter((message) => (
                (message.role === 'user' || message.role === 'assistant')
                && message.content
            ))
        : [];

    const body = {
        telegramId: String(telegramId),
        prompt: trimmedPrompt,
        category: 'video',
        model: normalizedModel,
    };

    if (normalizedMessages.length > 0) {
        body.messages = normalizedMessages;
    }

    if (aspectRatio?.trim()) {
        body.aspect_ratio = aspectRatio.trim();
    }

    if (Number.isFinite(duration) && duration > 0) {
        body.duration = duration;
    }

    const trimmedSessionId = sessionId?.trim();
    if (trimmedSessionId) {
        body.sessionId = trimmedSessionId;
    }

    const res = await apiFetch('/v1/generate/video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate video.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    return {
        videoUrl: data?.videoUrl ?? data?.video_url ?? '',
        model: data?.model ?? normalizedModel,
    };
}

export async function savePromptHistory({ prompt, category = 'general', model }) {
    const telegramId = getCurrentTelegramId();

    const body = {
        telegramId: String(telegramId),
        prompt,
        category,
    };

    if (model) {
        body.model = model;
    }

    const res = await apiFetch('/v1/prompts/history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to save prompt history.');
    }

    return res.json();
}

export function normalizeProfileResponse(payload, telegramUser) {
    const profile = payload?.data ?? payload ?? {};

    const subscriptionPlan = profile?.subscriptionPlan ?? profile?.role ?? 'free';

    return {
        ...profile,
        backendId: profile?.id ? String(profile.id) : '',
        telegramId: telegramUser?.id ? String(telegramUser.id) : '',
        name: profile?.name ?? telegramUser?.first_name ?? 'Telegram User',
        surname: profile?.surname ?? telegramUser?.last_name ?? '',
        username: profile?.username ?? telegramUser?.username ?? '',
        avatarUrl: telegramUser?.photo_url ?? profile?.avatarUrl ?? '',
        language: telegramUser?.language_code ?? profile?.language ?? 'ru',
        theme: profile?.theme === 'light' ? 'light' : 'dark',
        subscriptionPlan,
        verified: Boolean(profile?.verified),
    };
}

