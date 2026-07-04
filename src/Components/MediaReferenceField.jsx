import { useId, useRef } from 'react';
import { Upload, Link2, X } from 'lucide-react';
import {
    MEDIA_UPLOAD_LIMITS,
    formatMediaUploadHint,
    validateMediaReferenceUrl,
} from '../lib/mediaUploadLimits.js';

/**
 * @param {object} props
 * @param {'image' | 'video'} props.kind
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {boolean} [props.required]
 * @param {string} props.url
 * @param {(value: string) => void} props.onUrlChange
 * @param {{ previewUrl?: string, name?: string } | null} [props.attachment]
 * @param {(value: null) => void} props.onAttachmentClear
 * @param {(file: File) => void | Promise<void>} props.onFileSelect
 * @param {boolean} [props.disabled]
 * @param {string} [props.idPrefix]
 * @param {'ru' | 'en'} [props.language]
 * @param {string} [props.urlPlaceholder]
 * @param {string} [props.uploadLabel]
 * @param {string} [props.dropHint]
 */
export default function MediaReferenceField({
    kind,
    label,
    hint,
    required = false,
    url,
    onUrlChange,
    attachment,
    onAttachmentClear,
    onFileSelect,
    disabled = false,
    idPrefix = 'media-ref',
    language = 'ru',
    urlPlaceholder,
    uploadLabel,
    dropHint,
}) {
    const autoId = useId();
    const inputId = `${idPrefix}-${autoId}`;
    const fileInputRef = useRef(null);
    const limits = MEDIA_UPLOAD_LIMITS[kind];
    const resolvedHint = hint || formatMediaUploadHint(kind, language);
    const urlError = validateMediaReferenceUrl(url, language);

    const handleUrlChange = (event) => {
        onUrlChange(event.target.value);
        if (attachment) {
            onAttachmentClear();
        }
    };

    const handleFileInput = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || disabled) {
            return;
        }
        await onFileSelect(file);
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        if (disabled) {
            return;
        }
        const file = event.dataTransfer?.files?.[0];
        if (!file) {
            return;
        }
        await onFileSelect(file);
    };

    const preventDefaults = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const previewIsVideo = kind === 'video';

    return (
        <div className="media-reference-field">
            <label className="media-reference-field__label" htmlFor={`${inputId}-url`}>
                {label}
                {required ? <span className="media-reference-field__required">*</span> : null}
            </label>
            <p className="media-reference-field__hint">{resolvedHint}</p>

            <div className="media-reference-field__url-row">
                <Link2 size={16} aria-hidden="true" className="media-reference-field__url-icon" />
                <input
                    id={`${inputId}-url`}
                    className="media-reference-field__url-input"
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder={urlPlaceholder || 'https://'}
                    disabled={disabled || Boolean(attachment)}
                    aria-invalid={urlError ? 'true' : undefined}
                />
            </div>
            {urlError ? (
                <p className="media-reference-field__error" role="alert">{urlError}</p>
            ) : null}

            <div
                className={`media-reference-field__dropzone ${disabled ? 'media-reference-field__dropzone--disabled' : ''}`}
                onDragEnter={preventDefaults}
                onDragOver={preventDefaults}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    id={`${inputId}-file`}
                    type="file"
                    accept={limits.accept}
                    className="media-reference-field__file-input"
                    aria-hidden="true"
                    tabIndex={-1}
                    disabled={disabled}
                    onChange={handleFileInput}
                />

                {attachment ? (
                    <div className="media-reference-field__preview">
                        {previewIsVideo ? (
                            <video
                                src={attachment.previewUrl}
                                className="media-reference-field__preview-media"
                                muted
                                playsInline
                                controls
                            />
                        ) : (
                            <img
                                src={attachment.previewUrl}
                                alt=""
                                className="media-reference-field__preview-media"
                            />
                        )}
                        <button
                            type="button"
                            className="media-reference-field__clear"
                            aria-label={language === 'ru' ? 'Удалить файл' : 'Remove file'}
                            disabled={disabled}
                            onClick={onAttachmentClear}
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                        {attachment.name ? (
                            <span className="media-reference-field__filename">{attachment.name}</span>
                        ) : null}
                    </div>
                ) : (
                    <button
                        type="button"
                        className="media-reference-field__upload-btn"
                        disabled={disabled}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={18} aria-hidden="true" />
                        <span>{uploadLabel || (language === 'ru' ? 'Загрузить файл' : 'Upload file')}</span>
                        <span className="media-reference-field__drop-text">
                            {dropHint || (language === 'ru' ? 'или перетащите сюда' : 'or drag & drop')}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
