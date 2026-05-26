import { Bot, Brain, Sparkles, Zap } from 'lucide-react';

export const TEXT_MODEL_STORAGE_KEY = 'cybermate-text-model-id';

/** @deprecated legacy ids kept for history entries */
export const LEGACY_TEXT_MODEL_IDS = ['gemini-flash', 'openai'];

const DISPLAY_TIER_ORDER = { lite: 0, pro: 1 };

const MERGED_GROUPS = {
    'Open-weight GPT': { displayName: 'GPT OSS', defaultModelId: 'gpt-oss-20b' },
    Qwen: { displayName: 'Qwen', defaultModelId: 'qwen3.6-35b' },
};

/** UI tier for merged groups: Lite / Pro (Qwen 35B = Pro, 235B = Lite) */
const MODEL_DISPLAY_TIER = {
    'gpt-oss-20b': 'lite',
    'gpt-oss-120b': 'pro',
    'qwen3-235b': 'lite',
    'qwen3.6-35b': 'pro',
};

const MODELS_WITHOUT_BADGE = new Set(['yandexgpt', 'deepseek']);

const GROUP_ACCENTS = {
    Yandex: 'violet',
    'Open-weight GPT': 'blue',
    Qwen: 'teal',
};

const MODEL_ACCENTS = {
    yandexgpt: 'violet',
    deepseek: 'teal',
    'gpt-oss-20b': 'blue',
    'gpt-oss-120b': 'blue',
    'qwen3.6-35b': 'teal',
    'qwen3-235b': 'teal',
};

const MODEL_ICONS = {
    yandexgpt: Bot,
    deepseek: Brain,
    'gpt-oss-20b': Zap,
    'gpt-oss-120b': Zap,
    'qwen3.6-35b': Brain,
    'qwen3-235b': Brain,
};

const GROUP_ICONS = {
    Yandex: Bot,
    'Open-weight GPT': Zap,
    Qwen: Brain,
};

const CATALOG_DESCRIPTIONS = {
    ru: {
        yandexgpt: 'Русский язык: диалог, факты, пересказ и повседневные задачи',
        deepseek: 'Код, отладка, алгоритмы и пошаговые рассуждения',
        'Open-weight GPT': 'Тексты и идеи: черновики, правки и рассуждения',
        Qwen: 'Длинные документы, сводки и мультиязычный анализ',
    },
    en: {
        yandexgpt: 'Russian: chat, facts, rewriting, and everyday tasks',
        deepseek: 'Code, debugging, algorithms, and step-by-step reasoning',
        'Open-weight GPT': 'Writing and ideas: drafts, edits, and reasoning',
        Qwen: 'Long documents, summaries, and multilingual analysis',
    },
};

const LEGACY_MODEL_ALIASES = {
    'gemini-flash': 'yandexgpt',
    openai: 'yandexgpt',
    yandex: 'yandexgpt',
    default: 'yandexgpt',
};

export function getStoredTextModelId() {
    if (typeof window === 'undefined') {
        return null;
    }

    const stored = window.localStorage.getItem(TEXT_MODEL_STORAGE_KEY)?.trim();
    return stored || null;
}

export function setStoredTextModelId(modelId) {
    if (typeof window === 'undefined' || !modelId) {
        return;
    }

    window.localStorage.setItem(TEXT_MODEL_STORAGE_KEY, modelId);
}

export function getModelDisplayTier(model) {
    if (!model) {
        return null;
    }

    return MODEL_DISPLAY_TIER[model.id] ?? null;
}

export function shouldShowModelBadge(model) {
    if (!model || MODELS_WITHOUT_BADGE.has(model.id)) {
        return false;
    }

    return Boolean(getModelDisplayTier(model));
}

export function getTierLabelForModel(model, text) {
    const displayTier = getModelDisplayTier(model);

    if (displayTier === 'lite') {
        return text.tierLite;
    }

    if (displayTier === 'pro') {
        return text.tierPro;
    }

    return '';
}

export function getCatalogModelDescription(tool, language = 'ru') {
    const locale = language === 'en' ? 'en' : 'ru';
    const descriptions = CATALOG_DESCRIPTIONS[locale];

    if (tool.groupId && descriptions[tool.groupId]) {
        return descriptions[tool.groupId];
    }

    if (descriptions[tool.id]) {
        return descriptions[tool.id];
    }

    return tool.sub || '';
}

export function sortModelsByDisplayTier(models) {
    return [...models].sort((left, right) => {
        const leftOrder = DISPLAY_TIER_ORDER[getModelDisplayTier(left)] ?? 99;
        const rightOrder = DISPLAY_TIER_ORDER[getModelDisplayTier(right)] ?? 99;

        return leftOrder - rightOrder;
    });
}

/**
 * @param {Array<{ id: string, label: string, group: string, description?: string, tier: string }>} models
 */
export function buildTextModelSelectorItems(models) {
    const grouped = new Map();

    models.forEach((model) => {
        const group = model.group || 'Other';

        if (!grouped.has(group)) {
            grouped.set(group, []);
        }

        grouped.get(group).push(model);
    });

    const items = [];

    grouped.forEach((groupModels, group) => {
        const mergeConfig = MERGED_GROUPS[group];

        if (mergeConfig && groupModels.length > 1) {
            items.push({
                type: 'tiered',
                id: group,
                label: mergeConfig.displayName,
                group,
                variants: sortModelsByDisplayTier(groupModels),
                defaultModelId: mergeConfig.defaultModelId,
            });
            return;
        }

        groupModels.forEach((model) => {
            items.push({ type: 'single', model });
        });
    });

    return items;
}

/**
 * @param {Array<{ id: string, label: string, group: string, description?: string, tier: string }>} models
 */
export function buildCatalogTextTools(models) {
    return buildTextModelSelectorItems(models).map((item) => {
        if (item.type === 'tiered') {
            const defaultVariant = item.variants.find((model) => model.id === item.defaultModelId)
                ?? item.variants[0];
            const displayTier = getModelDisplayTier(defaultVariant);

            return {
                id: defaultVariant.id,
                groupId: item.id,
                label: item.label,
                sub: '',
                page: 'ai-chat',
                tab: 'chat',
                categories: ['chat', 'code'],
                displayTier,
                tiered: true,
                variants: item.variants,
                ...getTextModelVisual(defaultVariant),
            };
        }

        return {
            id: item.model.id,
            label: item.model.label,
            sub: '',
            page: 'ai-chat',
            tab: 'chat',
            categories: ['chat', 'code'],
            displayTier: shouldShowModelBadge(item.model) ? getModelDisplayTier(item.model) : null,
            tiered: false,
            ...getTextModelVisual(item.model),
        };
    });
}

export function getTextModelVisual(model) {
    if (!model) {
        return { accent: 'violet', icon: Bot };
    }

    return {
        accent: MODEL_ACCENTS[model.id] ?? GROUP_ACCENTS[model.group] ?? 'violet',
        icon: MODEL_ICONS[model.id] ?? GROUP_ICONS[model.group] ?? Sparkles,
    };
}

export function findTextModel(models, modelId) {
    return models.find((model) => model.id === modelId) ?? null;
}

export function resolveTextModelId(modelId, models) {
    const normalized = String(modelId || '').trim().toLowerCase();

    if (!normalized) {
        return getDefaultTextModelId(models);
    }

    const direct = models.find((model) => model.id === normalized || model.id === modelId);

    if (direct) {
        return direct.id;
    }

    const alias = LEGACY_MODEL_ALIASES[normalized];

    if (alias && models.some((model) => model.id === alias)) {
        return alias;
    }

    const stored = getStoredTextModelId();

    if (stored && models.some((model) => model.id === stored)) {
        return stored;
    }

    return getDefaultTextModelId(models);
}

export function getDefaultTextModelId(models) {
    const stored = getStoredTextModelId();

    if (stored && models.some((model) => model.id === stored)) {
        return stored;
    }

    return models.find((model) => model.id === 'yandexgpt')?.id ?? models[0]?.id ?? 'yandexgpt';
}

export function isKnownTextModelId(modelId, models) {
    const normalized = String(modelId || '').trim().toLowerCase();

    if (!normalized) {
        return false;
    }

    if (models.some((model) => model.id === normalized || model.id === modelId)) {
        return true;
    }

    return LEGACY_TEXT_MODEL_IDS.includes(normalized) || Boolean(LEGACY_MODEL_ALIASES[normalized]);
}

export function getSelectorItemForModelId(items, modelId) {
    return items.find((item) => (
        item.type === 'single'
            ? item.model.id === modelId
            : item.variants.some((variant) => variant.id === modelId)
    )) ?? null;
}

export function getModelLabel(models, modelId, selectorItems) {
    const model = findTextModel(models, modelId);

    if (model) {
        return model.label;
    }

    const selectorItem = getSelectorItemForModelId(selectorItems, modelId);

    if (selectorItem?.type === 'tiered') {
        return selectorItem.label;
    }

    return modelId;
}

export function shouldShowCatalogBadge(tool) {
    if (!tool || tool.page !== 'ai-chat') {
        return Boolean(tool?.badge || tool?.displayTier);
    }

    if (MODELS_WITHOUT_BADGE.has(tool.id)) {
        return false;
    }

    if (tool.tiered) {
        return false;
    }

    return Boolean(tool.displayTier);
}
