import {
    getTelegramWebApp,
    readLaunchInitData,
    resolveTelegramUserId,
} from '../lib/telegramWebApp.js';
import { errorFromResponse } from './apiError.js';
import { fetchReferralLink, fetchReferrals } from './referrals.js';
import { apiFetch } from './httpClient.js';
import { normalizeWalletResponse } from '../lib/walletBalance.js';

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

function getTelegramInitData() {
    const tg = getTelegramWebApp();
    let initData = tg?.initData || buildInitDataFromUnsafe(tg);

    if (!initData) {
        initData = readLaunchInitData();
    }

    return String(initData || '').trim();
}

function getInitDataRawBase64() {
    const initData = getTelegramInitData();

    if (!initData) {
        throw new Error('Telegram initData not found. Open this Mini App inside Telegram or enable local mock mode.');
    }

    return encodeBase64(initData);
}

function withInitDataRaw(body) {
    return {
        ...body,
        initDataRaw: getInitDataRawBase64(),
    };
}

function getTelegramInitDataHeaders(extraHeaders = {}) {
    const initData = getTelegramInitData();

    if (!initData) {
        throw new Error('Telegram initData not found. Open this Mini App inside Telegram or enable local mock mode.');
    }

    return {
        ...extraHeaders,
        'X-Telegram-Init-Data': initData,
    };
}

export async function registerTelegramUser() {
    const tg = getTelegramWebApp();
    const initData = getTelegramInitData();

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
    const payload = await fetchTelegramResource(
        `/v1/wallet/telegram/${telegramId}`,
        'Failed to load wallet data.',
    );

    if (!payload) {
        return { wallet: null, transactions: [] };
    }

    return normalizeWalletResponse(payload);
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

    const res = await apiFetch(`/v1/prompts/history/telegram/${telegramId}`, {
        headers: getTelegramInitDataHeaders({
            Accept: 'application/json',
        }),
    });

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to load prompt history.');
    }

    return res.json();
}

export async function clearMyPromptHistory() {
    const telegramId = getCurrentTelegramId();

    const res = await apiFetch(`/v1/prompts/history/telegram/${telegramId}`, {
        method: 'DELETE',
        headers: getTelegramInitDataHeaders({
            Accept: 'application/json',
        }),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to clear prompt history.');
    }

    return res.json().catch(() => ({}));
}

export async function deletePromptHistoryTopic({ sessionId, ids = [] } = {}) {
    const telegramId = String(getCurrentTelegramId());
    const normalizedIds = Array.isArray(ids)
        ? ids.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)
        : [];

    const res = await apiFetch('/v1/prompts/history/delete', {
        method: 'POST',
        headers: getTelegramInitDataHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            telegramId,
            initDataRaw: getInitDataRawBase64(),
            sessionId: String(sessionId || '').trim(),
            ids: normalizedIds,
        }),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to delete prompt history topic.');
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
    'seedream-v4.5',
    'seedream-v5.0-lite',
    'qwen-image',
    'qwen-image-2512',
    'qwen-image-2.0',
    'qwen-image-2.0-pro',
    'z-image-base',
    'z-image-turbo',
    'grok-imagine-edit',
    'alice-ai-art',
];
export const VIDEO_MODEL_IDS = [
    'kling-v3-std',
    'kling-v3-pro',
    'kling-v3-4k',
    'seedance-v1-pro-i2v',
    'seedance-v1.5-i2v-fast',
    'seedance-v1.5-t2v-fast',
    'seedance-v1.5-i2v-spicy',
    'seedance-v2-video-edit',
    'seedance-v2-video-extend',
    'wan-2.5-t2v',
    'wan-2.6-i2v',
    'wan-2.7-t2v',
    'wan-2.7-flf',
    'wan-2.7-grid',
    'wan-2.7-edit',
    'happyhorse-t2v',
    'happyhorse-i2v',
    'happyhorse-ref2v',
    'happyhorse-video-edit',
    'happyhorse-video-extend',
    'wan-2.2-spicy-i2v',
    'sora-2-t2v',
    'sora-2-i2v',
    'sora-2-t2v-pro',
    'veo-3.1-extend',
    'vidu-q3-i2v-spicy',
    'hailuo-2.3-t2v',
    'hailuo-2.3-i2v-fast',
    'hailuo-2.3-i2v-pro',
];
export const AUDIO_MODEL_IDS = [
    'qwen3-tts',
    'omnivoice',
    'elevenlabs-v3',
    'minimax-speech-2.6',
    'mureka-v9',
    'ace-step-1.5',
];
export const THREE_D_MODEL_IDS = [
    'tripo3d-v2.5-i2d',
    'tripo3d-v2.5-multiview',
    'tripo3d-h3.1-t2d',
    'tripo3d-h3.1-i2d',
    'hunyuan3d-v3-t2d',
    'hunyuan3d-v3.1-rapid',
    'meshy6-t2d',
    'rodin-v2-i2d',
    'rodin-v2.5-i2d',
];

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
        body: JSON.stringify(withInitDataRaw(body)),
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
    imageBase64,
    imageMimeType,
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

    const trimmedImage = imageBase64?.trim();
    if (trimmedImage) {
        body.imageBase64 = trimmedImage;
        if (imageMimeType?.trim()) {
            body.imageMimeType = imageMimeType.trim();
        }
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
        body: JSON.stringify(withInitDataRaw(body)),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate image.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    const responseImageBase64 = data?.imageBase64 ?? data?.image_base64 ?? '';
    let imageUrl = data?.imageUrl ?? data?.image_url ?? '';

    if (!imageUrl && responseImageBase64) {
        const trimmed = String(responseImageBase64).trim();
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
        item: data?.item ?? null,
    };
}

export async function generateVideo({
    prompt,
    model = 'kling-v3-std',
    messages = [],
    aspectRatio,
    duration,
    resolution,
    negativePrompt,
    sourceImageUrl,
    sourceVideoUrl,
    sound,
    cameraControl,
    generateAudio,
    cameraFixed,
    turboMode,
    referenceImages,
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

    if (resolution?.trim()) {
        body.resolution = resolution.trim();
    }

    if (negativePrompt?.trim()) {
        body.negative_prompt = negativePrompt.trim();
    }

    if (typeof sound === 'boolean') {
        body.sound = sound;
    }

    if (cameraControl?.type) {
        body.camera_control = {
            type: cameraControl.type,
            ...(cameraControl.config ? { config: cameraControl.config } : {}),
        };
    }

    const trimmedSourceImage = sourceImageUrl?.trim();
    if (trimmedSourceImage) {
        body.sourceImageUrl = trimmedSourceImage;
    }

    const trimmedSourceVideo = sourceVideoUrl?.trim();
    if (trimmedSourceVideo) {
        body.sourceVideoUrl = trimmedSourceVideo;
    }

    if (typeof generateAudio === 'boolean') {
        body.generate_audio = generateAudio;
    }

    if (typeof cameraFixed === 'boolean') {
        body.camera_fixed = cameraFixed;
    }

    if (typeof turboMode === 'boolean') {
        body.turbo_mode = turboMode;
    }

    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
        body.reference_images = referenceImages
            .map((item) => String(item || '').trim())
            .filter(Boolean);
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
        body: JSON.stringify(withInitDataRaw(body)),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate video.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    return {
        videoUrl: data?.videoUrl ?? data?.video_url ?? '',
        model: data?.model ?? normalizedModel,
        item: data?.item ?? null,
    };
}

export async function generateAudio({
    prompt,
    model = 'qwen3-tts',
    sessionId,
    language,
    voice,
    styleInstruction,
    referenceText,
    audioBase64,
    audioMimeType,
    sourceAudioUrl,
    speed,
    emotion,
    duration,
    numberOfSongs,
    outputFormat,
    tags,
}) {
    const telegramId = getCurrentTelegramId();
    const trimmedPrompt = prompt?.trim();
    const normalizedModel = AUDIO_MODEL_IDS.includes(model) ? model : 'qwen3-tts';

    if (!trimmedPrompt) {
        throw new Error('Prompt is required.');
    }

    const body = {
        telegramId: String(telegramId),
        prompt: trimmedPrompt,
        category: 'audio',
        model: normalizedModel,
    };

    if (language?.trim()) {
        body.language = language.trim();
    }
    if (voice?.trim()) {
        body.voice = voice.trim();
    }
    if (styleInstruction?.trim()) {
        body.style_instruction = styleInstruction.trim();
    }
    if (referenceText?.trim()) {
        body.reference_text = referenceText.trim();
    }

    const trimmedSource = sourceAudioUrl?.trim();
    if (trimmedSource) {
        body.sourceAudioUrl = trimmedSource;
    }

    const trimmedAudio = audioBase64?.trim();
    if (trimmedAudio) {
        body.audioBase64 = trimmedAudio;
        if (audioMimeType?.trim()) {
            body.audioMimeType = audioMimeType.trim();
        }
    }

    const trimmedSessionId = sessionId?.trim();
    if (trimmedSessionId) {
        body.sessionId = trimmedSessionId;
    }

    if (speed != null && speed !== '') {
        body.speed = Number(speed);
    }
    if (emotion?.trim()) {
        body.emotion = emotion.trim();
    }
    if (duration != null && duration !== '') {
        body.duration = Number(duration);
    }
    if (numberOfSongs != null && numberOfSongs !== '') {
        body.number_of_songs = Number(numberOfSongs);
    }
    if (outputFormat?.trim()) {
        body.output_format = outputFormat.trim();
    }
    if (tags?.trim()) {
        body.tags = tags.trim();
    }

    const res = await apiFetch('/v1/generate/audio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(withInitDataRaw(body)),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate audio.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    return {
        audioUrl: data?.audioUrl ?? data?.audio_url ?? '',
        model: data?.model ?? normalizedModel,
    };
}

export async function generate3D({
    prompt,
    model = 'hunyuan3d-v3.1-rapid',
    sessionId,
    negativePrompt,
    sourceImageUrl,
    imageBase64,
    imageMimeType,
    sourceImages,
    imageBase64List,
    imageMimeTypes,
    textureQuality,
    outputFormat,
    geometryQuality,
    mode,
    artStyle,
    topology,
    tier,
    material,
    geometryFileFormat,
    textureMode,
}) {
    const telegramId = getCurrentTelegramId();
    const trimmedPrompt = prompt?.trim() ?? '';
    const normalizedModel = THREE_D_MODEL_IDS.includes(model) ? model : 'hunyuan3d-v3.1-rapid';

    const body = {
        telegramId: String(telegramId),
        prompt: trimmedPrompt,
        category: '3d',
        model: normalizedModel,
    };

    if (negativePrompt?.trim()) {
        body.negative_prompt = negativePrompt.trim();
    }
    if (textureQuality?.trim()) {
        body.texture_quality = textureQuality.trim();
    }
    if (outputFormat?.trim()) {
        body.output_format = outputFormat.trim();
    }
    if (geometryQuality?.trim()) {
        body.geometry_quality = geometryQuality.trim();
    }
    if (mode?.trim()) {
        body.mode = mode.trim();
    }
    if (artStyle?.trim()) {
        body.art_style = artStyle.trim();
    }
    if (topology?.trim()) {
        body.topology = topology.trim();
    }
    if (tier?.trim()) {
        body.tier = tier.trim();
    }
    if (material?.trim()) {
        body.material = material.trim();
    }
    if (geometryFileFormat?.trim()) {
        body.geometry_file_format = geometryFileFormat.trim();
    }
    if (textureMode?.trim()) {
        body.texture_mode = textureMode.trim();
    }

    const trimmedSource = sourceImageUrl?.trim();
    if (trimmedSource) {
        body.sourceImageUrl = trimmedSource;
    }
    const trimmedImage = imageBase64?.trim();
    if (trimmedImage) {
        body.imageBase64 = trimmedImage;
        if (imageMimeType?.trim()) {
            body.imageMimeType = imageMimeType.trim();
        }
    }
    if (Array.isArray(sourceImages) && sourceImages.length > 0) {
        body.sourceImages = sourceImages.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (Array.isArray(imageBase64List) && imageBase64List.length > 0) {
        body.imageBase64List = imageBase64List;
        if (Array.isArray(imageMimeTypes) && imageMimeTypes.length > 0) {
            body.imageMimeTypes = imageMimeTypes;
        }
    }

    const trimmedSessionId = sessionId?.trim();
    if (trimmedSessionId) {
        body.sessionId = trimmedSessionId;
    }

    const res = await apiFetch('/v1/generate/3d', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(withInitDataRaw(body)),
    });

    if (!res.ok) {
        throw await errorFromResponse(res, 'Failed to generate 3D model.');
    }

    const payload = await res.json();
    const data = payload?.data ?? payload;

    return {
        modelUrl: data?.modelUrl ?? data?.model_url ?? '',
        model: data?.model ?? normalizedModel,
        item: data?.item ?? null,
    };
}

export async function savePromptHistory({
    prompt,
    category = 'general',
    model,
    response,
    sessionId,
}) {
    const telegramId = getCurrentTelegramId();

    const body = {
        telegramId: String(telegramId),
        prompt,
        category,
    };

    if (model) {
        body.model = model;
    }
    if (response) {
        body.response = response;
    }
    if (sessionId) {
        body.sessionId = sessionId;
    }

    const res = await apiFetch('/v1/prompts/history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(withInitDataRaw(body)),
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
        tokens: profile?.tokens ?? profile?.token_balance ?? profile?.tokenBalance ?? profile?.balance ?? 0,
        tokenBalance: profile?.token_balance ?? profile?.tokenBalance ?? profile?.tokens ?? profile?.balance ?? 0,
    };
}

