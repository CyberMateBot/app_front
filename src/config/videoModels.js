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

        id: 'kling-v3-4k',

        nameKey: 'modelKling4kName',

        subKey: 'modelKling4kSub',

        tab: 'video',

        categories: ['video'],

        accent: 'gold',

        icon: Sparkles,

        badge: 'pro',

        page: 'ai-video',

        backendModel: 'kling-v3-4k',

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

    { id: 'wan-2.5-t2v', nameKey: 'modelWan25T2vName', subKey: 'modelWan25T2vSub', tab: 'video', categories: ['video'], accent: 'blue', icon: Film, page: 'ai-video', backendModel: 'wan-2.5-t2v', group: 'wan' },
    { id: 'wan-2.6-i2v', nameKey: 'modelWan26I2vName', subKey: 'modelWan26I2vSub', tab: 'video', categories: ['video'], accent: 'blue', icon: Video, page: 'ai-video', backendModel: 'wan-2.6-i2v', group: 'wan' },
    { id: 'wan-2.7-t2v', nameKey: 'modelWan27T2vName', subKey: 'modelWan27T2vSub', tab: 'video', categories: ['video'], accent: 'teal', icon: Film, badge: 'new', page: 'ai-video', backendModel: 'wan-2.7-t2v', group: 'wan' },
    { id: 'wan-2.7-flf', nameKey: 'modelWan27FlfName', subKey: 'modelWan27FlfSub', tab: 'video', categories: ['video'], accent: 'teal', icon: Clapperboard, page: 'ai-video', backendModel: 'wan-2.7-flf', group: 'wan' },
    { id: 'wan-2.7-grid', nameKey: 'modelWan27GridName', subKey: 'modelWan27GridSub', tab: 'video', categories: ['video'], accent: 'teal', icon: Sparkles, page: 'ai-video', backendModel: 'wan-2.7-grid', group: 'wan' },
    { id: 'wan-2.7-edit', nameKey: 'modelWan27EditName', subKey: 'modelWan27EditSub', tab: 'video', categories: ['video'], accent: 'violet', icon: Video, page: 'ai-video', backendModel: 'wan-2.7-edit', group: 'wan' },
    { id: 'wan-2.2-spicy-i2v', nameKey: 'modelWan22SpicyI2vName', subKey: 'modelWan22SpicyI2vSub', tab: 'video', categories: ['video'], accent: 'pink', icon: Sparkles, page: 'ai-video', backendModel: 'wan-2.2-spicy-i2v', group: 'wan' },
    { id: 'happyhorse-t2v', nameKey: 'modelHappyHorseT2vName', subKey: 'modelHappyHorseT2vSub', tab: 'video', categories: ['video'], accent: 'orange', icon: Film, page: 'ai-video', backendModel: 'happyhorse-t2v', group: 'happyhorse' },
    { id: 'happyhorse-i2v', nameKey: 'modelHappyHorseI2vName', subKey: 'modelHappyHorseI2vSub', tab: 'video', categories: ['video'], accent: 'orange', icon: Video, page: 'ai-video', backendModel: 'happyhorse-i2v', group: 'happyhorse' },
    { id: 'happyhorse-ref2v', nameKey: 'modelHappyHorseRef2vName', subKey: 'modelHappyHorseRef2vSub', tab: 'video', categories: ['video'], accent: 'gold', icon: Sparkles, page: 'ai-video', backendModel: 'happyhorse-ref2v', group: 'happyhorse' },
    { id: 'happyhorse-video-edit', nameKey: 'modelHappyHorseVideoEditName', subKey: 'modelHappyHorseVideoEditSub', tab: 'video', categories: ['video'], accent: 'violet', icon: Video, page: 'ai-video', backendModel: 'happyhorse-video-edit', group: 'happyhorse' },
    { id: 'happyhorse-video-extend', nameKey: 'modelHappyHorseVideoExtendName', subKey: 'modelHappyHorseVideoExtendSub', tab: 'video', categories: ['video'], accent: 'orange', icon: Clapperboard, page: 'ai-video', backendModel: 'happyhorse-video-extend', group: 'happyhorse' },
    { id: 'sora-2-t2v', nameKey: 'modelSora2T2vName', subKey: 'modelSora2T2vSub', tab: 'video', categories: ['video'], accent: 'green', icon: Film, badge: 'hot', page: 'ai-video', backendModel: 'sora-2-t2v', group: 'sora' },
    { id: 'sora-2-i2v', nameKey: 'modelSora2I2vName', subKey: 'modelSora2I2vSub', tab: 'video', categories: ['video'], accent: 'green', icon: Video, page: 'ai-video', backendModel: 'sora-2-i2v', group: 'sora' },
    { id: 'sora-2-t2v-pro', nameKey: 'modelSora2T2vProName', subKey: 'modelSora2T2vProSub', tab: 'video', categories: ['video'], accent: 'green', icon: Sparkles, badge: 'pro', page: 'ai-video', backendModel: 'sora-2-t2v-pro', group: 'sora' },
    { id: 'veo-3.1-extend', nameKey: 'modelVeo31ExtendName', subKey: 'modelVeo31ExtendSub', tab: 'video', categories: ['video'], accent: 'amber', icon: Clapperboard, page: 'ai-video', backendModel: 'veo-3.1-extend', group: 'veo' },
    { id: 'vidu-q3-i2v-spicy', nameKey: 'modelViduQ3I2vSpicyName', subKey: 'modelViduQ3I2vSpicySub', tab: 'video', categories: ['video'], accent: 'pink', icon: Sparkles, page: 'ai-video', backendModel: 'vidu-q3-i2v-spicy', group: 'vidu' },
    { id: 'hailuo-2.3-t2v', nameKey: 'modelHailuo23T2vName', subKey: 'modelHailuo23T2vSub', tab: 'video', categories: ['video'], accent: 'violet', icon: Film, page: 'ai-video', backendModel: 'hailuo-2.3-t2v', group: 'hailuo' },
    { id: 'hailuo-2.3-i2v-fast', nameKey: 'modelHailuo23I2vFastName', subKey: 'modelHailuo23I2vFastSub', tab: 'video', categories: ['video'], accent: 'violet', icon: Video, page: 'ai-video', backendModel: 'hailuo-2.3-i2v-fast', group: 'hailuo' },
    { id: 'hailuo-2.3-i2v-pro', nameKey: 'modelHailuo23I2vProName', subKey: 'modelHailuo23I2vProSub', tab: 'video', categories: ['video'], accent: 'violet', icon: Sparkles, badge: 'pro', page: 'ai-video', backendModel: 'hailuo-2.3-i2v-pro', group: 'hailuo' },

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


