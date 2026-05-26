import { Image as ImageIcon, Palette } from 'lucide-react';
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
