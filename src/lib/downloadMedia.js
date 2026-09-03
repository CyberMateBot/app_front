import { apiFetch } from '../api/httpClient.js';
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

function normalizeMediaKind(kind) {
    const value = String(kind || '').trim().toLowerCase();

    if (value === 'image' || value.startsWith('image-')) {
        return 'image';
    }

    if (value === 'video' || value.startsWith('video-')) {
        return 'video';
    }

    if (value === 'audio' || value.startsWith('audio-')) {
        return 'audio';
    }

    if (value === '3d' || value.startsWith('3d-')) {
        return '3d';
    }

    return value;
}

function isGalleryKind(kind) {
    const normalized = normalizeMediaKind(kind);
    return normalized === 'image' || normalized === 'video';
}

function shouldSaveToGallery(kind) {
    return isMobileDevice() && isGalleryKind(kind);
}

function supportsTelegramDownload() {
    const tg = getTelegramWebApp();
    return typeof tg?.downloadFile === 'function';
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
    if (supportsTelegramDownload()) {
        try {
            const preparedUrl = await prepareDataDownloadUrl(blob, filename);
            await tryTelegramDownload(preparedUrl, filename);
            return { method: 'telegram' };
        } catch {
            // fall through to gallery / share / blob download
        }
    }

    if (shouldSaveToGallery(kind)) {
        return downloadGalleryBlob(blob, filename, kind);
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
    // Always pull the real bytes through our proxy first. Handing Telegram
    // `downloadFile` the long `/v1/media/download?url=…` link used to
    // "succeed" and save a solid-black JPEG: Telegram's downloader truncates
    // or fails the signed WaveSpeed URL and writes an empty placeholder,
    // while the in-app <img> preview (loaded by the browser) looks fine.
    const blob = await fetchViaProxy(trimmed, safeFilename);
    if (blob.size < 512) {
        throw new Error('Downloaded file is empty.');
    }
    return downloadBlobOnDevice(blob, safeFilename, kind);
}

export async function downloadMediaUrl(url, filename = 'cybermate-media', options = {}) {
    const trimmed = String(url || '').trim();

    if (!trimmed) {
        throw new Error('No media URL to download.');
    }

    const safeFilename = String(filename || 'cybermate-media').trim() || 'cybermate-media';
    const kind = normalizeMediaKind(options.kind);

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

    // Callers pass a full fallback name that already has an extension
    // (e.g. "image.png", "video.mp4"). Strip it so we never end up
    // stacking a second extension on top (e.g. the "image.png.webp" /
    // "image.png.bin" bug, which several apps/OSes refuse to open at all).
    const rawBase = String(fallbackBase || 'cybermate').trim() || 'cybermate';
    const fallbackExt = getFileExtension(rawBase);
    const baseName = fallbackExt ? rawBase.slice(0, -(fallbackExt.length + 1)) : rawBase;

    const path = trimmed.split('?')[0] || '';
    const extMatch = path.match(/\.([a-z0-9]{2,5})$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    if (ext) {
        return `${baseName}.${ext}`;
    }

    if (trimmed.startsWith('data:image/')) {
        const mimeExt = trimmed.match(/^data:image\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${baseName}.${mimeExt || fallbackExt || 'png'}`;
    }

    if (trimmed.startsWith('data:video/')) {
        const mimeExt = trimmed.match(/^data:video\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${baseName}.${mimeExt || fallbackExt || 'mp4'}`;
    }

    if (trimmed.startsWith('data:audio/')) {
        const mimeExt = trimmed.match(/^data:audio\/([a-z0-9+.-]+)/i)?.[1]?.split('+')[0];
        return `${baseName}.${mimeExt || fallbackExt || 'mp3'}`;
    }

    // Many provider CDN URLs (signed/hashed paths) have no extension at
    // all — fall back to whatever extension the caller expected for this
    // media (from fallbackBase) instead of a generic ".bin" that most
    // photo/video viewers can't open.
    return `${baseName}.${fallbackExt || 'bin'}`;
}
