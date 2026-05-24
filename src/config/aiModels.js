import { Bot, Brain, Image as ImageIcon, Palette, Sparkles, Zap } from 'lucide-react';
import { IMAGE_MODEL_IDS, TEXT_MODEL_IDS } from '../api/telegramApi.js';

export const TEXT_MODEL_DEFINITIONS = [
    {
        id: 'yandexgpt',
        nameKey: 'modelYandexName',
        subKey: 'modelYandexSub',
        tab: 'chat',
        categories: ['chat', 'code'],
        accent: 'violet',
        icon: Bot,
        badge: null,
        page: 'ai-chat',
    },
    {
        id: 'deepseek',
        nameKey: 'modelDeepSeekName',
        subKey: 'modelDeepSeekSub',
        tab: 'chat',
        categories: ['chat', 'code'],
        accent: 'teal',
        icon: Brain,
        badge: 'pro',
        page: 'ai-chat',
    },
    {
        id: 'gemini-flash',
        nameKey: 'modelGeminiName',
        subKey: 'modelGeminiSub',
        tab: 'chat',
        categories: ['chat', 'code'],
        accent: 'green',
        icon: Sparkles,
        badge: 'new',
        page: 'ai-chat',
    },
    {
        id: 'openai',
        nameKey: 'modelOpenAiName',
        subKey: 'modelOpenAiSub',
        tab: 'chat',
        categories: ['chat', 'code'],
        accent: 'blue',
        icon: Zap,
        badge: 'hot',
        page: 'ai-chat',
    },
];

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

const textIds = new Set(TEXT_MODEL_DEFINITIONS.map((model) => model.id));
const imageIds = new Set(IMAGE_MODEL_DEFINITIONS.map((model) => model.id));

TEXT_MODEL_IDS.forEach((modelId) => {
    if (!textIds.has(modelId)) {
        throw new Error(`Missing UI definition for text model: ${modelId}`);
    }
});

IMAGE_MODEL_IDS.forEach((modelId) => {
    if (!imageIds.has(modelId)) {
        throw new Error(`Missing UI definition for image model: ${modelId}`);
    }
});

/** @deprecated use TEXT_MODEL_DEFINITIONS */
export const AI_MODEL_DEFINITIONS = TEXT_MODEL_DEFINITIONS;

export const catalogSectionsFromModels = [
    {
        id: 'text-models',
        labelKey: 'catalogSectionChat',
        tools: TEXT_MODEL_DEFINITIONS,
    },
    {
        id: 'image-models',
        labelKey: 'catalogSectionPhoto',
        tools: IMAGE_MODEL_DEFINITIONS,
    },
];

export function getTextModelDefinition(modelId) {
    return TEXT_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? TEXT_MODEL_DEFINITIONS[0];
}

export function getImageModelDefinition(modelId) {
    return IMAGE_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? IMAGE_MODEL_DEFINITIONS[0];
}

export function getModelDefinition(modelId) {
    return getTextModelDefinition(modelId);
}
