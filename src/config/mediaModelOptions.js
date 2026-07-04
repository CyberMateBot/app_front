const GPT_ASPECT_RATIOS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const RES_1K_4K = ['1k', '2k', '4k'];
const QUALITY_LEVELS = ['low', 'medium', 'high'];

/** @type {Record<string, { width: number, height: number }>} */
export const FLUX_ASPECT_DIMENSIONS = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
    '3:2': { width: 1152, height: 768 },
    '2:3': { width: 768, height: 1152 },
};

export function getFluxDimensionsForAspect(aspectRatio) {
    return FLUX_ASPECT_DIMENSIONS[aspectRatio] ?? FLUX_ASPECT_DIMENSIONS['1:1'];
}

/** @type {Record<string, { width: number, height: number }>} */
export const SEEDREAM_ASPECT_DIMENSIONS_2K = {
    '1:1': { width: 2048, height: 2048 },
    '16:9': { width: 2560, height: 1440 },
    '9:16': { width: 1440, height: 2560 },
    '4:3': { width: 2688, height: 2016 },
    '3:4': { width: 2016, height: 2688 },
    '3:2': { width: 2688, height: 1792 },
    '2:3': { width: 1792, height: 2688 },
};

const SEEDREAM_DIMENSIONS_MAX = 8192;

const QWEN_DIMENSIONS_MIN = 384;
const QWEN_DIMENSIONS_MAX = 2048;
const QWEN_ASPECT_VALUES = ['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

/** @type {Record<string, { width: number, height: number }>} */
export const QWEN_ASPECT_DIMENSIONS = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '4:3': { width: 1280, height: 960 },
    '3:4': { width: 960, height: 1280 },
    '3:2': { width: 1280, height: 854 },
    '2:3': { width: 854, height: 1280 },
};

const Z_IMAGE_DIMENSIONS_MIN = 256;
const Z_IMAGE_DIMENSIONS_MAX = 1536;
const Z_IMAGE_ASPECT_VALUES = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

const Z_IMAGE_BASE_OPTIONS = {
    aspectRatio: { values: Z_IMAGE_ASPECT_VALUES, default: '1:1' },
    dimensions: {
        min: Z_IMAGE_DIMENSIONS_MIN,
        max: Z_IMAGE_DIMENSIONS_MAX,
        defaultWidth: 1024,
        defaultHeight: 1024,
    },
    seed: { default: -1 },
    outputFormat: { values: ['jpeg', 'png', 'webp'], default: 'jpeg' },
};

export function isSeedreamImageModel(modelId) {
    const id = String(modelId || '').trim();
    return id === 'seedream-v4.5' || id === 'seedream-v5.0-lite';
}

export function getSeedreamDimensionsForAspect(aspectRatio) {
    return SEEDREAM_ASPECT_DIMENSIONS_2K[aspectRatio] ?? SEEDREAM_ASPECT_DIMENSIONS_2K['1:1'];
}

export function isQwenImageModel(modelId) {
    const id = String(modelId || '').trim();
    return id === 'qwen-image'
        || id === 'qwen-image-2512'
        || id === 'qwen-image-2.0'
        || id === 'qwen-image-2.0-pro';
}

export function getQwenDimensionsForAspect(aspectRatio) {
    if (!aspectRatio || aspectRatio === 'auto') {
        return null;
    }
    return QWEN_ASPECT_DIMENSIONS[aspectRatio] ?? QWEN_ASPECT_DIMENSIONS['1:1'];
}

export function isZImageModel(modelId) {
    const id = String(modelId || '').trim();
    return id === 'z-image-base' || id === 'z-image-turbo';
}

export function getZImageDimensionsForAspect(aspectRatio) {
    return FLUX_ASPECT_DIMENSIONS[aspectRatio] ?? FLUX_ASPECT_DIMENSIONS['1:1'];
}

const QWEN_IMAGE_BASE_OPTIONS = {
    aspectRatio: { values: QWEN_ASPECT_VALUES, default: 'auto' },
    dimensions: {
        min: QWEN_DIMENSIONS_MIN,
        max: QWEN_DIMENSIONS_MAX,
        defaultWidth: 1024,
        defaultHeight: 1024,
    },
    seed: { default: -1 },
};

export const IMAGE_MODEL_CAPABILITIES = {
    'nano-banana': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: ['1:1', '16:9', '9:16', '4:3', '3:2'], default: '1:1' },
            outputFormat: { values: ['png', 'jpeg', 'webp'], default: 'png' },
        },
    },
    'nano-banana-pro': {
        supportsEdit: true,
        supportsMulti: true,
        options: {
            aspectRatio: { values: ['1:1', '3:2', '4:3', '16:9', '21:9'], default: '16:9' },
            resolution: {
                values: RES_1K_4K,
                default: '1k',
                valuePrices: { '1k': 0, '2k': 0, '4k': 29 },
            },
            outputFormat: { values: ['png', 'jpeg', 'webp'], default: 'png' },
        },
    },
    'nano-banana-2': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: GPT_ASPECT_RATIOS, default: '16:9' },
            resolution: {
                values: ['0.5k', '1k', '2k', '4k'],
                default: '1k',
                valuePrices: { '0.5k': -8, '1k': 0, '2k': 11, '4k': 22 },
            },
            outputFormat: { values: ['png', 'jpeg'], default: 'png' },
            webSearch: { default: false, valuePrices: { true: 4 } },
            imageSearch: { default: false, valuePrices: { true: 4 } },
        },
    },
    'gpt-image-2': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: GPT_ASPECT_RATIOS, default: '16:9' },
            resolution: { values: RES_1K_4K, default: '1k' },
            quality: { values: QUALITY_LEVELS, default: 'medium' },
            outputFormat: { values: ['png'], default: 'png' },
        },
    },
    'gpt-image-1.5': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: GPT_ASPECT_RATIOS, default: '1:1' },
            resolution: { values: RES_1K_4K, default: '1k' },
            quality: { values: QUALITY_LEVELS, default: 'medium' },
            outputFormat: { values: ['png'], default: 'png' },
        },
    },
    'flux-dev': {
        supportsEdit: true,
        options: {
            aspectRatio: {
                values: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                default: '1:1',
            },
            dimensions: { min: 256, max: 2048, defaultWidth: 1024, defaultHeight: 1024 },
            seed: { default: -1 },
        },
    },
    'alice-ai-art': {
        options: {},
    },
    'seedream-v4.5': {
        supportsEdit: true,
        supportsMulti: true,
        options: {
            aspectRatio: {
                values: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                default: '1:1',
            },
            dimensions: { min: 512, max: SEEDREAM_DIMENSIONS_MAX, defaultWidth: 2048, defaultHeight: 2048 },
            outputFormat: { values: ['jpeg', 'png', 'webp'], default: 'jpeg' },
        },
    },
    'seedream-v5.0-lite': {
        supportsEdit: true,
        supportsMulti: true,
        options: {
            aspectRatio: {
                values: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                default: '1:1',
            },
            dimensions: { min: 512, max: SEEDREAM_DIMENSIONS_MAX, defaultWidth: 2048, defaultHeight: 2048 },
            outputFormat: { values: ['jpeg', 'png', 'webp'], default: 'jpeg' },
        },
    },
    'qwen-image': {
        options: {
            ...QWEN_IMAGE_BASE_OPTIONS,
        },
    },
    'qwen-image-2512': {
        options: {
            ...QWEN_IMAGE_BASE_OPTIONS,
            negativePrompt: { default: '' },
        },
    },
    'qwen-image-2.0': {
        options: {
            ...QWEN_IMAGE_BASE_OPTIONS,
            aspectRatio: { values: QWEN_ASPECT_VALUES, default: '16:9' },
        },
    },
    'qwen-image-2.0-pro': {
        supportsEdit: true,
        options: {
            ...QWEN_IMAGE_BASE_OPTIONS,
        },
    },
    'z-image-base': {
        supportsEdit: true,
        options: {
            ...Z_IMAGE_BASE_OPTIONS,
        },
    },
    'z-image-turbo': {
        options: {
            ...Z_IMAGE_BASE_OPTIONS,
        },
    },
    'grok-imagine-edit': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4'], default: 'auto' },
            resolution: {
                values: ['1k', '2k'],
                default: '1k',
                valuePrices: { '2k': 6 },
            },
            numImages: {
                values: ['1', '2', '3', '4'],
                default: '1',
                valuePrices: { '2': 25, '3': 50, '4': 75 },
            },
            outputFormat: { values: ['jpeg', 'png', 'webp'], default: 'jpeg' },
        },
    },
};

const SEEDANCE_V15_ASPECT = ['16:9', '9:16', '4:3', '1:1', '3:4', '21:9'];
const SEEDANCE_V2_ASPECT = ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'];
const KLING_DURATIONS = Array.from({ length: 13 }, (_, index) => index + 3);
const KLING_CAMERA_MOVEMENTS = [
    'auto', 'simple', 'down_back', 'forward_up', 'right_turn_forward', 'left_turn_forward',
];
const KLING_CAMERA_AXES = ['horizontal', 'vertical', 'pan', 'tilt', 'roll', 'zoom'];

const KLING_RESOLUTIONS = ['720p', '1080p', '4k'];

const KLING_BASE_OPTIONS = {
    aspectRatio: { values: ['16:9', '9:16', '1:1'], default: '16:9' },
    duration: { values: KLING_DURATIONS, default: 5, presets: [5, 10] },
    resolution: { values: KLING_RESOLUTIONS, default: '720p' },
    negativePrompt: { default: '' },
    cameraMovement: { values: KLING_CAMERA_MOVEMENTS, default: 'auto' },
    cameraAxes: { keys: KLING_CAMERA_AXES, min: -10, max: 10, default: 0 },
};

export const VIDEO_MODEL_CAPABILITIES = {
    'kling-v3-std': {
        supportsOptionalImage: true,
        options: {
            ...KLING_BASE_OPTIONS,
            resolution: { values: KLING_RESOLUTIONS, default: '720p' },
        },
    },
    'kling-v3-pro': {
        supportsOptionalImage: true,
        options: {
            ...KLING_BASE_OPTIONS,
            resolution: { values: KLING_RESOLUTIONS, default: '1080p' },
            sound: { default: false },
        },
    },
    'kling-v3-4k': {
        supportsOptionalImage: true,
        options: {
            ...KLING_BASE_OPTIONS,
            resolution: { values: KLING_RESOLUTIONS, default: '4k' },
            sound: { default: false },
        },
    },
    'seedance-v1-pro-i2v': {
        requiresImage: true,
        options: {
            aspectRatio: { values: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'], default: '16:9' },
            duration: { values: [2, 5, 8, 10, 12], default: 5 },
            cameraFixed: { default: false },
        },
    },
    'seedance-v1.5-i2v-fast': {
        requiresImage: true,
        options: {
            aspectRatio: { values: SEEDANCE_V15_ASPECT, default: '16:9' },
            duration: { values: [4, 5, 8, 10, 12], default: 5 },
            resolution: { values: ['720p', '1080p'], default: '720p' },
            generateAudio: { default: true },
            cameraFixed: { default: false },
        },
    },
    'seedance-v1.5-t2v-fast': {
        supportsOptionalImage: true,
        options: {
            aspectRatio: { values: SEEDANCE_V15_ASPECT, default: '16:9' },
            duration: { values: [4, 5, 8, 10, 12], default: 5 },
            resolution: { values: ['720p', '1080p'], default: '720p' },
            generateAudio: { default: true },
            cameraFixed: { default: false },
        },
    },
    'seedance-v1.5-i2v-spicy': {
        requiresImage: true,
        options: {
            aspectRatio: { values: SEEDANCE_V15_ASPECT, default: '16:9' },
            duration: { values: [4, 5, 8, 10, 12], default: 5 },
            resolution: { values: ['720p', '1080p'], default: '720p' },
            generateAudio: { default: true },
            cameraFixed: { default: false },
        },
    },
    'seedance-v2-video-edit': {
        requiresVideo: true,
        options: {
            aspectRatio: { values: SEEDANCE_V2_ASPECT, default: '16:9' },
            duration: { values: [4, 5, 8, 10, 12, 15], default: 5 },
            resolution: { values: ['480p', '720p', '1080p'], default: '720p' },
            turboMode: { default: false },
        },
    },
    'seedance-v2-video-extend': {
        requiresVideo: true,
        options: {
            aspectRatio: { values: SEEDANCE_V2_ASPECT, default: '16:9' },
            duration: { values: [4, 5, 8, 10, 12, 15], default: 5 },
            resolution: { values: ['720p', '1080p'], default: '720p' },
        },
    },
    'wan-2.5-t2v': {
        supportsOptionalImage: true,
        options: {
            duration: { values: [2, 5, 10, 15], default: 5 },
            resolution: { values: ['480P', '720P', '1080P'], default: '720P' },
            negativePrompt: { default: '' },
        },
    },
    'wan-2.6-i2v': { requiresImage: true, options: { duration: { values: [5, 8], default: 5 }, resolution: { values: ['480P', '720P'], default: '720P' } } },
    'wan-2.7-t2v': { supportsOptionalImage: true, options: { duration: { values: [5, 10, 15], default: 5 }, resolution: { values: ['720P', '1080P'], default: '1080P' }, negativePrompt: { default: '' } } },
    'wan-2.7-flf': {
        requiresFirstFrame: true,
        requiresLastFrame: true,
        options: { duration: { values: [5, 10], default: 5 } },
    },
    'wan-2.7-grid': { requiresImage: true, options: { duration: { values: [5, 10], default: 5 } } },
    'wan-2.7-edit': { requiresVideo: true, options: {} },
    'wan-2.2-spicy-i2v': { requiresImage: true, options: { duration: { values: [5, 8], default: 5 }, resolution: { values: ['480p', '720p'], default: '720p' } } },
    'happyhorse-t2v': { supportsOptionalImage: true, options: { aspectRatio: { values: ['16:9', '9:16', '1:1', '4:3', '3:4'], default: '16:9' }, duration: { values: [3, 5, 10, 15], default: 5 }, resolution: { values: ['720p', '1080p'], default: '720p' } } },
    'happyhorse-i2v': { requiresImage: true, options: { duration: { values: [3, 5, 10, 15], default: 5 }, resolution: { values: ['720p', '1080p'], default: '720p' } } },
    'happyhorse-ref2v': { requiresImage: true, options: { duration: { values: [3, 5, 10, 15], default: 5 }, resolution: { values: ['720p', '1080p'], default: '720p' } } },
    'happyhorse-video-edit': { requiresVideo: true, options: {} },
    'happyhorse-video-extend': { requiresVideo: true, options: { duration: { values: [3, 5, 10], default: 5 } } },
    'sora-2-t2v': { supportsOptionalImage: true, options: { duration: { values: [5, 10], default: 5 }, resolution: { values: ['720p', '1080p'], default: '720p' } } },
    'sora-2-i2v': { requiresImage: true, options: { duration: { values: [5, 10], default: 5 } } },
    'sora-2-t2v-pro': { supportsOptionalImage: true, options: { duration: { values: [5, 10], default: 5 } } },
    'veo-3.1-extend': {
        requiresVideo: true,
        options: {
            duration: { values: [4, 7], default: 4 },
            resolution: { values: ['720p', '1080p'], default: '1080p' },
            negativePrompt: { default: '' },
            seed: { default: -1 },
            generateAudio: { default: true },
        },
    },
    'vidu-q3-i2v-spicy': { requiresImage: true, options: { duration: { values: [1, 5, 10, 16], default: 5 }, resolution: { values: ['540p', '720p', '1080p'], default: '720p' }, generateAudio: { default: true } } },
    'hailuo-2.3-t2v': {
        options: {
            duration: { values: [6, 10], default: 6 },
            enablePromptExpansion: { default: true },
        },
    },
    'hailuo-2.3-i2v-fast': {
        requiresImage: true,
        options: {
            duration: { values: [6, 10], default: 6 },
            enablePromptExpansion: { default: true },
            goFast: { default: true },
        },
    },
    'hailuo-2.3-i2v-pro': {
        requiresImage: true,
        options: {
            duration: { values: [5], default: 5 },
            enablePromptExpansion: { default: true },
        },
    },
};

function buildDefaults(capabilities) {
    const defaults = {};
    const { options = {} } = capabilities ?? {};

    if (options.aspectRatio) {
        defaults.aspectRatio = options.aspectRatio.default;
    }
    if (options.resolution) {
        defaults.resolution = options.resolution.default;
    }
    if (options.quality) {
        defaults.quality = options.quality.default;
    }
    if (options.outputFormat) {
        defaults.outputFormat = options.outputFormat.default;
    }
    if (options.duration) {
        defaults.duration = options.duration.default;
    }
    if (options.generateAudio) {
        defaults.generateAudio = options.generateAudio.default;
    }
    if (options.cameraFixed) {
        defaults.cameraFixed = options.cameraFixed.default;
    }
    if (options.turboMode) {
        defaults.turboMode = options.turboMode.default;
    }
    if (options.enablePromptExpansion) {
        defaults.enablePromptExpansion = options.enablePromptExpansion.default !== false;
    }
    if (options.goFast) {
        defaults.goFast = options.goFast.default !== false;
    }
    if (options.negativePrompt) {
        defaults.negativePrompt = options.negativePrompt.default ?? '';
    }
    if (options.cameraMovement) {
        defaults.cameraMovement = options.cameraMovement.default ?? 'auto';
    }
    if (options.cameraAxes) {
        defaults.cameraHorizontal = options.cameraAxes.default ?? 0;
        defaults.cameraVertical = options.cameraAxes.default ?? 0;
        defaults.cameraPan = options.cameraAxes.default ?? 0;
        defaults.cameraTilt = options.cameraAxes.default ?? 0;
        defaults.cameraRoll = options.cameraAxes.default ?? 0;
        defaults.cameraZoom = options.cameraAxes.default ?? 0;
    }
    if (options.sound) {
        defaults.sound = options.sound.default ?? false;
    }
    if (options.webSearch) {
        defaults.webSearch = Boolean(options.webSearch.default);
    }
    if (options.imageSearch) {
        defaults.imageSearch = Boolean(options.imageSearch.default);
    }
    if (options.size) {
        defaults.size = options.size.default;
    }
    if (options.numImages) {
        defaults.numImages = options.numImages.default ?? '1';
    }
    if (options.seed) {
        defaults.seed = options.seed.default ?? -1;
    }
    if (options.dimensions && options.aspectRatio && options.dimensions.max === SEEDREAM_DIMENSIONS_MAX) {
        const dims = getSeedreamDimensionsForAspect(options.aspectRatio.default ?? '1:1');
        defaults.width = dims.width;
        defaults.height = dims.height;
        defaults.size = `${dims.width}*${dims.height}`;
    } else if (options.dimensions && options.aspectRatio && options.dimensions.min === QWEN_DIMENSIONS_MIN) {
        const dims = getQwenDimensionsForAspect(options.aspectRatio.default ?? 'auto');
        if (dims) {
            defaults.width = dims.width;
            defaults.height = dims.height;
        } else {
            defaults.width = options.dimensions.defaultWidth ?? 1024;
            defaults.height = options.dimensions.defaultHeight ?? 1024;
        }
        defaults.size = `${defaults.width}*${defaults.height}`;
    } else if (options.dimensions && options.aspectRatio && options.dimensions.max === Z_IMAGE_DIMENSIONS_MAX) {
        const dims = getZImageDimensionsForAspect(options.aspectRatio.default ?? '1:1');
        defaults.width = dims.width;
        defaults.height = dims.height;
        defaults.size = `${dims.width}*${dims.height}`;
    } else if (options.dimensions && options.aspectRatio) {
        const dims = getFluxDimensionsForAspect(options.aspectRatio.default ?? '1:1');
        defaults.width = dims.width;
        defaults.height = dims.height;
    } else if (options.dimensions) {
        defaults.width = options.dimensions.defaultWidth ?? 1024;
        defaults.height = options.dimensions.defaultHeight ?? 1024;
    }
    if (options.language) {
        defaults.language = options.language.default;
    }
    if (options.voice) {
        defaults.voice = options.voice.default;
    }
    if (options.styleInstruction) {
        defaults.styleInstruction = options.styleInstruction.default ?? '';
    }
    if (options.referenceText) {
        defaults.referenceText = options.referenceText.default ?? '';
    }
    if (options.speed) {
        defaults.speed = options.speed.default ?? '1.0';
    }
    if (options.emotion) {
        defaults.emotion = options.emotion.default;
    }
    if (options.similarity) {
        defaults.similarity = options.similarity.default ?? 1.0;
    }
    if (options.stability) {
        defaults.stability = options.stability.default ?? 0.5;
    }
    if (options.speakerBoost) {
        defaults.speakerBoost = options.speakerBoost.default ?? true;
    }
    if (options.numberOfSongs) {
        defaults.numberOfSongs = options.numberOfSongs.default ?? '1';
    }
    if (options.textureQuality) {
        defaults.textureQuality = options.textureQuality.default;
    }
    if (options.geometryQuality) {
        defaults.geometryQuality = options.geometryQuality.default;
    }
    if (options.mode) {
        defaults.mode = options.mode.default;
    }
    if (options.artStyle) {
        defaults.artStyle = options.artStyle.default;
    }
    if (options.topology) {
        defaults.topology = options.topology.default;
    }
    if (options.tier) {
        defaults.tier = options.tier.default;
    }
    if (options.material) {
        defaults.material = options.material.default;
    }
    if (options.geometryFileFormat) {
        defaults.geometryFileFormat = options.geometryFileFormat.default;
    }
    if (options.textureMode) {
        defaults.textureMode = options.textureMode.default;
    }
    if (options.generateType) {
        defaults.generateType = options.generateType.default;
    }
    if (options.faceCount) {
        defaults.faceCount = options.faceCount.default ?? 500000;
    }
    if (options.enablePbr) {
        defaults.enablePbr = options.enablePbr.default === true;
    }
    if (options.enableGeometry) {
        defaults.enableGeometry = options.enableGeometry.default === true;
    }

    return defaults;
}

export function getImageModelCapabilities(modelId) {
    return IMAGE_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

const QWEN3_LANGUAGES = [
    'auto', 'Chinese', 'English', 'German', 'Italian', 'Portuguese',
    'Spanish', 'Japanese', 'Korean', 'French', 'Russian',
];

const QWEN3_VOICES = [
    'Vivian', 'Serena', 'Ono_Anna', 'Sohee',
    'Uncle_Fu', 'Dylan', 'Eric', 'Ryan', 'Aiden',
];

export const AUDIO_MODEL_CAPABILITIES = {
    'qwen3-tts': {
        supportsClone: true,
        options: {
            language: { values: QWEN3_LANGUAGES, default: 'auto' },
            voice: { values: QWEN3_VOICES, default: 'Dylan' },
            styleInstruction: { default: '' },
            referenceText: { default: '' },
        },
    },
    omnivoice: {
        options: {
            styleInstruction: { default: 'female, young adult, russian accent' },
            speed: { values: ['0.8', '1.0', '1.2', '1.5'], default: '1.0' },
        },
    },
    'elevenlabs-v3': {
        options: {
            voice: {
                values: [
                    'Alice', 'Aria', 'Roger', 'Sarah', 'Laura', 'Charlie', 'George',
                    'Callum', 'River', 'Liam', 'Charlotte', 'Matilda', 'Will', 'Jessica',
                    'Eric', 'Chris', 'Brian', 'Daniel', 'Lily', 'Bill',
                ],
                default: 'Alice',
            },
            similarity: { min: 0, max: 1, step: 0.05, default: 1.0 },
            stability: { min: 0, max: 1, step: 0.05, default: 0.5 },
            speakerBoost: { default: true },
        },
    },
    'minimax-speech-2.6': {
        options: {
            voice: {
                values: [
                    'Wise_Woman', 'Friendly_Person', 'Inspirational_girl', 'Deep_Voice_Man',
                    'Calm_Woman', 'Casual_Guy', 'Lively_Girl', 'Patient_Man', 'Young_Knight',
                    'Determined_Man', 'Lovely_Girl', 'Decent_Boy', 'Imposing_Manner', 'Elegant_Man',
                    'Abbess', 'Sweet_Girl_2', 'Exuberant_Girl',
                ],
                default: 'Friendly_Person',
            },
            emotion: {
                values: ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'],
                default: 'happy',
            },
        },
    },
    'mureka-v9': {
        options: {
            styleInstruction: { default: 'upbeat pop, electronic, 120bpm, female vocals, energetic' },
            numberOfSongs: { values: ['1', '2', '3'], default: '1' },
            outputFormat: { values: ['mp3', 'wav', 'flac'], default: 'mp3' },
        },
    },
    'ace-step-1.5': {
        options: {
            styleInstruction: { default: 'lo-fi, chill, ambient, piano, rainy mood' },
            duration: { values: [30, 60, 120, 180, 240], presets: [30, 60, 120], default: 60 },
        },
    },
};

export function getVideoModelCapabilities(modelId) {
    return VIDEO_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

export function videoModelIsKling(modelId) {
    return String(modelId || '').startsWith('kling-');
}

export function getAudioModelCapabilities(modelId) {
    return AUDIO_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

export function getImageModelDefaults(modelId) {
    return buildDefaults(getImageModelCapabilities(modelId));
}

export function getVideoModelDefaults(modelId) {
    return buildDefaults(getVideoModelCapabilities(modelId));
}

export function getAudioModelDefaults(modelId) {
    return buildDefaults(getAudioModelCapabilities(modelId));
}

export function audioModelSupportsClone(modelId) {
    return Boolean(getAudioModelCapabilities(modelId).supportsClone);
}

export function audioModelIsMusic(modelId) {
    return modelId === 'mureka-v9' || modelId === 'ace-step-1.5';
}

export const THREE_D_MODEL_CAPABILITIES = {
    'tripo3d-v2.5-i2d': {
        requiresImage: true,
        options: {
            textureQuality: { values: ['standard', 'detailed'], default: 'detailed' },
            outputFormat: { values: ['glb', 'fbx', 'obj', 'usdz', 'stl'], default: 'glb' },
        },
    },
    'tripo3d-v2.5-multiview': {
        requiresMultiImage: true,
        options: {
            textureQuality: { values: ['standard', 'detailed'], default: 'detailed' },
        },
    },
    'tripo3d-h3.1-t2d': {
        options: {
            textureQuality: { values: ['standard', 'detailed'], default: 'detailed' },
            geometryQuality: { values: ['standard', 'detailed'], default: 'detailed' },
            negativePrompt: { default: '' },
        },
    },
    'tripo3d-h3.1-i2d': {
        requiresImage: true,
        options: {
            textureQuality: { values: ['standard', 'detailed'], default: 'detailed' },
            geometryQuality: { values: ['standard', 'detailed'], default: 'detailed' },
        },
    },
    'hunyuan3d-v3-t2d': {
        options: {
            negativePrompt: { default: '' },
            generateType: { values: ['Normal', 'LowPoly', 'Geometry'], default: 'Normal' },
            faceCount: { min: 40000, max: 1500000, default: 500000, step: 10000 },
            enablePbr: { default: false },
        },
    },
    'hunyuan3d-v3.1-rapid': {
        options: {
            generateType: { values: ['Normal', 'Geometry'], default: 'Normal' },
            faceCount: { min: 40000, max: 1500000, default: 500000, step: 10000 },
            enablePbr: { default: false },
        },
    },
    'hunyuan3d-v3.1-rapid-i2d': {
        requiresImage: true,
        options: {
            enablePbr: { default: false },
            enableGeometry: { default: false },
        },
    },
    'meshy6-t2d': {
        options: {
            mode: { values: ['full', 'preview'], default: 'full' },
            artStyle: { values: ['realistic', 'sculpture'], default: 'realistic' },
            topology: { values: ['quad', 'triangle'], default: 'quad' },
        },
    },
    'rodin-v2-i2d': {
        requiresImage: true,
        options: {
            tier: { values: ['Gen-2-Low', 'Gen-2-Medium', 'Gen-2-High'], default: 'Gen-2-Medium' },
            material: { values: ['PBR', 'Shaded', 'All', 'None'], default: 'PBR' },
        },
    },
    'rodin-v2.5-i2d': {
        requiresImage: true,
        options: {
            tier: {
                values: ['Gen-2.5-Extreme-Low', 'Gen-2.5-Low', 'Gen-2.5-Medium', 'Gen-2.5-High', 'Gen-2.5-Extreme-High'],
                default: 'Gen-2.5-Medium',
            },
            geometryFileFormat: { values: ['glb', 'usdz', 'fbx', 'obj', 'stl'], default: 'glb' },
            textureMode: { values: ['legacy', 'low', 'medium', 'high'], default: 'medium' },
        },
    },
};

export function getThreeDModelCapabilities(modelId) {
    return THREE_D_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

export function getThreeDModelDefaults(modelId) {
    return buildDefaults(getThreeDModelCapabilities(modelId));
}

export function imageModelSupportsEdit(modelId) {
    return Boolean(getImageModelCapabilities(modelId).supportsEdit);
}

export function imageModelSupportsSourceUpload(modelId) {
    const caps = getImageModelCapabilities(modelId);
    return Boolean(caps.supportsEdit || caps.supportsMulti);
}
