import { getModelPrice } from './modelPrices.js';
import { annotateModelOption } from './planGating.js';
import { getMediaModelMinPrice } from './mediaGenerationPrice.js';
import { videoModelRequiresImage, videoModelRequiresVideo } from './videoModels.js';
import { imageModelSupportsEdit } from '../config/mediaModelOptions.js';

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

/**
 * Decide whether a model is "edit-oriented" for the badge in the
 * variant picker. This is strictly about models that take an
 * EXISTING video (or image, for the image kind) and modify it —
 * NOT models that merely accept a photo as a generation seed.
 * Video: only genuine video-edit / video-extend models (they
 * require a *source video* upload). i2v models (image → video)
 * are a different thing entirely — they generate a brand-new video
 * from a still photo, they don't edit anything — so they get the
 * separate "from photo" badge via `isPhotoSeedModel` instead.
 * Image: models whose id spells "edit" — these are the pure
 * editing/inpainting SKUs, not the generalists that support both
 * edit and text-to-image.
 */
function isEditingModel(modelId, kind) {
    if (!modelId) return false;
    const id = String(modelId).toLowerCase();
    if (kind === 'video') {
        if (videoModelRequiresVideo(modelId)) {
            return true;
        }
        return /-edit(-|$)|-extend(-|$)/.test(id);
    }
    if (kind === 'media' || kind === 'image') {
        if (!imageModelSupportsEdit(modelId)) return false;
        return /-edit(-|$)|edit-|inpaint|outpaint|remove-bg/.test(id);
    }
    return false;
}

/**
 * Video-only: flags models that require a source PHOTO to seed the
 * generation (i2v / ref2v / first-last-frame). These are NOT edit
 * models — they can't take an existing video and modify it, they
 * generate a new video from a still image. Surfaced as a distinct
 * "from photo" badge so users don't confuse them with true video
 * editing (which needs a video upload, not a photo).
 */
function isPhotoSeedModel(modelId, kind) {
    if (!modelId || kind !== 'video') return false;
    if (isEditingModel(modelId, kind)) return false;
    if (videoModelRequiresImage(modelId)) return true;
    const id = String(modelId).toLowerCase();
    return /-i2v(-|$)|-ref2v(-|$)|-flf(-|$)/.test(id);
}

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
            editing: isEditingModel(model.id, kind),
            photoSeed: isPhotoSeedModel(model.id, kind),
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
        editing: isEditingModel(variant.id, kind),
        photoSeed: isPhotoSeedModel(variant.id, kind),
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
