/**
 * Subscription plan marketing copy — must match pkg/billing/gating.go tiers
 * and pkg/billing/defaults.go coin amounts.
 *
 * Coin model (Sep 2026):
 *   - Монеты зачисляются при покупке подписки и ОСТАЮТСЯ на балансе после её окончания.
 *   - 1 CyberCoin = 1 ₽. Цены на генерации = ~3.5× стоимость провайдера.
 *   - Монеты не сгорают — даже без активной подписки вы можете тратить накопленный баланс
 *     на модели своего уровня, пока они доступны.
 */

export const PLAN_FEATURE_COPY = {
    ru: {
        free: [
            '15 монет при регистрации',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX Dev (изображения)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Видео и 3D — недоступны',
            'Премиум модели — недоступны',
        ],
        basic: [
            '160 монет при покупке',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Std, Hailuo T2V (≈1–2 видео)',
            'ElevenLabs, Hunyuan 3D Rapid',
        ],
        basicLocked: ['Pro видео и 3D — недоступны'],
        pro: [
            '400 монет при покупке',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse (≈2–3 видео)',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '950 монет при покупке',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo (≈4–6 видео)',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '2600 монет при покупке',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'Все модели без ограничений',
            'Максимальный приоритет очереди',
            'Лучшая цена за монету',
        ],
    },
    en: {
        free: [
            '15 coins on sign-up',
            'YandexGPT, GPT OSS 20B, DeepSeek Chat',
            'FLUX Dev (images)',
            'Qwen3 TTS, OmniVoice, MiniMax Speech',
        ],
        freeLocked: [
            'Video & 3D — unavailable',
            'Premium models — unavailable',
        ],
        basic: [
            '160 coins on purchase',
            'Claude Haiku, Gemini Flash, GPT-4o mini, DeepSeek Flash',
            'Nano Banana, Alice AI, Seedream, Qwen Image, Z-Image',
            'Kling Std, Hailuo T2V (≈1–2 videos)',
            'ElevenLabs, Hunyuan 3D Rapid',
        ],
        basicLocked: ['Pro video & 3D — unavailable'],
        pro: [
            '400 coins on purchase',
            'Claude Sonnet, GPT-5.4, DeepSeek R1, Qwen 3.6',
            'GPT Image 2, Nano Banana 2, Grok Imagine',
            'Kling Pro, Seedance, WAN, Vidu, HappyHorse (≈2–3 videos)',
            'Mureka, ACE-Step, Tripo, Meshy 3D',
        ],
        max: [
            '950 coins on purchase',
            'GPT-4o, Gemini 2.5 Pro, Claude Opus 4.7, o3',
            'Nano Banana Pro',
            'Kling 4K, Seedance 2.0, Sora, Veo (≈4–6 videos)',
            'Tripo H3.1, Rodin 3D',
        ],
        ultra: [
            '2600 coins on purchase',
            'Claude Opus 4.8, o1, GPT-5.5, Sora Pro',
            'All models unlocked',
            'Maximum queue priority',
            'Best price per coin',
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
    basicLocked: PLAN_FEATURE_COPY.ru.basicLocked,
    pro: PLAN_FEATURE_COPY.ru.pro,
    max: PLAN_FEATURE_COPY.ru.max,
    ultra: PLAN_FEATURE_COPY.ru.ultra,
};
