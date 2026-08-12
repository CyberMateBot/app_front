import { getVideoModelCapabilities } from '../config/mediaModelOptions.js';

/**
 * @typedef {import('./types').MediaModel | null | undefined} CatalogModel
 */

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function resolveVideoMediaFlags(modelId, catalogModel) {
    const local = getVideoModelCapabilities(modelId);

    return {
        requiresImage: Boolean(local.requiresImage || catalogModel?.requires_image),
        requiresVideo: Boolean(local.requiresVideo || catalogModel?.requires_video),
        requiresFirstFrame: Boolean(local.requiresFirstFrame),
        requiresLastFrame: Boolean(local.requiresLastFrame),
        supportsOptionalImage: Boolean(
            local.supportsOptionalImage
            && !local.requiresImage
            && !local.requiresFirstFrame
            && !local.requiresLastFrame,
        ),
    };
}

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

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function videoModelRequiresImage(modelId, catalogModel) {
    return resolveVideoMediaFlags(modelId, catalogModel).requiresImage;
}

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function videoModelRequiresVideo(modelId, catalogModel) {
    return resolveVideoMediaFlags(modelId, catalogModel).requiresVideo;
}

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function videoModelSupportsOptionalImage(modelId, catalogModel) {
    return resolveVideoMediaFlags(modelId, catalogModel).supportsOptionalImage;
}

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function videoModelRequiresFirstFrame(modelId, catalogModel) {
    return resolveVideoMediaFlags(modelId, catalogModel).requiresFirstFrame;
}

/**
 * @param {string} modelId
 * @param {CatalogModel} [catalogModel]
 */
export function videoModelRequiresLastFrame(modelId, catalogModel) {
    return resolveVideoMediaFlags(modelId, catalogModel).requiresLastFrame;
}

export function videoModelSupportsEdit(modelId) {
    return videoModelRequiresVideo(modelId);
}

export function klingModelIdForResolution(resolution) {
    const value = String(resolution || '').toLowerCase();

    if (value === '4k') {
        return 'kling-v3-4k';
    }

    if (value === '1080p') {
        return 'kling-v3-pro';
    }

    return 'kling-v3-std';
}

export function klingResolutionForModel(modelId) {
    const id = String(modelId || '').toLowerCase();

    if (id === 'kling-v3-4k') {
        return '4k';
    }

    if (id === 'kling-v3-pro') {
        return '1080p';
    }

    if (id.startsWith('kling-')) {
        return '720p';
    }

    return '';
}
