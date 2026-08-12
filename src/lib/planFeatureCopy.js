/**
 * Subscription plan marketing copy — must match pkg/billing/gating.go tiers.
 * Catalog cards use min plan across variants; bullets here describe what each tier newly unlocks.
 */

export const PLAN_FEATURE_COPY = {
    ru: {
        free: [
            '15 монет для старта',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX (изображения)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Видео и 3D — нет',
            'Премиум модели — нет',
        ],
        basic: [
            '160 монет / месяц',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Standard, Hailuo T2V (≈2–3 видео)',
            'ElevenLabs, Hunyuan 3D rapid',
        ],
        pro: [
            '400 монет / месяц',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse (≈4 видео)',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '950 монет / месяц',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo (≈6 видео)',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '2600 монет / месяц',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'Все модели без ограничений',
            'Максимальный приоритет · лучшая цена за монету',
        ],
    },
    en: {
        free: [
            '15 coins to start',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX (images)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Video & 3D — unavailable',
            'Premium models — unavailable',
        ],
        basic: [
            '160 coins / month',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Standard, Hailuo T2V (≈2–3 videos)',
            'ElevenLabs, Hunyuan 3D rapid',
        ],
        pro: [
            '400 coins / month',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse (≈4 videos)',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '950 coins / month',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo (≈6 videos)',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '2600 coins / month',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'All models unlocked',
            'Maximum priority · best price per coin',
        ],
    },
};

export function getPlanFeatureCopy(language = 'ru') {
    return PLAN_FEATURE_COPY[language === 'en' ? 'en' : 'ru'];
}

/** Feature strings for billing API fallbacks (Russian). */
export const BILLING_PLAN_FEATURES_RU = {
    free: PLAN_FEATURE_COPY.ru.free,
    freeLocked: PLAN_FEATURE_COPY.ru.freeLocked,
    basic: PLAN_FEATURE_COPY.ru.basic,
    basicLocked: ['Pro/Max видео и 3D — нет'],
    pro: PLAN_FEATURE_COPY.ru.pro,
    max: PLAN_FEATURE_COPY.ru.max,
    ultra: PLAN_FEATURE_COPY.ru.ultra,
};
