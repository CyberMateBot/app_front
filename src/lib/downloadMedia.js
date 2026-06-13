import { apiFetch, resolveApiUrl } from '../api/httpClient.js';
import { getTelegramWebApp } from './telegramWebApp.js';

const GALLERY_MIME_BY_EXT = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    heic: 'image/heic',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
};

const GALLERY_EXT_BY_MIME = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
};

function isMobileDevice() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function isGalleryKind(kind) {
    return kind === 'image' || kind === 'video';
}

function shouldSaveToGallery(kind) {
    return isMobileDevice() && isGalleryKind(kind);
}

function supportsTelegramDownload() {
    const tg = getTelegramWebApp();
    return typeof tg?.downloadFile === 'function';
}

function buildProxyDownloadUrl(mediaUrl, filename) {
    const query = new URLSearchParams({
        url: mediaUrl,
        filename,
    });
    const absolute = resolveApiUrl(`/v1/media/download?${query.toString()}`);

    return /^https?:\/\//i.test(absolute) ? absolute : null;
}

function triggerBlobDownload(blob, filename) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

function dataUrlToBlob(dataUrl) {
    const trimmed = String(dataUrl || '').trim();
    const commaIndex = trimmed.indexOf(',');

    if (commaIndex < 0) {
        throw new Error('Invalid data URL.');
    }

    const meta = trimmed.slice(0, commaIndex);
    const data = trimmed.slice(commaIndex + 1);
    const mime = meta.match(/data:([^;]+)/i)?.[1] || 'application/octet-stream';
    const isBase64 = /;base64/i.test(meta);

    if (!isBase64) {
        return new Blob([decodeURIComponent(data)], { type: mime });
    }

    const binary = window.atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mime });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            const commaIndex = result.indexOf(',');

            if (commaIndex < 0) {
                reject(new Error('Failed to encode file.'));
                return;
            }

            resolve(result.slice(commaIndex + 1));
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };

        reader.readAsDataURL(blob);
    });
}

function getFileExtension(filename) {
    const match = String(filename || '').split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : '';
}

function ensureGalleryFilename(filename, mimeType) {
    const safeName = String(filename || 'cybermate-media').trim() || 'cybermate-media';
    const extension = getFileExtension(safeName);

    if (extension) {
        return safeName;
    }

    const suffix = GALLERY_EXT_BY_MIME[mimeType] || '';
    return `${safeName}${suffix}`;
}

function normalizeGalleryBlob(blob, filename, kind) {
    const extension = getFileExtension(filename);
    let mimeType = String(blob?.type || '').trim();

    if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = GALLERY_MIME_BY_EXT[extension] || '';
    }

    if (kind === 'image' && !mimeType.startsWith('image/')) {
        mimeType = 'image/png';
    }

    if (kind === 'video' && !mimeType.startsWith('video/')) {
        mimeType = 'video/mp4';
    }

    const normalizedFilename = ensureGalleryFilename(filename, mimeType);
    const normalizedBlob = mimeType && mimeType !== blob.type
        ? new Blob([blob], { type: mimeType })
        : blob;

    return {
        blob: normalizedBlob,
        filename: normalizedFilename,
        mimeType,
    };
}

async function tryShareToGallery(blob, filename, kind) {
    if (typeof navigator.share !== 'function') {
        return false;
    }

    const { blob: galleryBlob, filename: galleryFilename } = normalizeGalleryBlob(blob, filename, kind);

    try {
        const file = new File([galleryBlob], galleryFilename, {
            type: galleryBlob.type || normalizeGalleryBlob(galleryBlob, galleryFilename, kind).mimeType,
        });

        const shareData = { files: [file] };
        let canAttemptShare = true;

        if (typeof navigator.canShare === 'function') {
            try {
                canAttemptShare = navigator.canShare(shareData);
            } catch {
                canAttemptShare = true;
            }
        }

        if (!canAttemptShare && !isMobileDevice()) {
            return false;
        }

        await navigator.share(shareData);
        return true;
    } catch (error) {
        if (error?.name === 'AbortError') {
            return true;
        }

        return false;
    }
}

function tryTelegramDownload(url, filename) {
    const tg = getTelegramWebApp();

    if (!tg?.downloadFile || !/^https?:\/\//i.test(url)) {
        return Promise.reject(new Error('Telegram download is not available.'));
    }

    return new Promise((resolve, reject) => {
        try {
            tg.downloadFile({ url, file_name: filename }, (accepted) => {
                if (accepted) {
                    resolve();
                    return;
                }

                reject(new Error('Telegram could not start the download.'));
            });
        } catch (error) {
            reject(error instanceof Error ? error : new Error('Telegram download failed.'));
        }
    });
}

async function fetchViaProxy(url, filename) {
    const query = new URLSearchParams({
        url,
        filename,
    });
    const response = await apiFetch(`/v1/media/download?${query.toString()}`);

    if (!response.ok) {
        let message = 'Download failed.';

        try {
            const payload = await response.json();
            message = payload?.error || payload?.message || message;
        } catch {
            const text = await response.text().catch(() => '');
            if (text) {
                message = text;
            }
        }

        throw new Error(message);
    }

    return response.blob();
}

async function prepareDataDownloadUrl(blob, filename) {
    const dataBase64 = await blobToBase64(blob);
    const response = await apiFetch('/v1/media/download/prepare', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            dataBase64,
            mimeType: blob.type || 'application/octet-stream',
            filename,
        }),
    });

    if (!response.ok) {
        let message = 'Download failed.';

        try {
            const payload = await response.json();
            message = payload?.error || payload?.message || message;
        } catch {
            const text = await response.text().catch(() => '');
            if (text) {
                message = text;
            }
        }

        throw new Error(message);
    }

    const payload = await response.json();
    const downloadUrl = String(payload?.downloadUrl || payload?.url || '').trim();

    if (!/^https?:\/\//i.test(downloadUrl)) {
        throw new Error('Download URL is not available.');
    }

    return downloadUrl;
}

async function downloadGalleryBlob(blob, filename, kind) {
    const shared = await tryShareToGallery(blob, filename, kind);

    if (shared) {
        return { method: 'gallery' };
    }

    throw new Error('Gallery save is not available on this device.');
}

async function downloadBlobOnDevice(blob, filename, kind) {
    if (shouldSaveToGallery(kind)) {
        return downloadGalleryBlob(blob, filename, kind);
    }

    if (supportsTelegramDownload()) {
        const preparedUrl = await prepareDataDownloadUrl(blob, filename);
        await tryTelegramDownload(preparedUrl, filename);
        return { method: 'telegram' };
    }

    if (isMobileDevice()) {
        const shared = await tryShareToGallery(blob, filename, kind);

        if (shared) {
            return { method: 'gallery' };
        }
    }

    triggerBlobDownload(blob, filename);
    return { method: 'blob' };
}

async function downloadRemoteUrl(trimmed, safeFilename, kind) {
    if (shouldSaveToGallery(kind)) {
        const blob = await fetchViaProxy(trimmed, safeFilename);
        return downloadGalleryBlob(blob, safeFilename, kind);
    }

    const proxyUrl = buildProxyDownloadUrl(trimmed, safeFilename);

    if (supportsTelegramDownload() && proxyUrl) {
        await tryTelegramDownload(proxyUrl, safeFilename);
        return { method: 'telegram' };
    }

    const blob = await fetchViaProxy(trimmed, safeFilename);

    if (isMobileDevice()) {
        const shared = await tryShareToGallery(blob, safeFilename, kind);

        if (shared) {
            return { method: 'gallery' };
        }
    }

    triggerBlobDownload(blob, safeFilename);
    return { method: 'blob' };
}

export async function downloadMediaUrl(url, filename = 'cybermate-media', options = {}) {
    const trimmed = String(url || '').trim();

    if (!trimmed) {
        throw new Error('No media URL to download.');
    }

    const safeFilename = String(filename || 'cybermate-media').trim() || 'cybermate-media';
    const kind = String(options.kind || '').trim();

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        const blob = trimmed.startsWith('data:')
            ? dataUrlToBlob(trimmed)
            : await fetch(trimmed).then((response) => {
                if (!response.ok) {
                    throw new Error('Download failed.');
                }

                return response.blob();
            });

        return downloadBlobOnDevice(blob, safeFilename, kind);
    }

    if (!/^https?:\/\//i.test(trimmed)) {
        throw new Error('Unsupported media URL.');
    }

    return downloadRemoteUrl(trimmed, safeFilename, kind);
}

export function guessMediaFilename(url, fallbackBase = 'cybermate') {
    const trimmed = String(url || '').trim();
    const path = trimmed.split('?')[0] || '';
    const extMatch = path.match(/\.([a-z0-9]{2,5})$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    if (ext) {
        return `${fallbackBase}.${ext}`;
    }

    if (trimmed.startsWith('data:image/')) {
        const mimeExt = trimmed.match(/^data:image\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${fallbackBase}.${mimeExt || 'png'}`;
    }

    if (trimmed.startsWith('data:video/')) {
        const mimeExt = trimmed.match(/^data:video\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${fallbackBase}.${mimeExt || 'mp4'}`;
    }

    if (trimmed.startsWith('data:audio/')) {
        const mimeExt = trimmed.match(/^data:audio\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${fallbackBase}.${mimeExt || 'mp3'}`;
    }

    return `${fallbackBase}.bin`;
}
