import { Clapperboard, Film, Sparkles, Video, Zap } from 'lucide-react';

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

        group: 'kling',

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

        group: 'kling',

    },

    {

        id: 'seedance-v1-pro-i2v',

        nameKey: 'modelSeedanceV1ProI2vName',

        subKey: 'modelSeedanceV1ProI2vSub',

        tab: 'video',

        categories: ['video'],

        accent: 'blue',

        icon: Video,

        badge: 'new',

        page: 'ai-video',

        backendModel: 'seedance-v1-pro-i2v',

        group: 'seedance',

    },

    {

        id: 'seedance-v1.5-i2v-fast',

        nameKey: 'modelSeedanceV15I2vFastName',

        subKey: 'modelSeedanceV15I2vFastSub',

        tab: 'video',

        categories: ['video'],

        accent: 'amber',

        icon: Zap,

        badge: 'hot',

        page: 'ai-video',

        backendModel: 'seedance-v1.5-i2v-fast',

        group: 'seedance',

    },

    {

        id: 'seedance-v1.5-t2v-fast',

        nameKey: 'modelSeedanceV15T2vFastName',

        subKey: 'modelSeedanceV15T2vFastSub',

        tab: 'video',

        categories: ['video'],

        accent: 'green',

        icon: Clapperboard,

        badge: 'new',

        page: 'ai-video',

        backendModel: 'seedance-v1.5-t2v-fast',

        group: 'seedance',

    },

    {

        id: 'seedance-v1.5-i2v-spicy',

        nameKey: 'modelSeedanceV15I2vSpicyName',

        subKey: 'modelSeedanceV15I2vSpicySub',

        tab: 'video',

        categories: ['video'],

        accent: 'pink',

        icon: Sparkles,

        badge: 'pro',

        page: 'ai-video',

        backendModel: 'seedance-v1.5-i2v-spicy',

        group: 'seedance',

    },

    {

        id: 'seedance-v2-video-edit',

        nameKey: 'modelSeedanceV2EditName',

        subKey: 'modelSeedanceV2EditSub',

        tab: 'video',

        categories: ['video'],

        accent: 'violet',

        icon: Video,

        badge: 'pro',

        page: 'ai-video',

        backendModel: 'seedance-v2-video-edit',

        group: 'seedance',

    },

    {

        id: 'seedance-v2-video-extend',

        nameKey: 'modelSeedanceV2ExtendName',

        subKey: 'modelSeedanceV2ExtendSub',

        tab: 'video',

        categories: ['video'],

        accent: 'orange',

        icon: Clapperboard,

        badge: 'new',

        page: 'ai-video',

        backendModel: 'seedance-v2-video-extend',

        group: 'seedance',

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


