import { Film, Sparkles } from 'lucide-react';
import { VIDEO_MODEL_IDS } from '../api/telegramApi.js';

export const VIDEO_MODEL_DEFINITIONS = [
    {
        id: 'kling-v3-std',
        nameKey: 'modelKlingStdName',
        subKey: 'modelKlingStdSub',
        tab: 'video',
        categories: ['video'],
        accent: 'teal',
        icon: Film,
        badge: 'new',
        page: 'ai-video',
        backendModel: 'kling-v3-std',
    },
    {
        id: 'kling-v3-pro',
        nameKey: 'modelKlingProName',
        subKey: 'modelKlingProSub',
        tab: 'video',
        categories: ['video'],
        accent: 'violet',
        icon: Sparkles,
        badge: 'pro',
        page: 'ai-video',
        backendModel: 'kling-v3-pro',
    },
];

const videoIds = new Set(VIDEO_MODEL_DEFINITIONS.map((model) => model.id));

VIDEO_MODEL_IDS.forEach((modelId) => {
    if (!videoIds.has(modelId)) {
        throw new Error(`Missing UI definition for video model: ${modelId}`);
    }
});

export function getVideoModelDefinition(modelId) {
    return VIDEO_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? VIDEO_MODEL_DEFINITIONS[0];
}
