import { getModelPrice } from './modelPrices.js';

const CATEGORY_BY_KIND = {
    text: 'text',
    media: 'image',
    video: 'video',
    audio: 'audio',
    '3d': '3d',
};

export function getAiVariantOptions(selectorItem, text, kind = 'media') {
    if (!selectorItem) {
        return [];
    }

    const category = CATEGORY_BY_KIND[kind] ?? 'image';

    if (selectorItem.type === 'single') {
        const model = selectorItem.model;

        if (kind === 'text') {
            return [{
                id: model.id,
                label: model.label,
                priceCoins: getModelPrice(model.id, 'text'),
            }];
        }

        return [{
            id: model.id,
            label: text[model.nameKey] ?? model.id,
            priceCoins: getModelPrice(model.id, category),
        }];
    }

    if (kind === 'text') {
        return selectorItem.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            priceCoins: getModelPrice(variant.id, 'text'),
        }));
    }

    return selectorItem.variants.map((variant) => ({
        id: variant.id,
        label: text[variant.nameKey] ?? variant.id,
        priceCoins: getModelPrice(variant.id, category),
    }));
}

export function getAiGroupTitle(selectorItem, text, getChipLabel) {
    if (!selectorItem) {
        return '';
    }

    if (selectorItem.type === 'single') {
        if (selectorItem.model?.label) {
            return selectorItem.model.label;
        }

        return text[selectorItem.model?.nameKey] ?? selectorItem.model?.id ?? '';
    }

    return getChipLabel(selectorItem, text);
}
