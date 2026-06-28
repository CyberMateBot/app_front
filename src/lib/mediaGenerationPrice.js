import { getModelPrice } from './modelPrices.js';

const TTS_MODEL_IDS = new Set([
    'qwen3-tts',
    'omnivoice',
    'elevenlabs-v3',
    'minimax-speech-2.6',
]);

const TTS_BASE_USD = {
    'qwen3-tts': 0.005,
    'qwen3-tts-clone': 0.005,
    omnivoice: 0.005,
    'elevenlabs-v3': 0.10,
    'minimax-speech-2.6': 0.06,
};

/**
 * @param {number} usd
 * @param {number} baseCoins
 * @param {number} baseUSD
 */
export function cyberCoinsFromUSD(usd, baseCoins, baseUSD) {
    if (!Number.isFinite(usd) || usd <= 0) {
        return 1;
    }
    if (!Number.isFinite(baseUSD) || baseUSD <= 0) {
        return Math.max(1, Math.round(usd * 3.5 * 100));
    }
    return Math.max(1, Math.round(usd * (baseCoins / baseUSD)));
}

/**
 * @param {string} modelId
 * @param {number} textLength
 * @param {boolean} [voiceClone]
 */
function ttsUSD(modelId, textLength, voiceClone = false) {
    const chars = Math.max(1, Number(textLength) || 1);
    const id = voiceClone && modelId === 'qwen3-tts' ? 'qwen3-tts-clone' : modelId;

    switch (id) {
        case 'qwen3-tts':
            return chars < 100 ? 0.005 : 0.005 * chars / 100;
        case 'qwen3-tts-clone':
            return chars < 100 ? 0.005 : 0.05 * chars / 100;
        case 'omnivoice':
            return chars < 100 ? 0.005 : 0.005 * chars / 100;
        case 'elevenlabs-v3': {
            const billed = Math.max(chars, 1000);
            return 0.10 * billed / 1000;
        }
        case 'minimax-speech-2.6':
            return 0.06 * chars / 1000;
        default:
            return 0;
    }
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 * @param {number} textLength
 * @param {boolean} [voiceClone]
 */
export function calculateTTSPrice(model, textLength, voiceClone = false) {
    const modelId = model?.id ?? '';
    const base = model?.price ?? getModelPrice(modelId, 'audio');
    const effectiveId = voiceClone && modelId === 'qwen3-tts' ? 'qwen3-tts-clone' : modelId;
    const baseUSD = TTS_BASE_USD[effectiveId] ?? TTS_BASE_USD[modelId] ?? 0.005;
    const usd = ttsUSD(modelId, textLength, voiceClone);
    return cyberCoinsFromUSD(usd, base, baseUSD);
}

/**
 * @param {import('./types').MediaOption} option
 * @param {unknown} raw
 */
function normalizeOptionValue(option, raw) {
    if (raw == null || raw === '') {
        return option.default != null ? String(option.default) : '';
    }

    if (option.type === 'boolean') {
        return raw === true || raw === 'true' ? 'true' : 'false';
    }

    return String(raw);
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 * @param {Record<string, unknown>} [selected]
 * @param {import('./types').PriceContext} [context]
 */
export function calculatePrice(model, selected = {}, context = {}) {
    const modelId = model?.id ?? '';
    const kind = model?.kind ?? 'image';
    const fallback = getModelPrice(modelId, kind === '3d' ? '3d' : kind);

    if (kind === 'audio' && TTS_MODEL_IDS.has(modelId)) {
        const textLength = Number(context.textLength) || 1;
        const voiceClone = Boolean(
            context.voiceClone
            || selected.mode === 'clone'
            || selected.audio_base64
            || selected.source_audio_url
            || selected.audio_url,
        );
        return calculateTTSPrice(model, textLength, voiceClone);
    }

    let price = model?.price ?? fallback;

    for (const option of model?.options ?? []) {
        if (option.key === 'text_length') {
            continue;
        }

        const prices = option.value_prices;
        if (!prices) {
            continue;
        }

        const value = normalizeOptionValue(option, selected[option.key]);
        if (value && Object.prototype.hasOwnProperty.call(prices, value)) {
            price += prices[value];
        }
    }

    return Math.max(1, price);
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 */
export function getMediaModelMinPrice(model) {
    const modelId = model?.id ?? '';
    const kind = model?.kind ?? 'image';
    const base = model?.price ?? getModelPrice(modelId, kind === '3d' ? '3d' : kind);

    if (kind === 'audio' && TTS_MODEL_IDS.has(modelId)) {
        return calculateTTSPrice(model, 100, false);
    }

    let extra = 0;
    for (const option of model?.options ?? []) {
        if (option.key === 'text_length' || !option.value_prices) {
            continue;
        }
        extra += Math.min(0, ...Object.values(option.value_prices));
    }

    return Math.max(1, base + extra);
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 * @param {string} optionKey
 * @param {unknown} value
 * @param {Record<string, unknown>} [currentSelected]
 * @param {import('./types').PriceContext} [context]
 */
export function getOptionPriceDelta(model, optionKey, value, currentSelected = {}, context = {}) {
    const defaults = buildDefaultSelected(model);
    const baseSelected = { ...defaults, ...currentSelected };
    const basePrice = calculatePrice(model, baseSelected, context);
    const withValue = calculatePrice(model, { ...baseSelected, [optionKey]: value }, context);
    return withValue - basePrice;
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 */
export function buildDefaultSelected(model) {
    /** @type {Record<string, unknown>} */
    const selected = {};

    for (const option of model?.options ?? []) {
        if (option.default == null) {
            continue;
        }

        if (option.type === 'boolean') {
            selected[option.key] = option.default === true || option.default === 'true';
        } else {
            selected[option.key] = option.default;
        }
    }

    return selected;
}

export function isTTSModel(modelId) {
    return TTS_MODEL_IDS.has(String(modelId || '').trim());
}

/* ------------------------------------------------------------------ *
 * Video pricing (mirrors backend pkg/billing/video_option_prices.go)  *
 * Kling and most video models are billed per-second, so price scales  *
 * with duration; resolution selects the Kling tier (std/pro/4k).      *
 * ------------------------------------------------------------------ */

const KLING_PER_SECOND_USD = {
    'kling-v3-std': 0.084,
    'kling-v3-pro': 0.112,
    'kling-v3-4k': 0.168,
};

const WAN_PER_SECOND_USD = {
    '480p': 0.05,
    '480P': 0.05,
    '720p': 0.10,
    '720P': 0.10,
    '1080p': 0.15,
    '1080P': 0.15,
};

const VIDU_PER_SECOND_USD = {
    '540p': 0.07,
    '720p': 0.15,
    '1080p': 0.16,
};

const SEEDANCE_V2_EDIT_PER_SECOND_USD = {
    standard: { '480p': 0.075, '720p': 0.15, '1080p': 0.375 },
    turbo: { '720p': 0.085, '1080p': 0.095 },
};

const lc = (value) => String(value ?? '').trim().toLowerCase();

const isKlingModel = (id) => lc(id).startsWith('kling-v3');
const isSeedance15Model = (id) => lc(id).startsWith('seedance-v1.5');
const isWANModel = (id) => lc(id).startsWith('wan-');
const isHappyHorseModel = (id) => lc(id).startsWith('happyhorse-');

function klingEffectiveModel(modelId, resolution) {
    if (!isKlingModel(modelId)) {
        return modelId;
    }
    switch (lc(resolution)) {
        case '4k':
            return 'kling-v3-4k';
        case '1080p':
            return 'kling-v3-pro';
        case '720p':
            return 'kling-v3-std';
        default:
            return modelId;
    }
}

function videoBillingModelId(p) {
    const modelId = lc(p.modelId);
    if (isKlingModel(modelId)) {
        return klingEffectiveModel(modelId, p.resolution);
    }
    return modelId;
}

function defaultVideoDuration(modelId) {
    if (lc(modelId).startsWith('hailuo-2.3-t2v')) {
        return 6;
    }
    return 5;
}

function defaultVideoResolution(modelId) {
    const id = lc(modelId);
    if (id.startsWith('kling-v3-4k')) return '4k';
    if (id.startsWith('kling-v3-pro')) return '1080p';
    if (id.startsWith('kling-v3')) return '720p';
    if (id.startsWith('seedance-v1.5') || id.startsWith('happyhorse-') || id.startsWith('vidu-')) return '720p';
    if (id.startsWith('seedance-v2')) return '720p';
    if (id.startsWith('wan-')) return '720P';
    if (id === 'veo-3.1-extend') return '1080p';
    return '';
}

const defaultSeedance15Audio = (modelId) => isSeedance15Model(modelId);

function normalizeVideoDuration(duration, fallback) {
    const value = Number(duration);
    if (value > 0) return value;
    if (fallback > 0) return fallback;
    return 5;
}

function seedance15PerSecond(resolution, generateAudio) {
    if (lc(resolution) === '1080p') {
        return generateAudio ? 0.06 : 0.03;
    }
    return generateAudio ? 0.04 : 0.02;
}

function happyHorseUSD(resolution, duration) {
    const dur = duration > 0 ? duration : 5;
    const mult = lc(resolution) === '1080p' ? 2 : 1;
    return 0.70 * mult * dur / 5.0;
}

function hailuoUSD(modelId, duration) {
    switch (lc(modelId)) {
        case 'hailuo-2.3-t2v':
            return duration >= 10 ? 0.56 : 0.23;
        case 'hailuo-2.3-i2v-fast':
            return 0.19;
        case 'hailuo-2.3-i2v-pro':
            return 0.49;
        default:
            return 0.23;
    }
}

function wanRateUSD(modelId, resolution) {
    if (lc(modelId).startsWith('wan-2.7')) {
        return resolution === '1080P' || resolution === '1080p' ? 0.15 : 0.10;
    }
    return WAN_PER_SECOND_USD[resolution] ?? WAN_PER_SECOND_USD['720p'];
}

function normalizeSeedanceResolution(resolution, tier) {
    const res = lc(resolution);
    if (!res) {
        return tier === 'turbo' ? '720p' : '480p';
    }
    if (tier === 'turbo' && res === '480p') {
        return '720p';
    }
    return res;
}

const isSeedanceTurboResolution = (resolution) => ['720p', '1080p'].includes(lc(resolution));

function normalizeWANResolution(resolution, modelId) {
    const res = resolution || defaultVideoResolution(modelId);
    switch (String(res).toUpperCase()) {
        case '480P':
            return '480P';
        case '1080P':
            return '1080P';
        default:
            return '720P';
    }
}

const normalizeViduResolution = (resolution) => lc(resolution) || '720p';

function videoGenerationUSD(p) {
    const modelId = videoBillingModelId(p);
    const duration = normalizeVideoDuration(p.duration, defaultVideoDuration(modelId));

    if (isKlingModel(modelId)) {
        let usd = KLING_PER_SECOND_USD[modelId] * duration;
        if (p.sound) {
            usd *= 1.5;
        }
        return usd;
    }
    if (isSeedance15Model(modelId)) {
        return seedance15PerSecond(p.resolution, p.generateAudio) * duration;
    }
    if (modelId === 'seedance-v1-pro-i2v') {
        return 0.06 * duration;
    }
    if (modelId === 'seedance-v2-video-edit') {
        const tier = (p.turboMode || isSeedanceTurboResolution(p.resolution)) ? 'turbo' : 'standard';
        const res = normalizeSeedanceResolution(p.resolution, tier);
        const rate = SEEDANCE_V2_EDIT_PER_SECOND_USD[tier]?.[res] ?? 0;
        return rate * duration * 2;
    }
    if (modelId === 'seedance-v2-video-extend') {
        return 0.15 * duration * 2;
    }
    if (isWANModel(modelId)) {
        const res = normalizeWANResolution(p.resolution, modelId);
        return wanRateUSD(modelId, res) * duration;
    }
    if (isHappyHorseModel(modelId)) {
        if (modelId === 'happyhorse-video-extend') {
            const extend = p.extendBy > 0 ? p.extendBy : duration;
            return happyHorseUSD('720p', extend);
        }
        return happyHorseUSD(p.resolution, duration);
    }
    if (modelId === 'veo-3.1-extend') {
        return 1.05;
    }
    if (modelId === 'vidu-q3-i2v-spicy') {
        return VIDU_PER_SECOND_USD[normalizeViduResolution(p.resolution)] * duration;
    }
    if (lc(modelId).startsWith('hailuo-2.3')) {
        return hailuoUSD(modelId, duration);
    }
    return 0;
}

function defaultVideoUSD(modelId) {
    const duration = defaultVideoDuration(modelId);
    const resolution = defaultVideoResolution(modelId);
    return videoGenerationUSD({
        modelId,
        duration,
        resolution,
        generateAudio: defaultSeedance15Audio(modelId),
    });
}

export function calculateVideoPrice(model, selected = {}) {
    const modelId = lc(model?.id);
    const params = {
        modelId,
        duration: Number(selected.duration) || 0,
        extendBy: Number(selected.extend_by) || 0,
        resolution: selected.resolution != null ? String(selected.resolution) : '',
        sound: selected.sound === true || selected.sound === 'true',
        generateAudio: selected.generate_audio === true || selected.generate_audio === 'true',
        turboMode: selected.turbo_mode === true || selected.turbo_mode === 'true',
    };

    const effectiveId = videoBillingModelId(params);
    let base = model?.price ?? getModelPrice(modelId, 'video');
    if (base <= 0 || effectiveId !== modelId) {
        base = getModelPrice(effectiveId, 'video');
    }

    const usd = videoGenerationUSD(params);
    if (usd <= 0) {
        return Math.max(1, base);
    }

    const baseUSD = defaultVideoUSD(effectiveId);
    return Math.max(1, cyberCoinsFromUSD(usd, base, baseUSD));
}

/* ------------------------------------------------------------------ *
 * Audio pricing (mirrors backend pkg/billing/audio_option_prices.go)  *
 * Mureka V9 is billed per song; ACE-Step 1.5 per second; TTS models    *
 * by text length (handled via calculateTTSPrice).                      *
 * ------------------------------------------------------------------ */

const MUREKA_PER_SONG_USD = 0.045;
const ACE_STEP_PER_SECOND_USD = 0.0003;
const ACE_STEP_DEFAULT_DURATION = 60;

/**
 * @param {import('./types').MediaModel | null | undefined} model
 * @param {Record<string, unknown>} [selected]
 * @param {import('./types').PriceContext} [context]
 */
export function calculateAudioPrice(model, selected = {}, context = {}) {
    const modelId = String(model?.id ?? '').trim();

    if (TTS_MODEL_IDS.has(modelId)) {
        const textLength = Number(context.textLength) || 1;
        const voiceClone = Boolean(
            context.voiceClone
            || selected.mode === 'clone'
            || selected.audio_base64
            || selected.source_audio_url
            || selected.audio_url,
        );
        return calculateTTSPrice(model, textLength, voiceClone);
    }

    const base = model?.price ?? getModelPrice(modelId, 'audio');

    if (modelId === 'mureka-v9') {
        let songs = Number(selected.number_of_songs) || 1;
        songs = Math.min(3, Math.max(1, songs));
        const usd = MUREKA_PER_SONG_USD * songs;
        return Math.max(1, cyberCoinsFromUSD(usd, base, MUREKA_PER_SONG_USD));
    }

    if (modelId === 'ace-step-1.5') {
        let duration = Number(selected.duration) || 0;
        if (duration < 5) {
            duration = ACE_STEP_DEFAULT_DURATION;
        }
        duration = Math.min(240, duration);
        const usd = ACE_STEP_PER_SECOND_USD * duration;
        const baseUSD = ACE_STEP_PER_SECOND_USD * ACE_STEP_DEFAULT_DURATION;
        return Math.max(1, cyberCoinsFromUSD(usd, base, baseUSD));
    }

    return calculatePrice(model, selected, context);
}

/* ------------------------------------------------------------------ *
 * 3D pricing (mirrors backend pkg/billing/three_d_option_prices.go)   *
 * Tripo3D H3.1 cost depends on texture/geometry quality + quad;       *
 * Hunyuan3D V3 on generate_type; Rodin V2.5 on tier + addons.         *
 * ------------------------------------------------------------------ */

const TRIPO_V25_USD = 0.30;
const TRIPO_H31_BASE_USD = 0.20;
const TRIPO_H31_TEXTURE_USD = 0.10;
const TRIPO_H31_DETAILED_TEX = 0.20;
const TRIPO_H31_DETAILED_GEOM = 0.20;
const TRIPO_H31_QUAD_USD = 0.05;

const HUNYUAN_RAPID_USD = 0.0225;
const HUNYUAN_GEOMETRY_USD = 0.25;
const HUNYUAN_NORMAL_USD = 0.375;
const HUNYUAN_LOWPOLY_USD = 0.45;

const MESHY6_USD = 0.80;
const RODIN_V2_USD = 0.30;
const RODIN_V25_BASE_USD = 0.40;
const RODIN_HIGHPACK_USD = 0.80;

function tripoH31USD(p) {
    const texture = p.textureSet ? p.texture : true;
    let usd = TRIPO_H31_BASE_USD;
    if (texture) {
        usd += lc(p.textureQuality) === 'detailed' ? TRIPO_H31_DETAILED_TEX : TRIPO_H31_TEXTURE_USD;
    }
    if (lc(p.geometryQuality) === 'detailed') {
        usd += TRIPO_H31_DETAILED_GEOM;
    }
    if (p.quad) {
        usd += TRIPO_H31_QUAD_USD;
    }
    return usd;
}

function hunyuanV3USD(generateType) {
    switch (lc(generateType)) {
        case 'geometry':
            return HUNYUAN_GEOMETRY_USD;
        case 'lowpoly':
        case 'low_poly':
        case 'low poly':
            return HUNYUAN_LOWPOLY_USD;
        default:
            return HUNYUAN_NORMAL_USD;
    }
}

function rodinV25USD(tier, addons) {
    let usd = RODIN_V25_BASE_USD;
    if (lc(tier) === 'gen-2.5-extreme-high') {
        usd = RODIN_V25_BASE_USD * 2;
    }
    if (lc(addons).includes('highpack')) {
        usd += RODIN_HIGHPACK_USD;
    }
    return usd;
}

function threeDGenerationUSD(modelId, p) {
    switch (modelId) {
        case 'tripo3d-v2.5-i2d':
        case 'tripo3d-v2.5-multiview':
            return TRIPO_V25_USD;
        case 'tripo3d-h3.1-t2d':
        case 'tripo3d-h3.1-i2d':
            return tripoH31USD(p);
        case 'hunyuan3d-v3.1-rapid':
            return HUNYUAN_RAPID_USD;
        case 'hunyuan3d-v3-t2d':
            return hunyuanV3USD(p.generateType);
        case 'meshy6-t2d':
            return MESHY6_USD;
        case 'rodin-v2-i2d':
            return RODIN_V2_USD;
        case 'rodin-v2.5-i2d':
            return rodinV25USD(p.tier, p.addons);
        default:
            return 0;
    }
}

function defaultThreeDUSD(modelId) {
    switch (modelId) {
        case 'tripo3d-v2.5-i2d':
        case 'tripo3d-v2.5-multiview':
            return TRIPO_V25_USD;
        case 'tripo3d-h3.1-t2d':
        case 'tripo3d-h3.1-i2d':
            return tripoH31USD({ texture: true, textureSet: true, textureQuality: 'standard', geometryQuality: 'standard' });
        case 'hunyuan3d-v3.1-rapid':
            return HUNYUAN_RAPID_USD;
        case 'hunyuan3d-v3-t2d':
            return HUNYUAN_NORMAL_USD;
        case 'meshy6-t2d':
            return MESHY6_USD;
        case 'rodin-v2-i2d':
            return RODIN_V2_USD;
        case 'rodin-v2.5-i2d':
            return RODIN_V25_BASE_USD;
        default:
            return 0;
    }
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 * @param {Record<string, unknown>} [selected]
 */
export function calculateThreeDPrice(model, selected = {}) {
    const modelId = lc(model?.id);
    const base = model?.price ?? getModelPrice(modelId, '3d');

    const textureSet = selected.texture != null;
    const params = {
        texture: selected.texture === true || selected.texture === 'true',
        textureSet,
        textureQuality: selected.texture_quality != null ? String(selected.texture_quality) : '',
        geometryQuality: selected.geometry_quality != null ? String(selected.geometry_quality) : '',
        quad: selected.quad === true || selected.quad === 'true',
        generateType: selected.generate_type != null ? String(selected.generate_type) : '',
        tier: selected.tier != null ? String(selected.tier) : '',
        addons: selected.addons != null ? String(selected.addons) : '',
    };

    const usd = threeDGenerationUSD(modelId, params);
    if (usd <= 0) {
        return Math.max(1, base);
    }

    const baseUSD = defaultThreeDUSD(modelId);
    return Math.max(1, cyberCoinsFromUSD(usd, base, baseUSD));
}
