import { Mic, Music2, Sparkles, Volume2, Waves } from 'lucide-react';

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
    {
        id: 'omnivoice',
        nameKey: 'modelOmniVoiceName',
        subKey: 'modelOmniVoiceSub',
        tab: 'voice',
        categories: ['voice'],
        accent: 'sky',
        icon: Volume2,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'omnivoice',
        group: 'OmniVoice',
    },
    {
        id: 'elevenlabs-v3',
        nameKey: 'modelElevenLabsV3Name',
        subKey: 'modelElevenLabsV3Sub',
        tab: 'voice',
        categories: ['voice'],
        accent: 'indigo',
        icon: Waves,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'elevenlabs-v3',
        group: 'ElevenLabs',
    },
    {
        id: 'minimax-speech-2.6',
        nameKey: 'modelMiniMaxSpeechName',
        subKey: 'modelMiniMaxSpeechSub',
        tab: 'voice',
        categories: ['voice'],
        accent: 'teal',
        icon: Sparkles,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'minimax-speech-2.6',
        group: 'MiniMax Speech',
    },
    {
        id: 'mureka-v9',
        nameKey: 'modelMurekaV9Name',
        subKey: 'modelMurekaV9Sub',
        tab: 'music',
        categories: ['music', 'voice'],
        accent: 'rose',
        icon: Music2,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'mureka-v9',
        group: 'Mureka',
    },
    {
        id: 'ace-step-1.5',
        nameKey: 'modelAceStepName',
        subKey: 'modelAceStepSub',
        tab: 'music',
        categories: ['music', 'voice'],
        accent: 'amber',
        icon: Music2,
        badge: 'new',
        page: 'ai-voice',
        backendModel: 'ace-step-1.5',
        group: 'ACE-Step',
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
