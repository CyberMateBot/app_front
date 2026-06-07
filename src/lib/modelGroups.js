export function formatGroupIdLabel(groupId) {
    return String(groupId || '')
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

/**
 * @template T
 * @param {T[]} items
 * @param {{
 *   getGroupKey?: (item: T) => string,
 *   getItemId?: (item: T) => string,
 *   getGroupLabel?: (groupKey: string, groupItems: T[]) => string,
 *   getDefaultItemId?: (groupKey: string, groupItems: T[]) => string | undefined,
 *   sortGroupItems?: (groupItems: T[]) => T[],
 * }} [options]
 */
export function buildGroupedSelectorItems(items, options = {}) {
    const {
        getGroupKey = (item) => item.group || item.id,
        getItemId = (item) => item.id,
        getGroupLabel,
        getDefaultItemId,
        sortGroupItems = (groupItems) => groupItems,
    } = options;

    const grouped = new Map();

    items.forEach((item) => {
        const groupKey = getGroupKey(item) || getItemId(item);

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, []);
        }

        grouped.get(groupKey).push(item);
    });

    const result = [];

    grouped.forEach((groupItems, groupKey) => {
        const sorted = sortGroupItems(groupItems);

        if (sorted.length > 1) {
            result.push({
                type: 'tiered',
                id: groupKey,
                label: getGroupLabel?.(groupKey, sorted) ?? formatGroupIdLabel(groupKey),
                variants: sorted,
                defaultModelId: getDefaultItemId?.(groupKey, sorted) ?? sorted[0]?.id,
            });
            return;
        }

        result.push({ type: 'single', model: sorted[0] });
    });

    return result;
}

export function getSelectorItemForModelId(items, modelId) {
    return items.find((item) => (
        item.type === 'single'
            ? item.model.id === modelId
            : item.variants.some((variant) => variant.id === modelId)
    )) ?? null;
}
