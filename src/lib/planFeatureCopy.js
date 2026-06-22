/**
 * Subscription plan marketing copy — must match pkg/billing/gating.go tiers.
 * Catalog cards use min plan across variants; bullets here describe what each tier newly unlocks.
 */

export const PLAN_FEATURE_COPY = {
    ru: {
        free: [
            '10 монет / месяц',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX (изображения)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Видео и 3D — нет',
            'Премиум модели — нет',
        ],
        basic: [
            '40 монет / месяц',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Standard, Hailuo T2V',
            'ElevenLabs, Hunyuan 3D rapid',
        ],
        pro: [
            '100 монет / месяц',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '250 монет / месяц',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '600 монет / месяц',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'Все модели без ограничений',
            'Максимальный приоритет',
        ],
    },
    en: {
        free: [
            '10 coins / month',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX (images)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Video & 3D — unavailable',
            'Premium models — unavailable',
        ],
        basic: [
            '40 coins / month',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Standard, Hailuo T2V',
            'ElevenLabs, Hunyuan 3D rapid',
        ],
        pro: [
            '100 coins / month',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '250 coins / month',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '600 coins / month',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'All models unlocked',
            'Maximum priority',
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
