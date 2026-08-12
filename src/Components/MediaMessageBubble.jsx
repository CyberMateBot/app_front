import React from 'react';
import { Download } from 'lucide-react';

const MEDIA_NOTE_PLACEHOLDERS = [
    'изображение создано.',
    'изображение отредактировано.',
    'видео создано.',
    'видео отредактировано.',
    'видео продлено.',
    'image created.',
    'image created',
    'image edited.',
    'image edited',
    'video created.',
    'video created',
    'video edited.',
    'video edited',
    'video extended.',
    'video extended',
];

function isMediaNote(text) {
    const normalized = String(text ?? '').trim().toLowerCase();
    return MEDIA_NOTE_PLACEHOLDERS.includes(normalized);
}

export default function MediaMessageBubble({
    message,
    onDownload,
    downloadBusy,
    downloadLabel,
    downloadingLabel,
}) {
    if (message.role === 'user') {
        const sourceImageUrl = String(message.sourceImageUrl ?? message.imageUrl ?? message.image_url ?? '').trim();

        return (
            <div className="ai-chat__bubble ai-chat__bubble--user">
                {sourceImageUrl ? (
                    <img
                        className="ai-chat__bubble-image"
                        src={sourceImageUrl}
                        alt=""
                    />
                ) : null}
                {message.content ? <p>{message.content}</p> : null}
            </div>
        );
    }

    const imageUrl = String(message.imageUrl ?? message.image_url ?? '').trim();
    const videoUrl = String(message.videoUrl ?? message.video_url ?? '').trim();
    const showNote = message.content && !isMediaNote(message.content);
    const downloadKey = imageUrl ? 'image' : (videoUrl ? 'video' : '');
    const mediaUrl = imageUrl || videoUrl;

    return (
        <div className="ai-chat__bubble ai-chat__bubble--assistant ai-media-message">
            {showNote ? <p className="ai-media-message__note">{message.content}</p> : null}
            {imageUrl ? (
                <img
                    className="ai-image__preview ai-image__preview--inline"
                    src={imageUrl}
                    alt={message.scenePrompt || ''}
                />
            ) : null}
            {videoUrl ? (
                <video
                    className="ai-image__preview ai-image__preview--video ai-image__preview--inline"
                    src={videoUrl}
                    controls
                    playsInline
                />
            ) : null}
            {mediaUrl && onDownload ? (
                <button
                    type="button"
                    className="ai-media__download ai-media-message__download"
                    onClick={() => onDownload(downloadKey, mediaUrl, imageUrl ? 'image.png' : 'video.mp4')}
                    disabled={downloadBusy === downloadKey}
                >
                    <Download size={14} aria-hidden="true" />
                    {downloadBusy === downloadKey ? downloadingLabel : downloadLabel}
                </button>
            ) : null}
        </div>
    );
}
