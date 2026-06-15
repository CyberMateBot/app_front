import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    multiline = false,
    hideLabel = false,
}) {
    if (!hideLabel && label == null) {
        return null;
    }

    const InputTag = multiline ? 'textarea' : 'input';

    const field = (
        <InputTag
            id={id}
            type={multiline ? undefined : 'text'}
            className={`media-options__input ${multiline ? 'media-options__input--area' : ''}`}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={multiline ? 2 : undefined}
        />
    );

    if (hideLabel) {
        return field;
    }

    return (
        <label className="media-options__group" htmlFor={id}>
            <span className="media-options__label">{label}</span>
            {field}
        </label>
    );
}

function OptionDurationRange({
    idPrefix,
    label,
    value,
    values,
    presets,
    onChange,
    disabled,
    formatValue,
    hideLabel = false,
}) {
    if (!values?.length) {
        return null;
    }

    const min = values[0];
    const max = values[values.length - 1];
    const presetList = presets?.length ? presets : [5, 10];

    const content = (
        <>
            <div className="media-options__chips">
                {presetList.map((preset) => {
                    const isActive = Number(value) === preset;
                    return (
                        <button
                            key={preset}
                            type="button"
                            className={`media-options__chip ${isActive ? 'media-options__chip--active' : ''}`}
                            onClick={() => onChange(preset)}
                            disabled={disabled}
                            aria-pressed={isActive}
                        >
                            {formatValue ? formatValue(preset) : `${preset}s`}
                        </button>
                    );
                })}
            </div>
            <div className="media-options__range-row">
                <input
                    id={`${idPrefix}-duration-range`}
                    type="range"
                    className="media-options__range"
                    min={min}
                    max={max}
                    step={1}
                    value={value ?? min}
                    onChange={(event) => onChange(Number(event.target.value))}
                    disabled={disabled}
                />
                <span className="media-options__range-value">
                    {formatValue ? formatValue(Number(value ?? min)) : `${value ?? min}s`}
                </span>
            </div>
        </>
    );

    if (hideLabel) {
        return <div className="media-options__group">{content}</div>;
    }

    return (
        <div className="media-options__group">
            <span className="media-options__label">{label}</span>
            {content}
        </div>
    );
}

function OptionCameraAxis({
    id,
    label,
    value,
    min,
    max,
    onChange,
    disabled,
}) {
    return (
        <label className="media-options__axis" htmlFor={id}>
            <span className="media-options__axis-label">{label}</span>
            <input
                id={id}
                type="range"
                className="media-options__range media-options__range--axis"
                min={min}
                max={max}
                step={1}
                value={value ?? 0}
                onChange={(event) => onChange(Number(event.target.value))}
                disabled={disabled}
            />
            <span className="media-options__axis-value">{value ?? 0}</span>
        </label>
    );
}

function OptionPicker({
    id,
    label,
    summary,
    open,
    onToggle,
    disabled,
    children,
}) {
    return (
        <div className={`media-picker ${open ? 'media-picker--open' : ''}`}>
            <button
                id={id}
                type="button"
                className="media-picker__trigger"
                onClick={onToggle}
                disabled={disabled}
                aria-expanded={open}
            >
                <span className="media-picker__label">{label}</span>
                <span className="media-picker__summary">{summary}</span>
                <ChevronDown size={14} className="media-picker__chevron" aria-hidden="true" />
            </button>
            {open ? (
                <div className="media-picker__panel">
                    {children}
                </div>
            ) : null}
        </div>
    );
}

function wrapPicker({
    collapsed,
    openKey,
    setOpenKey,
    optionKey,
    label,
    summary,
    disabled,
    idPrefix,
    children,
}) {
    if (!collapsed) {
        return children;
    }

    return (
        <OptionPicker
            id={`${idPrefix}-picker-${optionKey}`}
            label={label}
            summary={summary}
            open={openKey === optionKey}
            onToggle={() => setOpenKey((prev) => (prev === optionKey ? null : optionKey))}
            disabled={disabled}
        >
            {children}
        </OptionPicker>
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
    collapsed = false,
}) {
    const { options = {} } = capabilities ?? {};
    const [openKey, setOpenKey] = useState(null);

    const picker = (optionKey, label, summary, content) => wrapPicker({
        collapsed,
        openKey,
        setOpenKey,
        optionKey,
        label,
        summary,
        disabled,
        idPrefix,
        children: content,
    });

    const formatDuration = (seconds) => labels.durationValue?.(Number(seconds)) ?? `${seconds}s`;

    return (
        <div className={`media-options ${collapsed ? 'media-options--collapsed' : ''}`} role="group" aria-label={labels.group}>
            {options.language?.values ? picker('language', labels.language, labels.languageValues?.[values.language] ?? values.language, (
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
            )) : null}

            {!cloneMode && options.voice?.values ? picker('voice', labels.voice, labels.voiceValues?.[values.voice] ?? values.voice, (
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
            )) : null}

            {options.speed?.values ? picker('speed', labels.speed, values.speed, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="speed"
                    label={labels.speed}
                    value={values.speed}
                    values={options.speed?.values}
                    onChange={(next) => onChange('speed', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.emotion?.values ? picker('emotion', labels.emotion, labels.emotionValues?.[values.emotion] ?? values.emotion, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="emotion"
                    label={labels.emotion}
                    value={values.emotion}
                    values={options.emotion?.values}
                    onChange={(next) => onChange('emotion', next)}
                    disabled={disabled}
                    formatValue={(item) => labels.emotionValues?.[item] ?? item}
                />
            )) : null}

            {options.numberOfSongs?.values ? picker('numberOfSongs', labels.numberOfSongs, values.numberOfSongs, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="number-of-songs"
                    label={labels.numberOfSongs}
                    value={values.numberOfSongs}
                    values={options.numberOfSongs?.values}
                    onChange={(next) => onChange('numberOfSongs', next)}
                    disabled={disabled}
                />
            )) : null}

            {!cloneMode && options.styleInstruction ? picker('styleInstruction', labels.styleInstruction, values.styleInstruction?.trim() || '—', (
                <OptionTextField
                    id={`${idPrefix}-style-instruction`}
                    label={labels.styleInstruction}
                    value={values.styleInstruction}
                    onChange={(next) => onChange('styleInstruction', next)}
                    disabled={disabled}
                    placeholder={labels.styleInstructionPlaceholder}
                    hideLabel={collapsed}
                />
            )) : null}

            {cloneMode && options.referenceText ? picker('referenceText', labels.referenceText, values.referenceText?.trim() || '—', (
                <OptionTextField
                    id={`${idPrefix}-reference-text`}
                    label={labels.referenceText}
                    value={values.referenceText}
                    onChange={(next) => onChange('referenceText', next)}
                    disabled={disabled}
                    placeholder={labels.referenceTextPlaceholder}
                    hideLabel={collapsed}
                />
            )) : null}

            {options.aspectRatio?.values ? picker('aspectRatio', labels.aspectRatio, values.aspectRatio, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="aspect-ratio"
                    label={labels.aspectRatio}
                    value={values.aspectRatio}
                    values={options.aspectRatio?.values}
                    onChange={(next) => onChange('aspectRatio', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.resolution?.values ? picker('resolution', labels.resolution, formatResolutionLabel(values.resolution), (
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
            )) : null}

            {options.quality?.values ? picker('quality', labels.quality, labels.qualityValues?.[values.quality] ?? values.quality, (
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
            )) : null}

            {options.duration?.values ? picker('duration', labels.duration, formatDuration(values.duration ?? options.duration.default), (
                options.duration?.presets ? (
                    <OptionDurationRange
                        idPrefix={idPrefix}
                        label={labels.duration}
                        value={values.duration}
                        values={options.duration.values}
                        presets={options.duration.presets}
                        onChange={(next) => onChange('duration', next)}
                        disabled={disabled}
                        formatValue={formatDuration}
                        hideLabel={collapsed}
                    />
                ) : (
                    <OptionChipGroup
                        idPrefix={idPrefix}
                        optionKey="duration"
                        label={labels.duration}
                        value={String(values.duration ?? '')}
                        values={options.duration?.values?.map(String)}
                        onChange={(next) => onChange('duration', Number(next))}
                        disabled={disabled}
                        formatValue={(item) => formatDuration(Number(item))}
                    />
                )
            )) : null}

            {options.qualityTier?.values ? picker('qualityTier', labels.qualityTier, labels.qualityTierValues?.[values.qualityTier] ?? values.qualityTier, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="quality-tier"
                    label={labels.qualityTier}
                    value={values.qualityTier}
                    values={options.qualityTier?.values}
                    onChange={(next) => onChange('qualityTier', next)}
                    disabled={disabled}
                    formatValue={(item) => labels.qualityTierValues?.[item] ?? item}
                />
            )) : null}

            {options.negativePrompt ? picker('negativePrompt', labels.negativePrompt, values.negativePrompt?.trim() ? `${values.negativePrompt.trim().slice(0, 28)}…` : '—', (
                <OptionTextField
                    id={`${idPrefix}-negative-prompt`}
                    label={labels.negativePrompt}
                    value={values.negativePrompt}
                    onChange={(next) => onChange('negativePrompt', next)}
                    disabled={disabled}
                    placeholder={labels.negativePromptPlaceholder}
                    multiline
                    hideLabel={collapsed}
                />
            )) : null}

            {options.cameraMovement?.values ? picker('cameraMovement', labels.cameraMovement, labels.cameraMovementValues?.[values.cameraMovement] ?? values.cameraMovement, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="camera-movement"
                    label={labels.cameraMovement}
                    value={values.cameraMovement}
                    values={options.cameraMovement?.values}
                    onChange={(next) => onChange('cameraMovement', next)}
                    disabled={disabled}
                    formatValue={(item) => labels.cameraMovementValues?.[item] ?? item}
                />
            )) : null}

            {options.cameraAxes && values.cameraMovement === 'simple' ? picker('cameraAxes', labels.cameraAxes, labels.mediaCameraMovementSimple ?? 'Simple', (
                <div className="media-options__group media-options__group--camera">
                    {collapsed ? null : <span className="media-options__label">{labels.cameraAxes}</span>}
                    <p className="media-options__hint">{labels.cameraAxesHint}</p>
                    <div className="media-options__axes">
                        {options.cameraAxes.keys.map((axisKey) => (
                            <OptionCameraAxis
                                key={axisKey}
                                id={`${idPrefix}-camera-${axisKey}`}
                                label={labels.cameraAxisValues?.[axisKey] ?? axisKey}
                                value={values[`camera${axisKey.charAt(0).toUpperCase()}${axisKey.slice(1)}`]}
                                min={options.cameraAxes.min}
                                max={options.cameraAxes.max}
                                onChange={(next) => onChange(`camera${axisKey.charAt(0).toUpperCase()}${axisKey.slice(1)}`, next)}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </div>
            )) : null}

            {options.outputFormat?.values ? picker('outputFormat', labels.outputFormat, formatOutputFormatLabel(values.outputFormat), (
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
            )) : null}

            {options.sound ? picker('sound', labels.sound, values.sound ? labels.toggleOn : labels.toggleOff, (
                <OptionToggleChip
                    id={`${idPrefix}-sound`}
                    label={labels.sound}
                    checked={Boolean(values.sound)}
                    onChange={(next) => onChange('sound', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            )) : null}

            {options.generateAudio ? picker('generateAudio', labels.generateAudio, values.generateAudio ? labels.toggleOn : labels.toggleOff, (
                <OptionToggleChip
                    id={`${idPrefix}-generate-audio`}
                    label={labels.generateAudio}
                    checked={Boolean(values.generateAudio)}
                    onChange={(next) => onChange('generateAudio', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            )) : null}

            {options.cameraFixed ? picker('cameraFixed', labels.cameraFixed, values.cameraFixed ? labels.toggleOn : labels.toggleOff, (
                <OptionToggleChip
                    id={`${idPrefix}-camera-fixed`}
                    label={labels.cameraFixed}
                    checked={Boolean(values.cameraFixed)}
                    onChange={(next) => onChange('cameraFixed', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            )) : null}

            {options.turboMode ? picker('turboMode', labels.turboMode, values.turboMode ? labels.toggleOn : labels.toggleOff, (
                <OptionToggleChip
                    id={`${idPrefix}-turbo-mode`}
                    label={labels.turboMode}
                    checked={Boolean(values.turboMode)}
                    onChange={(next) => onChange('turboMode', next)}
                    disabled={disabled}
                    onLabel={labels.toggleOn}
                    offLabel={labels.toggleOff}
                />
            )) : null}

            {options.textureQuality?.values ? picker('textureQuality', labels.textureQuality, values.textureQuality, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="texture-quality"
                    label={labels.textureQuality}
                    value={values.textureQuality}
                    values={options.textureQuality?.values}
                    onChange={(next) => onChange('textureQuality', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.geometryQuality?.values ? picker('geometryQuality', labels.geometryQuality, values.geometryQuality, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="geometry-quality"
                    label={labels.geometryQuality}
                    value={values.geometryQuality}
                    values={options.geometryQuality?.values}
                    onChange={(next) => onChange('geometryQuality', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.mode?.values ? picker('mode', labels.mode, values.mode, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="mode"
                    label={labels.mode}
                    value={values.mode}
                    values={options.mode?.values}
                    onChange={(next) => onChange('mode', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.artStyle?.values ? picker('artStyle', labels.artStyle, values.artStyle, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="art-style"
                    label={labels.artStyle}
                    value={values.artStyle}
                    values={options.artStyle?.values}
                    onChange={(next) => onChange('artStyle', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.topology?.values ? picker('topology', labels.topology, values.topology, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="topology"
                    label={labels.topology}
                    value={values.topology}
                    values={options.topology?.values}
                    onChange={(next) => onChange('topology', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.tier?.values ? picker('tier', labels.tier, values.tier, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="tier"
                    label={labels.tier}
                    value={values.tier}
                    values={options.tier?.values}
                    onChange={(next) => onChange('tier', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.material?.values ? picker('material', labels.material, values.material, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="material"
                    label={labels.material}
                    value={values.material}
                    values={options.material?.values}
                    onChange={(next) => onChange('material', next)}
                    disabled={disabled}
                />
            )) : null}

            {options.geometryFileFormat?.values ? picker('geometryFileFormat', labels.geometryFileFormat, values.geometryFileFormat, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="geometry-file-format"
                    label={labels.geometryFileFormat}
                    value={values.geometryFileFormat}
                    values={options.geometryFileFormat?.values}
                    onChange={(next) => onChange('geometryFileFormat', next)}
                    disabled={disabled}
                    formatValue={formatOutputFormatLabel}
                />
            )) : null}

            {options.textureMode?.values ? picker('textureMode', labels.textureMode, values.textureMode, (
                <OptionChipGroup
                    idPrefix={idPrefix}
                    optionKey="texture-mode"
                    label={labels.textureMode}
                    value={values.textureMode}
                    values={options.textureMode?.values}
                    onChange={(next) => onChange('textureMode', next)}
                    disabled={disabled}
                />
            )) : null}
        </div>
    );
}
