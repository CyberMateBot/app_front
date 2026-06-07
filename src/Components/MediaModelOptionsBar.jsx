import React from 'react';

function OptionChipGroup({
    label,
    value,
    values,
    onChange,
    disabled,
    formatValue,
    idPrefix,
    optionKey,
}) {
    if (!values?.length) {
        return null;
    }

    const labelId = `${idPrefix}-${optionKey}-label`;

    return (
        <div className="media-options__group">
            <span className="media-options__label" id={labelId}>{label}</span>
            <div
                className="media-options__chips"
                role="group"
                aria-labelledby={labelId}
            >
                {values.map((item) => {
                    const optionValue = String(item);
                    const isActive = String(value ?? '') === optionValue;
                    const optionLabel = formatValue ? formatValue(optionValue) : optionValue;

                    return (
                        <button
                            key={optionValue}
                            type="button"
                            className={`media-options__chip ${isActive ? 'media-options__chip--active' : ''}`}
                            onClick={() => onChange(optionValue)}
                            disabled={disabled}
                            aria-pressed={isActive}
                        >
                            {optionLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function OptionToggleChip({
    label,
    checked,
    onChange,
    disabled,
    id,
    onLabel,
    offLabel,
}) {
    return (
        <div className="media-options__group media-options__group--inline">
            <span className="media-options__label">{label}</span>
            <button
                id={id}
                type="button"
                className={`media-options__chip media-options__chip--toggle ${checked ? 'media-options__chip--active' : ''}`}
                onClick={() => onChange(!checked)}
                disabled={disabled}
                aria-pressed={checked}
            >
                {checked ? onLabel : offLabel}
            </button>
        </div>
    );
}

function formatResolutionLabel(value) {
    const normalized = String(value).toLowerCase();
    if (normalized === '0.5k') {
        return '0.5K';
    }
    if (['1k', '2k', '4k'].includes(normalized)) {
        return normalized.toUpperCase();
    }
    return value;
}

function formatOutputFormatLabel(value) {
    return String(value).toUpperCase();
}

function OptionTextField({
    id,
    label,
    value,
    onChange,
    disabled,
    placeholder,
}) {
    if (label == null) {
        return null;
    }

    return (
        <label className="media-options__group" htmlFor={id}>
            <span className="media-options__label">{label}</span>
            <input
                id={id}
                type="text"
                className="media-options__input"
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                placeholder={placeholder}
            />
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
    cloneMode = false,
}) {
    const { options = {} } = capabilities ?? {};

    return (
        <div className="media-options" role="group" aria-label={labels.group}>
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="language"
                label={labels.language}
                value={values.language}
                values={options.language?.values}
                onChange={(next) => onChange('language', next)}
                disabled={disabled}
                formatValue={(item) => labels.languageValues?.[item] ?? item}
            />
            {!cloneMode ? (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="voice"
                    label={labels.voice}
                    value={values.voice}
                    values={options.voice?.values}
                    onChange={(next) => onChange('voice', next)}
                    disabled={disabled}
                    formatValue={(item) => labels.voiceValues?.[item] ?? item}
                />
            ) : null}
            {!cloneMode && options.styleInstruction ? (
                <OptionTextField
                    id={`${idPrefix}-style-instruction`}
                    label={labels.styleInstruction}
                    value={values.styleInstruction}
                    onChange={(next) => onChange('styleInstruction', next)}
                    disabled={disabled}
                    placeholder={labels.styleInstructionPlaceholder}
                />
            ) : null}
            {cloneMode && options.referenceText ? (
                <OptionTextField
                    id={`${idPrefix}-reference-text`}
                    label={labels.referenceText}
                    value={values.referenceText}
                    onChange={(next) => onChange('referenceText', next)}
                    disabled={disabled}
                    placeholder={labels.referenceTextPlaceholder}
                />
            ) : null}
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="aspect-ratio"
                label={labels.aspectRatio}
                value={values.aspectRatio}
                values={options.aspectRatio?.values}
                onChange={(next) => onChange('aspectRatio', next)}
                disabled={disabled}
            />
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="resolution"
                label={labels.resolution}
                value={values.resolution}
                values={options.resolution?.values}
                onChange={(next) => onChange('resolution', next)}
                disabled={disabled}
                formatValue={formatResolutionLabel}
            />
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="quality"
                label={labels.quality}
                value={values.quality}
                values={options.quality?.values}
                onChange={(next) => onChange('quality', next)}
                disabled={disabled}
                formatValue={(item) => labels.qualityValues?.[item] ?? item}
            />
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="duration"
                label={labels.duration}
                value={String(values.duration ?? '')}
                values={options.duration?.values?.map(String)}
                onChange={(next) => onChange('duration', Number(next))}
                disabled={disabled}
                formatValue={(item) => labels.durationValue?.(Number(item)) ?? `${item}s`}
            />
            <OptionChipGroup
                idPrefix={idPrefix}
                optionKey="output-format"
                label={labels.outputFormat}
                value={values.outputFormat}
                values={options.outputFormat?.values}
                onChange={(next) => onChange('outputFormat', next)}
                disabled={disabled}
                formatValue={formatOutputFormatLabel}
            />
            {options.generateAudio ? (
                <OptionToggleChip
                    id={`${idPrefix}-generate-audio`}
                    label={labels.generateAudio}
                    checked={Boolean(values.generateAudio)}
                    onChange={(next) => onChange('generateAudio', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            ) : null}
            {options.cameraFixed ? (
                <OptionToggleChip
                    id={`${idPrefix}-camera-fixed`}
                    label={labels.cameraFixed}
                    checked={Boolean(values.cameraFixed)}
                    onChange={(next) => onChange('cameraFixed', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            ) : null}
            {options.turboMode ? (
                <OptionToggleChip
                    id={`${idPrefix}-turbo-mode`}
                    label={labels.turboMode}
                    checked={Boolean(values.turboMode)}
                    onChange={(next) => onChange('turboMode', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            ) : null}
        </div>
    );
}
