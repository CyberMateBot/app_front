import {
    catalogToolModelIds,
    planUnlocksModel,
} from './planGating.js';
import { buildCatalogTextTools } from './textModels.js';
import {
    buildCatalogAudioTools,
    buildCatalogImageTools,
    buildCatalogThreeDTools,
    buildCatalogVideoTools,
} from './mediaModels.js';

function resolveModelLabel(tool, modelId) {
    if (tool?.tiered && Array.isArray(tool.variants)) {
        const variant = tool.variants.find((entry) => entry.id === modelId);
        if (variant?.label) {
            return variant.label;
        }
    }

    return tool?.label ?? modelId;
}

function collectUnlockedModels(tools, planId, category, resolveLabel) {
    const seen = new Set();
    const models = [];

    for (const tool of tools) {
        const ids = catalogToolModelIds(tool);
        for (const modelId of ids) {
            if (!planUnlocksModel(planId, modelId, category)) {
                continue;
            }

            const label = resolveLabel(tool, modelId);
            const key = `${modelId}::${label}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            models.push({ id: modelId, label });
        }
    }

    return models.sort((left, right) => left.label.localeCompare(right.label, 'ru'));
}

/**
 * @param {string} planId
 * @param {{
 *   textModels: unknown[],
 *   imageDefinitions: unknown[],
 *   videoDefinitions: unknown[],
 *   audioDefinitions: unknown[],
 *   threeDDefinitions: unknown[],
 * }} catalogs
 * @param {(tool: Record<string, unknown>, modelId: string) => string} resolveLabel
 */
export function buildPlanModelSections(planId, catalogs, resolveLabel = resolveModelLabel) {
    const sections = [
        {
            id: 'text',
            labelKey: 'catalogSectionChat',
            category: 'text',
            tools: buildCatalogTextTools(catalogs.textModels ?? []),
        },
        {
            id: 'image',
            labelKey: 'catalogSectionPhoto',
            category: 'image',
            tools: buildCatalogImageTools(catalogs.imageDefinitions ?? []),
        },
        {
            id: 'video',
            labelKey: 'catalogSectionVideo',
            category: 'video',
            tools: buildCatalogVideoTools(catalogs.videoDefinitions ?? []),
        },
        {
            id: 'audio',
            labelKey: 'catalogSectionVoice',
            category: 'audio',
            tools: buildCatalogAudioTools(catalogs.audioDefinitions ?? []),
        },
        {
            id: '3d',
            labelKey: 'catalogSection3d',
            category: '3d',
            tools: buildCatalogThreeDTools(catalogs.threeDDefinitions ?? []),
        },
    ];

    return sections
        .map((section) => ({
            id: section.id,
            labelKey: section.labelKey,
            models: collectUnlockedModels(section.tools, planId, section.category, resolveLabel),
        }))
        .filter((section) => section.models.length > 0);
}
