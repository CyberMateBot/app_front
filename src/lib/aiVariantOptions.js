import { getModelPrice } from './modelPrices.js';
import { annotateModelOption } from './planGating.js';

const CATEGORY_BY_KIND = {
    text: 'text',
    media: 'image',
    video: 'video',
    audio: 'audio',
    '3d': '3d',
};

export function getAiVariantOptions(selectorItem, text, kind = 'media', planId = 'free') {
    if (!selectorItem) {
        return [];
    }

    const category = CATEGORY_BY_KIND[kind] ?? 'image';

    if (selectorItem.type === 'single') {
        const model = selectorItem.model;

        if (kind === 'text') {
            return [annotateModelOption({
                id: model.id,
                label: model.label,
                priceCoins: getModelPrice(model.id, 'text'),
            }, planId, 'text')];
        }

        return [annotateModelOption({
            id: model.id,
            label: text[model.nameKey] ?? model.id,
            priceCoins: getModelPrice(model.id, category),
        }, planId, category)];
    }

    if (kind === 'text') {
        return selectorItem.variants.map((variant) => annotateModelOption({
            id: variant.id,
            label: variant.label,
            priceCoins: getModelPrice(variant.id, 'text'),
        }, planId, 'text'));
    }

    return selectorItem.variants.map((variant) => annotateModelOption({
        id: variant.id,
        label: text[variant.nameKey] ?? variant.id,
        priceCoins: getModelPrice(variant.id, category),
    }, planId, category));
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
