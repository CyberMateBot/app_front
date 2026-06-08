import { getVideoModelCapabilities } from '../config/mediaModelOptions.js';

/** @returns {string|null} */
export function getLastSessionVideoUrl(messages) {
    if (!Array.isArray(messages)) {
        return null;
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        if (message?.role !== 'assistant') {
            continue;
        }

        const url = String(message.videoUrl ?? message.video_url ?? '').trim();
        if (url) {
            return url;
        }
    }

    return null;
}

/** @returns {string|null} */
export function getLastSessionSourceImageUrl(messages) {
    if (!Array.isArray(messages)) {
        return null;
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        const url = String(message.sourceImageUrl ?? message.imageUrl ?? message.image_url ?? '').trim();
        if (url) {
            return url;
        }
    }

    return null;
}

export function videoModelRequiresImage(modelId) {
    return Boolean(getVideoModelCapabilities(modelId).requiresImage);
}

export function videoModelRequiresVideo(modelId) {
    return Boolean(getVideoModelCapabilities(modelId).requiresVideo);
}

export function videoModelSupportsEdit(modelId) {
    return videoModelRequiresVideo(modelId);
}

export function klingModelIdForQualityTier(tier) {
    return tier === 'pro' ? 'kling-v3-pro' : 'kling-v3-std';
}

export function klingQualityTierForModel(modelId) {
    return modelId === 'kling-v3-pro' ? 'pro' : 'std';
}
