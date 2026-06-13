import { Bot, Image as ImageIcon, Layers, Palette, Sparkles, Wand2 } from 'lucide-react';
import { IMAGE_MODEL_IDS } from '../api/telegramApi.js';

export const IMAGE_MODEL_DEFINITIONS = [
    {
        id: 'nano-banana',
        nameKey: 'modelNanoBananaName',
        subKey: 'modelNanoBananaSub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'pink',
        icon: ImageIcon,
        badge: 'new',
        page: 'ai-image',
        backendModel: 'nano-banana',
        group: 'nano-banana',
    },
    {
        id: 'nano-banana-pro',
        nameKey: 'modelNanoBananaProName',
        subKey: 'modelNanoBananaProSub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'orange',
        icon: Wand2,
        badge: 'pro',
        page: 'ai-image',
        backendModel: 'nano-banana-pro',
        group: 'nano-banana',
    },
    {
        id: 'nano-banana-2',
        nameKey: 'modelNanoBanana2Name',
        subKey: 'modelNanoBanana2Sub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'amber',
        icon: Sparkles,
        badge: 'hot',
        page: 'ai-image',
        backendModel: 'nano-banana-2',
        group: 'nano-banana',
    },
    {
        id: 'gpt-image-2',
        nameKey: 'modelGptImage2Name',
        subKey: 'modelGptImage2Sub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'green',
        icon: Bot,
        group: 'gpt-image',
    },
    {
        id: 'gpt-image-1.5',
        nameKey: 'modelGptImage15Name',
        subKey: 'modelGptImage15Sub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'teal',
        icon: ImageIcon,
        badge: 'pro',
        page: 'ai-image',
        backendModel: 'gpt-image-1.5',
        group: 'gpt-image',
    },
    {
        id: 'flux-dev',
        nameKey: 'modelFluxDevName',
        subKey: 'modelFluxDevSub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'blue',
        icon: Layers,
    },
    {
        id: 'alice-ai-art',
        nameKey: 'modelAliceAIArtName',
        subKey: 'modelAliceAIArtSub',
        tab: 'photo',
        categories: ['photo'],
        accent: 'violet',
        icon: Palette,
        badge: 'new',
        page: 'ai-image',
        backendModel: 'alice-ai-art',
    },
];

const imageIds = new Set(IMAGE_MODEL_DEFINITIONS.map((model) => model.id));

IMAGE_MODEL_IDS.forEach((modelId) => {
    if (!imageIds.has(modelId)) {
        throw new Error(`Missing UI definition for image model: ${modelId}`);
    }
});

export function getImageModelDefinition(modelId) {
    return IMAGE_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? IMAGE_MODEL_DEFINITIONS[0];
}
