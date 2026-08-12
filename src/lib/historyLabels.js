import { AUDIO_MODEL_IDS, IMAGE_MODEL_IDS, VIDEO_MODEL_IDS } from '../api/telegramApi.js';
import { getModelLabel, isKnownTextModelId, resolveTextModelId } from './textModels.js';

export function resolveHistoryTopicModel(topic, effectiveTextModels) {
    const model = String(topic?.model || '').toLowerCase();

    if (isKnownTextModelId(model, effectiveTextModels)) {
        return resolveTextModelId(model, effectiveTextModels);
    }

    if (IMAGE_MODEL_IDS.includes(model)) {
        return model;
    }

    if (VIDEO_MODEL_IDS.includes(model)) {
        return model;
    }

    if (AUDIO_MODEL_IDS.includes(model)) {
        return model;
    }

    const category = String(topic?.category || model).toLowerCase();

    if (IMAGE_MODEL_IDS.includes(category)) {
        return category;
    }

    if (VIDEO_MODEL_IDS.includes(category)) {
        return category;
    }

    if (AUDIO_MODEL_IDS.includes(category)) {
        return category;
    }

    if (category.includes('image') || category.includes('photo')) {
        return IMAGE_MODEL_IDS[0];
    }

    if (category.includes('video')) {
        return VIDEO_MODEL_IDS[0];
    }

    if (category.includes('audio') || category.includes('voice')) {
        return AUDIO_MODEL_IDS[0];
    }

    return resolveTextModelId(model, effectiveTextModels);
}

export function getHistoryTopicLabel({
    topic,
    effectiveTextModels,
    textModelSelectorItems,
    imageModelSelectorItems,
    videoModelSelectorItems,
    audioModelSelectorItems,
    imageDefinitions,
    videoDefinitions,
    audioDefinitions,
    text,
    getImageSelectorChipLabel,
    getVideoSelectorChipLabel,
    getAudioSelectorChipLabel,
}) {
    const modelId = resolveHistoryTopicModel(topic, effectiveTextModels);

    if (IMAGE_MODEL_IDS.includes(modelId)) {
        const imageModel = imageDefinitions.find((model) => model.id === modelId);
        if (imageModel) {
            const imageSelectorItem = imageModelSelectorItems.find((item) => (
                item.type === 'single'
                    ? item.model.id === modelId
                    : item.variants.some((variant) => variant.id === modelId)
            ));
            if (imageSelectorItem?.type === 'tiered') {
                return getImageSelectorChipLabel(imageSelectorItem, text);
            }
            return text[imageModel.nameKey] ?? imageModel.id;
        }
    }

    if (VIDEO_MODEL_IDS.includes(modelId)) {
        const videoModel = videoDefinitions.find((model) => model.id === modelId);
        if (videoModel) {
            const videoSelectorItem = videoModelSelectorItems.find((item) => (
                item.type === 'single'
                    ? item.model.id === modelId
                    : item.variants.some((variant) => variant.id === modelId)
            ));
            if (videoSelectorItem?.type === 'tiered') {
                return getVideoSelectorChipLabel(videoSelectorItem, text);
            }
            return text[videoModel.nameKey] ?? videoModel.id;
        }
    }

    if (AUDIO_MODEL_IDS.includes(modelId)) {
        const audioModel = audioDefinitions.find((model) => model.id === modelId);
        if (audioModel) {
            const audioSelectorItem = audioModelSelectorItems.find((item) => (
                item.type === 'single'
                    ? item.model.id === modelId
                    : item.variants.some((variant) => variant.id === modelId)
            ));
            if (audioSelectorItem?.type === 'tiered') {
                return getAudioSelectorChipLabel(audioSelectorItem, text);
            }
            return text[audioModel.nameKey] ?? audioModel.id;
        }
    }

    return getModelLabel(effectiveTextModels, modelId, textModelSelectorItems) || modelId;
}
