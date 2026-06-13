import { getSelectorItemForModelId } from './modelGroups.js';

export function getModelSessionScope(modelId, selectorItems) {
    const item = getSelectorItemForModelId(selectorItems, modelId);

    if (!item) {
        return String(modelId || '').trim() || 'default';
    }

    if (item.type === 'single') {
        return item.model.id;
    }

    return item.id;
}
