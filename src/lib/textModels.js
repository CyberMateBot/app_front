import { Bot, Brain, Code2, Feather, Hexagon, Sparkles, Zap } from 'lucide-react';
import { getTextModelCatalogCategories } from './catalogFilters.js';
import {
    buildGroupedSelectorItems,
    formatGroupIdLabel,
    getSelectorItemForModelId as findSelectorItemForModelId,
} from './modelGroups.js';

export const TEXT_MODEL_STORAGE_KEY = 'cybermate-text-model-id';

/** @deprecated legacy ids kept for history entries */
export const LEGACY_TEXT_MODEL_IDS = ['gemini-flash', 'openai', 'gemini'];

const DISPLAY_TIER_ORDER = { lite: 0, pro: 1 };

const MERGED_GROUPS = {
    'Open-weight GPT': { displayName: 'GPT OSS', defaultModelId: 'gpt-oss-20b' },
    Qwen: { displayName: 'Qwen', defaultModelId: 'qwen3.6-35b' },
    Claude: { displayName: 'Claude', defaultModelId: 'claude-haiku-4.5' },
    Gemini: { displayName: 'Gemini', defaultModelId: 'gemini-2.5-flash' },
    DeepSeek: { displayName: 'DeepSeek', defaultModelId: 'deepseek-v4-flash' },
    ChatGPT: { displayName: 'ChatGPT', defaultModelId: 'gpt-4o-mini' },
};

/** UI tier for merged groups: Lite / Pro */
const MODEL_DISPLAY_TIER = {
    'gpt-oss-20b': 'lite',
    'gpt-oss-120b': 'pro',
    'qwen3-235b': 'lite',
    'qwen3.6-35b': 'pro',
    'claude-haiku-4.5': 'lite',
    'claude-sonnet-4.5': 'pro',
    'claude-opus-4.7': 'pro',
    'claude-opus-4.8': 'pro',
    'gemini-2.5-flash': 'lite',
    'gemini-2.5-pro': 'pro',
    'deepseek-v4-flash': 'lite',
    'deepseek-chat': 'lite',
    'deepseek-r1': 'pro',
    'deepseek-v4': 'pro',
    'deepseek-v3.2': 'pro',
    'deepseek-v3.2-exp': 'pro',
    'deepseek-chat-v3-0324': 'pro',
    'gpt-5.4-mini': 'lite',
    'gpt-4.1-nano': 'lite',
    'gpt-4o-mini': 'lite',
    'o4-mini': 'lite',
    'gpt-5.4': 'pro',
    'gpt-4.1': 'pro',
    'gpt-4.1-mini': 'pro',
    'gpt-4o': 'pro',
    'o3': 'pro',
    'o3-mini': 'pro',
    'o1': 'pro',
};

const MODELS_WITHOUT_BADGE = new Set(['yandexgpt']);

/** Text models that accept image_url in chat (vision). Keep in sync with backend SupportsImage. */
const VISION_TEXT_MODEL_IDS = new Set([
    'qwen3.6-35b',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini',
    'gemini-flash',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'claude-haiku-4.5',
    'claude-sonnet-4.5',
    'claude-opus-4.7',
    'claude-opus-4.8',
    'o4-mini',
    'o3',
    'o3-mini',
    'o1',
    'openai',
]);

const GROUP_ACCENTS = {
    Yandex: 'violet',
    'Open-weight GPT': 'blue',
    Qwen: 'teal',
    Claude: 'orange',
    Gemini: 'amber',
    DeepSeek: 'teal',
    ChatGPT: 'green',
};

const MODEL_ACCENTS = {
    yandexgpt: 'violet',
    'deepseek-v4': 'teal',
    'deepseek-r1': 'teal',
    'deepseek-v4-flash': 'teal',
    'deepseek-v3.2': 'teal',
    'deepseek-v3.2-exp': 'teal',
    'deepseek-chat-v3-0324': 'teal',
    'deepseek-chat': 'teal',
    'gpt-oss-20b': 'blue',
    'gpt-oss-120b': 'blue',
    'qwen3.6-35b': 'teal',
    'qwen3-235b': 'teal',
    'claude-haiku-4.5': 'orange',
    'claude-sonnet-4.5': 'orange',
    'claude-opus-4.7': 'orange',
    'claude-opus-4.8': 'orange',
    'gemini-2.5-flash': 'amber',
    'gemini-2.5-pro': 'amber',
    'gpt-5.4': 'green',
    'gpt-5.4-mini': 'green',
    'gpt-4.1': 'green',
    'gpt-4.1-mini': 'green',
    'gpt-4.1-nano': 'green',
    'gpt-4o': 'green',
    'gpt-4o-mini': 'green',
    'o4-mini': 'green',
    'o3': 'green',
    'o3-mini': 'green',
    'o1': 'green',
};

const MODEL_ICONS = {
    yandexgpt: Bot,
    'deepseek-v4': Code2,
    'deepseek-r1': Code2,
    'deepseek-v4-flash': Code2,
    'deepseek-v3.2': Code2,
    'deepseek-v3.2-exp': Code2,
    'deepseek-chat-v3-0324': Code2,
    'deepseek-chat': Code2,
    'gpt-oss-20b': Zap,
    'gpt-oss-120b': Zap,
    'qwen3.6-35b': Brain,
    'qwen3-235b': Brain,
    'claude-haiku-4.5': Feather,
    'claude-sonnet-4.5': Feather,
    'claude-opus-4.7': Feather,
    'claude-opus-4.8': Feather,
    'gemini-2.5-flash': Hexagon,
    'gemini-2.5-pro': Hexagon,
    'gpt-5.4': Sparkles,
    'gpt-5.4-mini': Sparkles,
    'gpt-4.1': Sparkles,
    'gpt-4.1-mini': Sparkles,
    'gpt-4.1-nano': Sparkles,
    'gpt-4o': Sparkles,
    'gpt-4o-mini': Sparkles,
    'o4-mini': Sparkles,
    'o3': Sparkles,
    'o3-mini': Sparkles,
    'o1': Sparkles,
};

const GROUP_ICONS = {
    Yandex: Bot,
    DeepSeek: Code2,
    'Open-weight GPT': Zap,
    Qwen: Brain,
    Claude: Feather,
    Gemini: Hexagon,
    ChatGPT: Sparkles,
};

const CATALOG_DESCRIPTIONS = {
    ru: {
        yandexgpt: 'Повседневные вопросы, письма и тексты на русском',
        DeepSeek: 'Код, отладка, алгоритмы и пошаговые рассуждения',
        'Open-weight GPT': 'Тексты и идеи: черновики, правки и рассуждения',
        Qwen: 'Длинные документы, сводки и мультиязычный анализ',
        Claude: 'Anthropic Claude: от быстрых ответов до максимального качества',
        Gemini: 'Google Gemini: текст и изображения через Wavespeed',
        ChatGPT: 'OpenAI ChatGPT: от быстрых ответов до o-серии рассуждений',
    },
    en: {
        yandexgpt: 'Everyday questions, emails, and text in Russian',
        DeepSeek: 'Code, debugging, algorithms, and step-by-step reasoning',
        'Open-weight GPT': 'Writing and ideas: drafts, edits, and reasoning',
        Qwen: 'Long documents, summaries, and multilingual analysis',
        Claude: 'Anthropic Claude: from fast replies to top-tier quality',
        Gemini: 'Google Gemini: text and images via Wavespeed',
        ChatGPT: 'OpenAI ChatGPT: from fast chat to o-series reasoning',
    },
};

const LEGACY_MODEL_ALIASES = {
    'gemini-flash': 'gemini-2.5-flash',
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o-mini',
    yandex: 'yandexgpt',
    default: 'yandexgpt',
    deepseek: 'deepseek-v3.2',
    'deepseek-v32': 'deepseek-v3.2',
    'deepseek-v32/latest': 'deepseek-v3.2',
    'deepseek-r1': 'deepseek-r1',
    'deepseek/deepseek-r1': 'deepseek-r1',
};

/** Fallback when API models are not loaded yet or request failed */
export const DEFAULT_TEXT_MODELS = [
    {
        id: 'yandexgpt',
        label: 'YandexGPT',
        group: 'Yandex',
        description: CATALOG_DESCRIPTIONS.ru.yandexgpt,
        tier: 'standard',
    },
    {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        group: 'ChatGPT',
        description: CATALOG_DESCRIPTIONS.ru.ChatGPT,
        tier: 'fast',
        supports_image: true,
    },
    {
        id: 'gpt-5.4',
        label: 'GPT-5.4',
        group: 'ChatGPT',
        description: CATALOG_DESCRIPTIONS.ru.ChatGPT,
        tier: 'pro',
    },
    {
        id: 'claude-haiku-4.5',
        label: 'Claude Haiku 4.5',
        group: 'Claude',
        description: CATALOG_DESCRIPTIONS.ru.Claude,
        tier: 'fast',
    },
    {
        id: 'claude-sonnet-4.5',
        label: 'Claude Sonnet 4.5',
        group: 'Claude',
        description: CATALOG_DESCRIPTIONS.ru.Claude,
        tier: 'standard',
    },
    {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        group: 'Gemini',
        description: CATALOG_DESCRIPTIONS.ru.Gemini,
        tier: 'fast',
        supports_image: true,
    },
    {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        group: 'Gemini',
        description: CATALOG_DESCRIPTIONS.ru.Gemini,
        tier: 'pro',
        supports_image: true,
    },
    {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        group: 'DeepSeek',
        description: CATALOG_DESCRIPTIONS.ru.DeepSeek,
        tier: 'fast',
    },
    {
        id: 'deepseek-v4',
        label: 'DeepSeek V4',
        group: 'DeepSeek',
        description: CATALOG_DESCRIPTIONS.ru.DeepSeek,
        tier: 'pro',
    },
    {
        id: 'gpt-oss-20b',
        label: 'GPT OSS 20B',
        group: 'Open-weight GPT',
        description: CATALOG_DESCRIPTIONS.ru['Open-weight GPT'],
        tier: 'lite',
    },
    {
        id: 'gpt-oss-120b',
        label: 'GPT OSS 120B',
        group: 'Open-weight GPT',
        description: CATALOG_DESCRIPTIONS.ru['Open-weight GPT'],
        tier: 'pro',
    },
    {
        id: 'qwen3.6-35b',
        label: 'Qwen 3.6 35B',
        group: 'Qwen',
        description: CATALOG_DESCRIPTIONS.ru.Qwen,
        tier: 'pro',
        supports_image: true,
    },
    {
        id: 'qwen3-235b',
        label: 'Qwen 235B',
        group: 'Qwen',
        description: CATALOG_DESCRIPTIONS.ru.Qwen,
        tier: 'lite',
    },
];

export function resolveEffectiveTextModels(models) {
    return Array.isArray(models) && models.length > 0 ? models : DEFAULT_TEXT_MODELS;
}

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

export function textModelSupportsImage(model) {
    if (!model) {
        return false;
    }

    if (model.supports_image) {
        return true;
    }

    const id = String(model.id || '').trim().toLowerCase();
    return VISION_TEXT_MODEL_IDS.has(id);
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

    const variantDescription = tool.variants?.find((variant) => variant.description)?.description;

    if (variantDescription) {
        return variantDescription;
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
    return buildGroupedSelectorItems(models, {
        getGroupKey: (model) => {
            if (model.id === 'yandexgpt') {
                return model.id;
            }

            return model.group || model.id;
        },
        getGroupLabel: (group) => MERGED_GROUPS[group]?.displayName ?? formatGroupIdLabel(group),
        getDefaultItemId: (group, groupModels) => (
            MERGED_GROUPS[group]?.defaultModelId ?? groupModels[0]?.id
        ),
        sortGroupItems: sortModelsByDisplayTier,
    });
}

export function buildTextModelGroupOptions(selectorItems, getLabel) {
    return selectorItems.map((item) => {
        if (item.type === 'single') {
            return {
                id: item.model.id,
                label: getLabel(item),
                modelId: item.model.id,
            };
        }

        return {
            id: item.id,
            label: getLabel(item),
            modelId: item.defaultModelId,
        };
    });
}

export function getActiveTextModelGroupId(selectorItem) {
    if (!selectorItem) {
        return '';
    }

    if (selectorItem.type === 'single') {
        return selectorItem.model.id;
    }

    return selectorItem.id;
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
                sub: defaultVariant.description ?? '',
                page: 'ai-chat',
                tab: 'chat',
                categories: getTextModelCatalogCategories(item.id),
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
            categories: getTextModelCatalogCategories(item.model),
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
    return findSelectorItemForModelId(items, modelId);
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
