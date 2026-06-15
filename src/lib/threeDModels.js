import { THREE_D_MODEL_DEFINITIONS } from '../config/threeDModels.js';
import { getThreeDModelCapabilities } from '../config/mediaModelOptions.js';

export function threeDModelRequiresImage(modelId) {
    return Boolean(getThreeDModelCapabilities(modelId).requiresImage);
}

export function threeDModelRequiresMultiImage(modelId) {
    return Boolean(getThreeDModelCapabilities(modelId).requiresMultiImage);
}

export function threeDModelRequiresPrompt(modelId) {
    const id = String(modelId || '').trim();
    return !threeDModelRequiresImage(id) && !threeDModelRequiresMultiImage(id);
}

export function getThreeDModelDefinition(modelId) {
    return THREE_D_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? null;
}
