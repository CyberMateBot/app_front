export function getAiVariantOptions(selectorItem, text, kind = 'media') {
    if (!selectorItem) {
        return [];
    }

    if (selectorItem.type === 'single') {
        const model = selectorItem.model;

        if (kind === 'text') {
            return [{ id: model.id, label: model.label }];
        }

        return [{ id: model.id, label: text[model.nameKey] ?? model.id }];
    }

    if (kind === 'text') {
        return selectorItem.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
        }));
    }

    return selectorItem.variants.map((variant) => ({
        id: variant.id,
        label: text[variant.nameKey] ?? variant.id,
    }));
}

export function getAiGroupTitle(selectorItem, text, getChipLabel) {
    if (!selectorItem) {
        return '';
    }

    if (selectorItem.type === 'single') {
        if (selectorItem.model?.label) {
            return selectorItem.model.label;
        }

        return text[selectorItem.model?.nameKey] ?? selectorItem.model?.id ?? '';
    }

    return getChipLabel(selectorItem, text);
}
