import React from 'react';

function OptionSelect({
    id,
    label,
    value,
    values,
    onChange,
    disabled,
    formatValue,
}) {
    if (!values?.length) {
        return null;
    }

    return (
        <label className="media-options__field" htmlFor={id}>
            <span className="media-options__label">{label}</span>
            <select
                id={id}
                className="media-options__select"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            >
                {values.map((item) => {
                    const optionValue = String(item);
                    const optionLabel = formatValue ? formatValue(optionValue) : optionValue;
                    return (
                        <option key={optionValue} value={optionValue}>
                            {optionLabel}
                        </option>
                    );
                })}
            </select>
        </label>
    );
}

export default function MediaModelOptionsBar({
    capabilities,
    values,
    onChange,
    labels,
    disabled = false,
    idPrefix = 'media',
}) {
    const { options = {} } = capabilities ?? {};

    return (
        <div className="media-options" role="group" aria-label={labels.group}>
            <OptionSelect
                id={`${idPrefix}-aspect-ratio`}
                label={labels.aspectRatio}
                value={values.aspectRatio}
                values={options.aspectRatio?.values}
                onChange={(next) => onChange('aspectRatio', next)}
                disabled={disabled}
            />
            <OptionSelect
                id={`${idPrefix}-resolution`}
                label={labels.resolution}
                value={values.resolution}
                values={options.resolution?.values}
                onChange={(next) => onChange('resolution', next)}
                disabled={disabled}
            />
            <OptionSelect
                id={`${idPrefix}-quality`}
                label={labels.quality}
                value={values.quality}
                values={options.quality?.values}
                onChange={(next) => onChange('quality', next)}
                disabled={disabled}
                formatValue={(item) => labels.qualityValues?.[item] ?? item}
            />
            <OptionSelect
                id={`${idPrefix}-duration`}
                label={labels.duration}
                value={String(values.duration ?? '')}
                values={options.duration?.values?.map(String)}
                onChange={(next) => onChange('duration', Number(next))}
                disabled={disabled}
                formatValue={(item) => labels.durationValue?.(Number(item)) ?? `${item}s`}
            />
            <OptionSelect
                id={`${idPrefix}-output-format`}
                label={labels.outputFormat}
                value={values.outputFormat}
                values={options.outputFormat?.values}
                onChange={(next) => onChange('outputFormat', next)}
                disabled={disabled}
            />
        </div>
    );
}
