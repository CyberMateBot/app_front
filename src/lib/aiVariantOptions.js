import { getModelPrice } from './modelPrices.js';
import { annotateModelOption } from './planGating.js';
import { getMediaModelMinPrice } from './mediaGenerationPrice.js';

const CATEGORY_BY_KIND = {
    text: 'text',
    media: 'image',
    video: 'video',
    audio: 'audio',
    '3d': '3d',
};

const KIND_BY_SELECTOR = {
    media: 'image',
    video: 'video',
    audio: 'audio',
    '3d': '3d',
};

function resolveMediaVariantPrice(modelId, mediaModelsCatalog, kind, priceResolver) {
    if (priceResolver) {
        return priceResolver(modelId);
    }

    const catalogModel = mediaModelsCatalog[modelId] ?? { id: modelId, kind };
    return getMediaModelMinPrice(catalogModel);
}

export function getAiVariantOptions(
    selectorItem,
    text,
    kind = 'media',
    planId = 'free',
    options = {},
) {
    const {
        priceResolver,
        mediaModelsCatalog = {},
        imageModelsCatalog = mediaModelsCatalog,
    } = options;

    const catalog = Object.keys(mediaModelsCatalog).length
        ? mediaModelsCatalog
        : imageModelsCatalog;
    const mediaKind = KIND_BY_SELECTOR[kind] ?? 'image';

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
            priceCoins: resolveMediaVariantPrice(model.id, catalog, mediaKind, priceResolver),
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
        priceCoins: resolveMediaVariantPrice(variant.id, catalog, mediaKind, priceResolver),
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
