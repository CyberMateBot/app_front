const GPT_ASPECT_RATIOS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const RES_1K_4K = ['1k', '2k', '4k'];
const QUALITY_LEVELS = ['low', 'medium', 'high'];

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
            resolution: { values: RES_1K_4K, default: '1k' },
            outputFormat: { values: ['png', 'jpeg', 'webp'], default: 'png' },
        },
    },
    'nano-banana-2': {
        supportsEdit: true,
        options: {
            aspectRatio: { values: GPT_ASPECT_RATIOS, default: '16:9' },
            resolution: { values: ['512px', '1k', '2k', '4k'], default: '1k' },
            outputFormat: { values: ['png', 'jpeg', 'webp'], default: 'png' },
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
        options: {
            aspectRatio: { values: ['1:1', '16:9', '9:16'], default: '1:1' },
        },
    },
    'alice-ai-art': {
        options: {},
    },
};

export const VIDEO_MODEL_CAPABILITIES = {
    'kling-v3-std': {
        options: {
            aspectRatio: { values: ['16:9', '9:16', '1:1'], default: '16:9' },
            duration: { values: [5, 10], default: 5 },
        },
    },
    'kling-v3-pro': {
        options: {
            aspectRatio: { values: ['16:9', '9:16', '1:1'], default: '16:9' },
            duration: { values: [5, 10], default: 5 },
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

    return defaults;
}

export function getImageModelCapabilities(modelId) {
    return IMAGE_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

export function getVideoModelCapabilities(modelId) {
    return VIDEO_MODEL_CAPABILITIES[modelId] ?? { options: {} };
}

export function getImageModelDefaults(modelId) {
    return buildDefaults(getImageModelCapabilities(modelId));
}

export function getVideoModelDefaults(modelId) {
    return buildDefaults(getVideoModelCapabilities(modelId));
}

export function imageModelSupportsEdit(modelId) {
    return Boolean(getImageModelCapabilities(modelId).supportsEdit);
}
