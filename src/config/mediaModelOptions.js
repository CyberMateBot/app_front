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
            resolution: { values: ['0.5k', '1k', '2k', '4k'], default: '1k' },
            outputFormat: { values: ['png', 'jpeg'], default: 'png' },
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

const SEEDANCE_V15_ASPECT = ['16:9', '9:16', '4:3', '1:1', '3:4', '21:9'];
const SEEDANCE_V2_ASPECT = ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'];

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
};

export function getVideoModelCapabilities(modelId) {
    return VIDEO_MODEL_CAPABILITIES[modelId] ?? { options: {} };
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

export function imageModelSupportsEdit(modelId) {
    return Boolean(getImageModelCapabilities(modelId).supportsEdit);
}

export function imageModelSupportsSourceUpload(modelId) {
    const id = String(modelId || '').trim().toLowerCase();
    return id === 'nano-banana'
        || id === 'nano-banana-pro'
        || id === 'nano-banana-2';
}
