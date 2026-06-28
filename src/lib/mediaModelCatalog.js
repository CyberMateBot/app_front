import { getModelPrice } from './modelPrices.js';
import { getImageModelCapabilities } from '../config/mediaModelOptions.js';

const KIND_BY_PAYLOAD_KEY = {
    image_models: 'image',
    video_models: 'video',
    audio_models: 'audio',
    three_d_models: '3d',
};

/** @type {Record<string, string>} */
export const IMAGE_BAR_TO_OPTION = {
    aspectRatio: 'aspect_ratio',
    resolution: 'resolution',
    quality: 'quality',
    outputFormat: 'output_format',
    webSearch: 'web_search',
    imageSearch: 'image_search',
    size: 'size',
    numImages: 'num_images',
};

/** @type {Record<string, string>} */
export const VIDEO_BAR_TO_OPTION = {
    aspectRatio: 'aspect_ratio',
    duration: 'duration',
    resolution: 'resolution',
    negativePrompt: 'negative_prompt',
    sound: 'sound',
    generateAudio: 'generate_audio',
    cameraFixed: 'camera_fixed',
    turboMode: 'turbo_mode',
    extendBy: 'extend_by',
};

/** @type {Record<string, string>} */
export const AUDIO_BAR_TO_OPTION = {
    language: 'language',
    voice: 'voice',
    speed: 'speed',
    emotion: 'emotion',
    duration: 'duration',
    numberOfSongs: 'number_of_songs',
    outputFormat: 'output_format',
    styleInstruction: 'style_instruction',
    referenceText: 'reference_text',
};

/** @type {Record<string, string>} */
export const THREE_D_BAR_TO_OPTION = {
    textureQuality: 'texture_quality',
    geometryQuality: 'geometry_quality',
    outputFormat: 'output_format',
    mode: 'mode',
    artStyle: 'art_style',
    topology: 'topology',
    tier: 'tier',
    material: 'material',
    geometryFileFormat: 'geometry_file_format',
    textureMode: 'texture_mode',
    texture: 'texture',
    quad: 'quad',
    generateType: 'generate_type',
    addons: 'addons',
    negativePrompt: 'negative_prompt',
};

/**
 * @param {unknown} raw
 * @param {import('./types').MediaKind} [kind]
 * @returns {import('./types').MediaModel | null}
 */
export function normalizeMediaModel(raw, kind = 'image') {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const model = /** @type {Record<string, unknown>} */ (raw);
    const id = String(model.id || '').trim();
    if (!id) {
        return null;
    }

    const resolvedKind = /** @type {import('./types').MediaKind} */ (
        String(model.kind || kind).trim() || kind
    );
    const price = Number(model.price);
    const options = Array.isArray(model.options)
        ? model.options.map(normalizeMediaOption).filter(Boolean)
        : [];

    return {
        id,
        kind: resolvedKind,
        price: Number.isFinite(price)
            ? price
            : getModelPrice(id, resolvedKind === '3d' ? '3d' : resolvedKind),
        supports_edit: Boolean(model.supports_edit),
        supports_multi: Boolean(model.supports_multi),
        options,
    };
}

/**
 * @param {unknown} raw
 * @returns {import('./types').MediaOption | null}
 */
function normalizeMediaOption(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const opt = /** @type {Record<string, unknown>} */ (raw);
    const key = String(opt.key || '').trim();
    if (!key) {
        return null;
    }

    const valuePricesRaw = opt.value_prices ?? opt.valuePrices;
    /** @type {Record<string, number> | undefined} */
    let value_prices;
    if (valuePricesRaw && typeof valuePricesRaw === 'object') {
        value_prices = {};
        for (const [priceKey, priceValue] of Object.entries(valuePricesRaw)) {
            const coins = Number(priceValue);
            if (Number.isFinite(coins)) {
                value_prices[priceKey] = coins;
            }
        }
    }

    return {
        key,
        type: /** @type {import('./types').MediaOption['type']} */ (opt.type || 'select'),
        values: Array.isArray(opt.values) ? opt.values.map((value) => String(value)) : undefined,
        default: opt.default,
        value_prices,
    };
}

/**
 * @param {unknown} payload
 * @returns {Record<string, import('./types').MediaModel>}
 */
export function buildMediaModelsCatalog(payload) {
    /** @type {Record<string, import('./types').MediaModel>} */
    const map = {};

    if (!payload || typeof payload !== 'object') {
        return map;
    }

    const data = /** @type {Record<string, unknown>} */ (payload);

    for (const [payloadKey, kind] of Object.entries(KIND_BY_PAYLOAD_KEY)) {
        const models = data[payloadKey]
            ?? (data.data && typeof data.data === 'object'
                ? /** @type {Record<string, unknown>} */ (data.data)[payloadKey]
                : null);

        if (!Array.isArray(models)) {
            continue;
        }

        for (const raw of models) {
            const model = normalizeMediaModel(raw, kind);
            if (model?.id) {
                map[model.id] = model;
            }
        }
    }

    return map;
}

/**
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {string} modelId
 */
export function getMediaModel(catalog, modelId) {
    return catalog?.[modelId] ?? null;
}

/**
 * @param {import('./types').MediaModel | null | undefined} model
 */
export function buildSelectedFromModel(model) {
    /** @type {Record<string, string|number|boolean>} */
    const selected = {};

    for (const opt of model?.options ?? []) {
        if (opt.default == null) {
            continue;
        }

        if (opt.type === 'boolean') {
            selected[opt.key] = opt.default === true || opt.default === 'true';
        } else if (opt.key === 'num_images' || opt.key === 'duration' || opt.key === 'extend_by') {
            selected[opt.key] = Number(opt.default) || opt.default;
        } else {
            selected[opt.key] = String(opt.default);
        }
    }

    return selected;
}

/**
 * @param {Record<string, string|number|boolean>} options
 * @param {Record<string, string>} barToOption
 */
export function barValuesToSelected(options, barToOption) {
    /** @type {Record<string, string|number|boolean>} */
    const selected = {};

    for (const [barKey, optionKey] of Object.entries(barToOption)) {
        const value = options[optionKey] ?? options[barKey];
        if (value == null || value === '') {
            continue;
        }
        selected[optionKey] = value;
    }

    return selected;
}

/**
 * @param {Record<string, string|number|boolean>} selected
 * @param {string} barKey
 * @param {string|number|boolean} value
 * @param {Record<string, string>} barToOption
 */
export function applyBarChange(selected, barKey, value, barToOption) {
    const optionKey = barToOption[barKey] ?? barKey;
    let normalized = value;

    if (
        optionKey === 'web_search'
        || optionKey === 'image_search'
        || optionKey === 'sound'
        || optionKey === 'generate_audio'
        || optionKey === 'camera_fixed'
        || optionKey === 'turbo_mode'
        || optionKey === 'texture'
        || optionKey === 'quad'
    ) {
        normalized = Boolean(value);
    } else if (
        optionKey === 'num_images'
        || optionKey === 'duration'
        || optionKey === 'extend_by'
        || optionKey === 'number_of_songs'
    ) {
        normalized = Number(value) || value;
    }

    return { ...selected, [optionKey]: normalized };
}

/**
 * @param {Record<string, string|number|boolean>} selected
 * @param {Record<string, string>} barToOption
 */
export function selectedToBarValues(selected, barToOption) {
    /** @type {Record<string, string|number|boolean>} */
    const values = {};

    for (const [barKey, optionKey] of Object.entries(barToOption)) {
        const value = selected[optionKey];
        if (value == null || value === '') {
            continue;
        }

        values[barKey] = (
            optionKey === 'num_images'
            || optionKey === 'number_of_songs'
            || optionKey === 'duration'
            || optionKey === 'extend_by'
        ) ? String(value) : value;
    }

    return values;
}

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {Record<string, string|number|boolean>} selected
 */
export function pickImageGenerateParams(modelId, catalog, selected) {
    return pickGenerateParams(modelId, catalog, selected, {
        aspect_ratio: 'aspectRatio',
        resolution: 'resolution',
        quality: 'quality',
        output_format: 'outputFormat',
        web_search: 'webSearch',
        image_search: 'imageSearch',
        size: 'size',
        num_images: 'numImages',
    });
}

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {Record<string, string|number|boolean>} selected
 */
export function pickVideoGenerateParams(modelId, catalog, selected) {
    return pickGenerateParams(modelId, catalog, selected, {
        aspect_ratio: 'aspectRatio',
        duration: 'duration',
        resolution: 'resolution',
        negative_prompt: 'negativePrompt',
        sound: 'sound',
        generate_audio: 'generateAudio',
        camera_fixed: 'cameraFixed',
        turbo_mode: 'turboMode',
        extend_by: 'extendBy',
    });
}

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {Record<string, string|number|boolean>} selected
 * @param {{ voiceClone?: boolean, audioBase64?: string, sourceAudioUrl?: string }} extras
 */
export function pickAudioGenerateParams(modelId, catalog, selected, extras = {}) {
    const params = pickGenerateParams(modelId, catalog, selected, {
        language: 'language',
        voice: 'voice',
        speed: 'speed',
        emotion: 'emotion',
        duration: 'duration',
        number_of_songs: 'numberOfSongs',
        output_format: 'outputFormat',
        style_instruction: 'styleInstruction',
        reference_text: 'referenceText',
    });

    if (extras.voiceClone) {
        params.mode = 'clone';
    }
    if (extras.audioBase64) {
        params.audioBase64 = extras.audioBase64;
    }
    if (extras.audioMimeType) {
        params.audioMimeType = extras.audioMimeType;
    }
    if (extras.sourceAudioUrl) {
        params.sourceAudioUrl = extras.sourceAudioUrl;
    }

    return params;
}

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {Record<string, string|number|boolean>} selected
 */
export function pickThreeDGenerateParams(modelId, catalog, selected) {
    return pickGenerateParams(modelId, catalog, selected, {
        negative_prompt: 'negativePrompt',
        texture_quality: 'textureQuality',
        output_format: 'outputFormat',
        geometry_quality: 'geometryQuality',
        mode: 'mode',
        art_style: 'artStyle',
        topology: 'topology',
        tier: 'tier',
        material: 'material',
        geometry_file_format: 'geometryFileFormat',
        texture_mode: 'textureMode',
        texture: 'texture',
        quad: 'quad',
        generate_type: 'generateType',
        addons: 'addons',
    });
}

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 * @param {Record<string, string|number|boolean>} selected
 * @param {Record<string, string>} keyMap
 */
function pickGenerateParams(modelId, catalog, selected, keyMap) {
    const apiModel = catalog?.[modelId];
    const optionKeys = apiModel?.options?.map((opt) => opt.key) ?? Object.keys(selected);
    /** @type {Record<string, unknown>} */
    const params = {};

    for (const key of optionKeys) {
        const value = selected[key];
        if (value == null || value === '') {
            continue;
        }

        const paramKey = keyMap[key];
        if (!paramKey) {
            continue;
        }

        if (
            key === 'web_search'
            || key === 'image_search'
            || key === 'sound'
            || key === 'generate_audio'
            || key === 'camera_fixed'
            || key === 'turbo_mode'
            || key === 'texture'
            || key === 'quad'
        ) {
            params[paramKey] = Boolean(value);
        } else if (key === 'num_images' || key === 'duration' || key === 'extend_by' || key === 'number_of_songs') {
            params[paramKey] = Number(value) || value;
        } else {
            params[paramKey] = value;
        }
    }

    return params;
}

/** @type {Record<string, string>} */
export const BAR_KEY_TO_OPTION = IMAGE_BAR_TO_OPTION;

/** @type {Record<string, string>} */
export const OPTION_KEY_TO_BAR = Object.fromEntries(
    Object.entries(IMAGE_BAR_TO_OPTION).map(([barKey, optionKey]) => [optionKey, barKey]),
);

export function buildImageOptionsFromModel(modelId, catalog) {
    const model = catalog?.[modelId];
    if (model?.options?.length) {
        return buildSelectedFromModel(model);
    }
    return {};
}

export function buildVideoSelectedFromApp(state) {
    return {
        aspect_ratio: state.aspectRatio,
        duration: state.duration,
        resolution: state.resolution,
        negative_prompt: state.negativePrompt,
        sound: state.sound,
        generate_audio: state.generateAudio,
        camera_fixed: state.cameraFixed,
        turbo_mode: state.turboMode,
        extend_by: state.extendBy,
    };
}

export function buildAudioSelectedFromApp(state) {
    return {
        language: state.language,
        voice: state.voice,
        speed: state.speed,
        emotion: state.emotion,
        duration: state.duration,
        number_of_songs: state.numberOfSongs,
        output_format: state.outputFormat,
        style_instruction: state.styleInstruction,
    };
}

export function buildThreeDSelectedFromApp(state) {
    return {
        negative_prompt: state.negativePrompt,
        texture_quality: state.textureQuality,
        output_format: state.outputFormat,
        geometry_quality: state.geometryQuality,
        mode: state.mode,
        art_style: state.artStyle,
        topology: state.topology,
        tier: state.tier,
        material: state.material,
        geometry_file_format: state.geometryFileFormat,
        texture_mode: state.textureMode,
    };
}

export function imageOptionsToBarValues(imageOptions) {
    return selectedToBarValues(imageOptions, IMAGE_BAR_TO_OPTION);
}

export function applyBarOptionChange(imageOptions, barKey, value) {
    return applyBarChange(imageOptions, barKey, value, IMAGE_BAR_TO_OPTION);
}

export const buildImageModelsMap = buildMediaModelsCatalog;
export const normalizeImageModel = (raw) => normalizeMediaModel(raw, 'image');
export const getCatalogImageModel = getMediaModel;

/**
 * @param {string} modelId
 * @param {Record<string, import('./types').MediaModel>} catalog
 */
export function resolveImageCapabilities(modelId, catalog) {
    const apiModel = catalog?.[modelId];
    const staticCaps = getImageModelCapabilities(modelId);

    if (!apiModel?.options?.length) {
        return staticCaps;
    }

    /** @type {Record<string, unknown>} */
    const options = { ...staticCaps.options };

    for (const opt of apiModel.options) {
        const barKey = OPTION_KEY_TO_BAR[opt.key] ?? opt.key;
        const existing = /** @type {Record<string, unknown>} */ (options[barKey] ?? {});
        options[barKey] = {
            ...existing,
            values: opt.values ?? existing.values,
            default: opt.type === 'boolean'
                ? (opt.default === true || opt.default === 'true')
                : (opt.key === 'num_images' ? Number(opt.default) || 1 : opt.default),
            valuePrices: opt.value_prices ?? existing.valuePrices,
        };
    }

    return { ...staticCaps, options };
}
