import { Mic } from 'lucide-react';

import { AUDIO_MODEL_IDS } from '../api/telegramApi.js';

export const AUDIO_MODEL_DEFINITIONS = [
    {
        id: 'qwen3-tts',
        nameKey: 'modelQwen3TtsName',
        subKey: 'modelQwen3TtsSub',
        tab: 'voice',
        categories: ['voice'],
        accent: 'violet',
        icon: Mic,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'qwen3-tts',
        group: 'Qwen3 TTS',
    },
];

AUDIO_MODEL_IDS.forEach((modelId) => {
    if (!AUDIO_MODEL_DEFINITIONS.some((model) => model.id === modelId)) {
        throw new Error(`Missing audio model definition for ${modelId}`);
    }
});

export function getAudioModelDefinition(modelId) {
    return AUDIO_MODEL_DEFINITIONS.find((model) => model.id === modelId) ?? null;
}
