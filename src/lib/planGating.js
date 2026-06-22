/** Mirrors backend pkg/billing/gating.go — keep in sync. */

export const PLAN_IDS = ['free', 'basic', 'pro', 'max', 'ultra'];

const PLAN_RANKS = {
    free: 0,
    basic: 1,
    pro: 2,
    max: 3,
    ultra: 4,
};

const PLAN_LABEL_KEYS = {
    free: 'planFreeName',
    basic: 'planBasicName',
    pro: 'planProName',
    max: 'planMaxName',
    ultra: 'planUltraName',
};

const MODEL_MIN_PLAN_RANK = {
    yandexgpt: 0, 'gpt-oss-20b': 0, 'deepseek-chat': 0,
    'gpt-4o-mini': 1,
    'gpt-oss-120b': 1, 'qwen3-235b': 1, 'deepseek-v4-flash': 1, 'deepseek-v3.2': 1,
    'deepseek-chat-v3-0324': 1, 'gpt-4.1-nano': 1, 'gpt-4.1-mini': 1, 'gpt-5.4-mini': 1,
    'claude-haiku-4.5': 1, 'gemini-2.5-flash': 1, 'o4-mini': 1,
    'qwen3.6-35b': 2, 'deepseek-v4': 2, 'deepseek-r1': 2, 'deepseek-v3.2-exp': 2,
    'gpt-4.1': 2, 'gpt-5.4': 2, 'claude-sonnet-4.5': 2, 'o3-mini': 2,
    'gpt-4o': 3, 'gemini-2.5-pro': 3, 'claude-opus-4.7': 3, o3: 3,
    'claude-opus-4.8': 4, o1: 4, 'gpt-5.5': 4,
    'flux-dev': 0,
    'alice-ai-art': 1,
    'nano-banana': 1,
    'gpt-image-1.5': 2, 'gpt-image-2': 2, 'nano-banana-2': 2,
    'nano-banana-pro': 3,
    'kling-v3-std': 1,
    'kling-v3-pro': 2, 'seedance-v1-pro-i2v': 2, 'seedance-v1.5-i2v-fast': 2,
    'seedance-v1.5-t2v-fast': 2, 'seedance-v1.5-i2v-spicy': 2,
    'kling-v3-4k': 3, 'seedance-v2-video-edit': 3, 'seedance-v2-video-extend': 3,
    omnivoice: 0, 'minimax-speech-2.6': 0, 'qwen3-tts': 0,
    'elevenlabs-v3': 1,
    'mureka-v9': 2, mureka: 2, 'ace-step-1.5': 2,
    'hunyuan3d-v3.1-rapid': 1, 'hunyuan3d-v3-t2d': 1,
    'tripo3d-v2.5-i2d': 2, 'tripo3d-v2.5-multiview': 2, 'meshy6-t2d': 2,
    'tripo3d-h3.1-t2d': 3, 'tripo3d-h3.1-i2d': 3, 'rodin-v2-i2d': 3, 'rodin-v2.5-i2d': 3,
};

const CATEGORY_MIN_PLAN_RANK = {
    text: 0,
    image: 1,
    video: 1,
    audio: 0,
    '3d': 1,
};

export function normalizePlanId(raw) {
    const planId = String(raw ?? '').trim().toLowerCase();
    return PLAN_RANKS[planId] !== undefined ? planId : 'free';
}

export function planRank(planId) {
    return PLAN_RANKS[normalizePlanId(planId)] ?? 0;
}

export function planIdForRank(rank) {
    const clamped = Math.max(0, Math.min(rank, PLAN_IDS.length - 1));
    return PLAN_IDS[clamped];
}

export function minPlanRankForModel(modelId, category = 'text') {
    const id = String(modelId ?? '').trim().toLowerCase();
    if (id && MODEL_MIN_PLAN_RANK[id] !== undefined) {
        return MODEL_MIN_PLAN_RANK[id];
    }
    const cat = String(category ?? 'text').trim().toLowerCase();
    return CATEGORY_MIN_PLAN_RANK[cat] ?? 1;
}

export function minPlanForModel(modelId, category = 'text') {
    return planIdForRank(minPlanRankForModel(modelId, category));
}

export function planUnlocksModel(planId, modelId, category = 'text') {
    return planRank(planId) >= minPlanRankForModel(modelId, category);
}

export function planLabelKey(requiredPlanId) {
    return PLAN_LABEL_KEYS[normalizePlanId(requiredPlanId)] ?? 'planBasicName';
}

export function annotateModelOption(option, planId, category = 'text') {
    const unlocked = planUnlocksModel(planId, option.id, category);
    const requiredPlan = minPlanForModel(option.id, category);
    return {
        ...option,
        locked: !unlocked,
        requiredPlan,
        requiredPlanLabelKey: planLabelKey(requiredPlan),
    };
}

export function pickFirstUnlockedModelId(modelIds, planId, category = 'text') {
    const list = Array.isArray(modelIds) ? modelIds : [];
    const unlocked = list.find((id) => planUnlocksModel(planId, id, category));
    return unlocked ?? list[0] ?? '';
}
