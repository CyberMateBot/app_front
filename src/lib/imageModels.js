import { imageModelSupportsEdit as supportsEdit } from '../config/mediaModelOptions.js';

export { imageModelSupportsEdit } from '../config/mediaModelOptions.js';

/** @returns {string|null} */
export function getLastSessionImageUrl(messages) {
    if (!Array.isArray(messages)) {
        return null;
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        if (message?.role !== 'assistant') {
            continue;
        }

        const url = String(message.imageUrl ?? message.image_url ?? '').trim();
        if (url) {
            return url;
        }
    }

    return null;
}

export function isEditableImageModel(modelId) {
    return supportsEdit(modelId);
}
