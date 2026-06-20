/** Text model groups shown under the «Code» catalog filter. */
export const CATALOG_CODE_TEXT_GROUPS = new Set(['DeepSeek', 'Qwen', 'Open-weight GPT']);

export const catalogTabs = [
    { id: 'all', labelKey: 'catalogTabAll' },
    { id: 'chat', labelKey: 'catalogTabChat' },
    { id: 'photo', labelKey: 'catalogTabPhoto' },
    { id: 'video', labelKey: 'catalogTabVideo' },
    { id: 'music', labelKey: 'catalogTabMusic' },
    { id: 'voice', labelKey: 'catalogTabVoice' },
    { id: '3d', labelKey: 'catalogTab3d' },
    { id: 'code', labelKey: 'catalogTabCode' },
];

export function getTextModelCatalogCategories(modelOrGroupId) {
    const group = typeof modelOrGroupId === 'string'
        ? modelOrGroupId
        : (modelOrGroupId?.group || '');

    if (CATALOG_CODE_TEXT_GROUPS.has(group)) {
        return ['chat', 'code'];
    }

    return ['chat'];
}

export function toolMatchesCatalogTab(tool, tab) {
    if (tab === 'all') {
        return true;
    }

    const page = tool.page;
    const toolTab = tool.tab;
    const categories = Array.isArray(tool.categories) ? tool.categories : [];

    switch (tab) {
    case 'chat':
        return page === 'ai-chat';
    case 'photo':
        return page === 'ai-image';
    case 'video':
        return page === 'ai-video';
    case 'voice':
        return page === 'ai-voice' && toolTab === 'voice';
    case 'music':
        return page === 'ai-voice' && (toolTab === 'music' || categories.includes('music'));
    case '3d':
        return page === 'ai-3d';
    case 'code':
        if (page !== 'ai-chat') {
            return false;
        }
        return categories.includes('code')
            || CATALOG_CODE_TEXT_GROUPS.has(tool.groupId);
    default:
        return toolTab === tab || categories.includes(tab);
    }
}
