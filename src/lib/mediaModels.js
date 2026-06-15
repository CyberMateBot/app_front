import { Bot, Image as ImageIcon, Mic, Music2, Sparkles, Volume2, Wand2, Waves } from 'lucide-react';
import {
    buildGroupedSelectorItems,
    formatGroupIdLabel,
    getSelectorItemForModelId,
} from './modelGroups.js';

export { getSelectorItemForModelId as getMediaSelectorItemForModelId };

const IMAGE_BADGE_ORDER = { new: 0, hot: 1, pro: 2 };

export const IMAGE_GROUP_OVERRIDES = {
    'nano-banana': {
        nameKey: 'modelNanoBananaName',
        subKey: 'modelNanoBananaSub',
        defaultModelId: 'nano-banana',
        icon: ImageIcon,
    },
    'gpt-image': {
        nameKey: 'modelGptImageGroupName',
        subKey: 'modelGptImageGroupSub',
        defaultModelId: 'gpt-image-2',
        icon: Bot,
    },
    seedream: {
        nameKey: 'modelSeedreamGroupName',
        subKey: 'modelSeedreamGroupSub',
        defaultModelId: 'seedream-v4.5',
        icon: Sparkles,
    },
    'qwen-image': {
        nameKey: 'modelQwenImageGroupName',
        subKey: 'modelQwenImageGroupSub',
        defaultModelId: 'qwen-image-2.0',
        icon: Bot,
    },
    'z-image': {
        nameKey: 'modelZImageGroupName',
        subKey: 'modelZImageGroupSub',
        defaultModelId: 'z-image-base',
        icon: ImageIcon,
    },
    grok: {
        nameKey: 'modelGrokGroupName',
        subKey: 'modelGrokGroupSub',
        defaultModelId: 'grok-imagine-edit',
        icon: Wand2,
    },
};

export const VIDEO_GROUP_OVERRIDES = {
    kling: {
        nameKey: 'modelKlingGroupName',
        subKey: 'modelKlingGroupSub',
        defaultModelId: 'kling-v3-std',
    },
    seedance: {
        nameKey: 'modelSeedanceGroupName',
        subKey: 'modelSeedanceGroupSub',
        defaultModelId: 'seedance-v1.5-t2v-fast',
    },
    wan: {
        nameKey: 'modelWanGroupName',
        subKey: 'modelWanGroupSub',
        defaultModelId: 'wan-2.7-t2v',
    },
    happyhorse: {
        nameKey: 'modelHappyHorseGroupName',
        subKey: 'modelHappyHorseGroupSub',
        defaultModelId: 'happyhorse-t2v',
    },
    sora: {
        nameKey: 'modelSoraGroupName',
        subKey: 'modelSoraGroupSub',
        defaultModelId: 'sora-2-t2v',
    },
    veo: {
        nameKey: 'modelVeoGroupName',
        subKey: 'modelVeoGroupSub',
        defaultModelId: 'veo-3.1-extend',
    },
    vidu: {
        nameKey: 'modelViduGroupName',
        subKey: 'modelViduGroupSub',
        defaultModelId: 'vidu-q3-i2v-spicy',
    },
    hailuo: {
        nameKey: 'modelHailuoGroupName',
        subKey: 'modelHailuoGroupSub',
        defaultModelId: 'hailuo-2.3-t2v',
    },
};

function sortImageVariants(variants) {
    return [...variants].sort((left, right) => {
        const leftOrder = IMAGE_BADGE_ORDER[left.badge] ?? 99;
        const rightOrder = IMAGE_BADGE_ORDER[right.badge] ?? 99;

        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return String(left.id).localeCompare(String(right.id));
    });
}

const VIDEO_VARIANT_ORDER = {
    'seedance-v1-pro-i2v': 0,
    'seedance-v1.5-t2v-fast': 1,
    'seedance-v1.5-i2v-fast': 2,
    'seedance-v1.5-i2v-spicy': 3,
    'seedance-v2-video-edit': 4,
    'seedance-v2-video-extend': 5,
    'kling-v3-std': 0,
    'kling-v3-pro': 1,
    'kling-v3-4k': 2,
};

function sortVideoVariants(variants) {
    return [...variants].sort((left, right) => {
        const leftOrder = VIDEO_VARIANT_ORDER[left.id] ?? 99;
        const rightOrder = VIDEO_VARIANT_ORDER[right.id] ?? 99;

        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return String(left.id).localeCompare(String(right.id));
    });
}

function getImageGroupLabel(groupId) {
    const override = IMAGE_GROUP_OVERRIDES[groupId];

    if (override?.nameKey) {
        return override.nameKey;
    }

    return formatGroupIdLabel(groupId);
}

function getVideoGroupLabel(groupId) {
    const override = VIDEO_GROUP_OVERRIDES[groupId];

    if (override?.nameKey) {
        return override.nameKey;
    }

    return formatGroupIdLabel(groupId);
}

export function buildImageModelSelectorItems(definitions) {
    return buildGroupedSelectorItems(definitions, {
        getGroupKey: (model) => model.group || model.id,
        getGroupLabel: (groupId) => getImageGroupLabel(groupId),
        getDefaultItemId: (groupId, variants) => (
            IMAGE_GROUP_OVERRIDES[groupId]?.defaultModelId
            ?? variants[0]?.id
        ),
        sortGroupItems: sortImageVariants,
    });
}

export function buildVideoModelSelectorItems(definitions) {
    return buildGroupedSelectorItems(definitions, {
        getGroupKey: (model) => model.group || model.id,
        getGroupLabel: (groupId) => getVideoGroupLabel(groupId),
        getDefaultItemId: (groupId, variants) => (
            VIDEO_GROUP_OVERRIDES[groupId]?.defaultModelId
            ?? variants[0]?.id
        ),
        sortGroupItems: sortVideoVariants,
    });
}

function buildCatalogMediaTools(definitions, selectorItems, groupOverrides, page) {
    return selectorItems.map((item) => {
        if (item.type === 'tiered') {
            const override = groupOverrides[item.id];
            const defaultVariant = item.variants.find((variant) => variant.id === item.defaultModelId)
                ?? item.variants[0];

            return {
                id: defaultVariant.id,
                groupId: item.id,
                nameKey: override?.nameKey ?? null,
                subKey: override?.subKey ?? defaultVariant.subKey,
                label: override?.nameKey ? null : item.label,
                page,
                tab: defaultVariant.tab,
                categories: defaultVariant.categories,
                accent: override?.accent ?? defaultVariant.accent,
                icon: override?.icon ?? defaultVariant.icon,
                tiered: true,
                variants: item.variants,
            };
        }

        const model = item.model;

        return {
            id: model.id,
            nameKey: model.nameKey,
            subKey: model.subKey,
            badge: model.badge,
            page,
            tab: model.tab,
            categories: model.categories,
            accent: model.accent,
            icon: model.icon,
            tiered: false,
        };
    });
}

export function buildCatalogImageTools(definitions) {
    return buildCatalogMediaTools(
        definitions,
        buildImageModelSelectorItems(definitions),
        IMAGE_GROUP_OVERRIDES,
        'ai-image',
    );
}

export function buildCatalogVideoTools(definitions) {
    return buildCatalogMediaTools(
        definitions,
        buildVideoModelSelectorItems(definitions),
        VIDEO_GROUP_OVERRIDES,
        'ai-video',
    );
}

export const AUDIO_GROUP_OVERRIDES = {
    'Qwen3 TTS': {
        nameKey: 'modelQwen3TtsName',
        subKey: 'modelQwen3TtsSub',
        defaultModelId: 'qwen3-tts',
        icon: Mic,
    },
    OmniVoice: {
        nameKey: 'modelOmniVoiceName',
        subKey: 'modelOmniVoiceSub',
        defaultModelId: 'omnivoice',
        icon: Volume2,
    },
    ElevenLabs: {
        nameKey: 'modelElevenLabsV3Name',
        subKey: 'modelElevenLabsV3Sub',
        defaultModelId: 'elevenlabs-v3',
        icon: Waves,
    },
    'MiniMax Speech': {
        nameKey: 'modelMiniMaxSpeechName',
        subKey: 'modelMiniMaxSpeechSub',
        defaultModelId: 'minimax-speech-2.6',
        icon: Sparkles,
    },
    Mureka: {
        nameKey: 'modelMurekaV9Name',
        subKey: 'modelMurekaV9Sub',
        defaultModelId: 'mureka-v9',
        icon: Music2,
    },
    'ACE-Step': {
        nameKey: 'modelAceStepName',
        subKey: 'modelAceStepSub',
        defaultModelId: 'ace-step-1.5',
        icon: Music2,
    },
};

export function buildAudioModelSelectorItems(definitions) {
    return buildGroupedSelectorItems(definitions, {
        getGroupKey: (model) => model.group || model.id,
        getGroupLabel: (groupId) => {
            const override = AUDIO_GROUP_OVERRIDES[groupId];
            if (override?.nameKey) {
                return override.nameKey;
            }
            return formatGroupIdLabel(groupId);
        },
        getDefaultItemId: (groupId, variants) => (
            AUDIO_GROUP_OVERRIDES[groupId]?.defaultModelId
            ?? variants[0]?.id
        ),
        sortGroupItems: (variants) => [...variants],
    });
}

export function buildCatalogAudioTools(definitions) {
    return buildCatalogMediaTools(
        definitions,
        buildAudioModelSelectorItems(definitions),
        AUDIO_GROUP_OVERRIDES,
        'ai-voice',
    );
}

export function getAudioSelectorChipLabel(item, text) {
    if (item.type === 'single') {
        return text[item.model.nameKey] ?? item.model.id;
    }

    const override = AUDIO_GROUP_OVERRIDES[item.id];

    if (override?.nameKey) {
        return text[override.nameKey] ?? item.label;
    }

    return item.label;
}

export function getAudioSelectorChipVisual(item) {
    if (item.type === 'single') {
        return { accent: item.model.accent, icon: item.model.icon };
    }

    const override = AUDIO_GROUP_OVERRIDES[item.id];
    const defaultVariant = item.variants.find((variant) => variant.id === item.defaultModelId)
        ?? item.variants[0];

    return {
        accent: override?.accent ?? defaultVariant?.accent,
        icon: override?.icon ?? defaultVariant?.icon,
    };
}

export function getImageSelectorChipLabel(item, text) {
    if (item.type === 'single') {
        return text[item.model.nameKey] ?? item.model.id;
    }

    const override = IMAGE_GROUP_OVERRIDES[item.id];

    if (override?.nameKey) {
        return text[override.nameKey] ?? item.label;
    }

    return item.label;
}

export function getVideoSelectorChipLabel(item, text) {
    if (item.type === 'single') {
        return text[item.model.nameKey] ?? item.model.id;
    }

    const override = VIDEO_GROUP_OVERRIDES[item.id];

    if (override?.nameKey) {
        return text[override.nameKey] ?? item.label;
    }

    return item.label;
}

export function getImageSelectorChipVisual(item) {
    if (item.type === 'single') {
        return { accent: item.model.accent, icon: item.model.icon };
    }

    const defaultVariant = item.variants.find((variant) => variant.id === item.defaultModelId)
        ?? item.variants[0];

    return { accent: defaultVariant.accent, icon: defaultVariant.icon };
}

export function getVideoSelectorChipVisual(item) {
    if (item.type === 'single') {
        return { accent: item.model.accent, icon: item.model.icon };
    }

    const defaultVariant = item.variants.find((variant) => variant.id === item.defaultModelId)
        ?? item.variants[0];

    return { accent: defaultVariant.accent, icon: defaultVariant.icon };
}
