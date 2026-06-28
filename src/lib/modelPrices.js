/**
 * CyberCoin prices per model operation (synced with back/app_back/pkg/admincatalog/catalog.go).
 */
const MODEL_PRICES = {
    'yandexgpt': 5,
    'gpt-oss-20b': 1,
    'gpt-oss-120b': 3,
    'qwen3.6-35b': 4,
    'qwen3-235b': 4,
    'deepseek-v4-flash': 1,
    'deepseek-chat': 1,
    'deepseek-v3.2': 1,
    'deepseek-chat-v3-0324': 1,
    'deepseek-v3.2-exp': 2,
    'deepseek-v4': 2,
    'deepseek-r1': 3,
    'gpt-4.1-nano': 1,
    'gpt-4o-mini': 1,
    'gpt-5.4-mini': 2,
    'gpt-4.1-mini': 2,
    'o4-mini': 4,
    'gemini-2.5-flash': 2,
    'claude-haiku-4.5': 2,
    'gpt-4.1': 4,
    'gpt-4o': 5,
    'gemini-2.5-pro': 4,
    'o3-mini': 5,
    'gpt-5.4': 5,
    'claude-sonnet-4.5': 5,
    'o3': 12,
    'o1': 15,
    'claude-opus-4.7': 8,
    'claude-opus-4.8': 8,
    'gpt-5.5': 10,
    'flux-dev': 5,
    'nano-banana': 10,
    'gpt-image-2': 20,
    'gpt-image-1.5': 20,
    'nano-banana-2': 22,
    'nano-banana-pro': 40,
    'alice-ai-art': 12,
    'seedream-v4.5': 14,
    'seedream-v5.0-lite': 12,
    'qwen-image': 7,
    'qwen-image-2512': 7,
    'qwen-image-2.0': 11,
    'qwen-image-2.0-pro': 25,
    'z-image-base': 5,
    'z-image-turbo': 2,
    'grok-imagine-edit': 25,
    kling: 80,
    'kling-v3-std': 80,
    'kling-v3-pro': 110,
    'kling-v3-4k': 160,
    seedance: 95,
    'seedance-v1-pro-i2v': 95,
    'seedance-v1.5-i2v-fast': 110,
    'seedance-v1.5-t2v-fast': 110,
    'seedance-v1.5-i2v-spicy': 110,
    'seedance-v2-video-edit': 160,
    'seedance-v2-video-extend': 160,
    'qwen3-tts': 4,
    omnivoice: 3,
    'elevenlabs-v3': 8,
    'minimax-speech-2.6': 3,
    mureka: 50,
    'mureka-v9': 50,
    'ace-step-1.5': 40,
    'hunyuan3d-v3.1-rapid': 25,
    'hunyuan3d-v3-t2d': 30,
    'tripo3d-v2.5-i2d': 48,
    'tripo3d-v2.5-multiview': 48,
    'tripo3d-h3.1-t2d': 55,
    'tripo3d-h3.1-i2d': 55,
    'meshy6-t2d': 48,
    'rodin-v2-i2d': 55,
    'rodin-v2.5-i2d': 55,
};

const CATEGORY_DEFAULTS = {
    text: 5,
    image: 15,
    video: 70,
    audio: 8,
    '3d': 50,
};

export function getModelPrice(modelId, category = 'text') {
    const normalizedId = String(modelId || '').trim().toLowerCase();
    if (normalizedId && MODEL_PRICES[normalizedId] != null) {
        return MODEL_PRICES[normalizedId];
    }
    if (normalizedId && MODEL_PRICES[modelId] != null) {
        return MODEL_PRICES[modelId];
    }
    return CATEGORY_DEFAULTS[category] ?? 15;
}

export function getCatalogToolPriceRange(tool) {
    const category = tool.page === 'ai-chat'
        ? 'text'
        : tool.page === 'ai-image'
            ? 'image'
            : tool.page === 'ai-video'
                ? 'video'
                : tool.page === 'ai-3d'
                    ? '3d'
                    : 'audio';

    const modelIds = [];

    if (Array.isArray(tool.variants) && tool.variants.length) {
        tool.variants.forEach((variant) => {
            modelIds.push(variant.id);
        });
    } else if (tool.id) {
        modelIds.push(tool.id);
    }

    if (!modelIds.length) {
        return { min: CATEGORY_DEFAULTS[category] ?? 15, max: CATEGORY_DEFAULTS[category] ?? 15 };
    }

    const prices = modelIds.map((id) => getModelPrice(id, category));
    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
    };
}

export function formatCatalogPriceLabel({ min, max }, language = 'ru') {
    if (min === max) {
        return `${min}`;
    }

    return language === 'ru' ? `от ${min}` : `from ${min}`;
}

export function formatVariantPriceLabel(price, language = 'ru') {
    const value = Number(price) || 0;
    if (language === 'ru') {
        return `${value} мон.`;
    }
    return `${value} coins`;
}
