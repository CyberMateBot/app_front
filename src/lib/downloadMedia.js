import { apiFetch, resolveApiUrl } from '../api/httpClient.js';
import { getTelegramWebApp } from './telegramWebApp.js';

function isMobileDevice() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function supportsTelegramDownload() {
    const tg = getTelegramWebApp();
    return typeof tg?.downloadFile === 'function';
}

function prefersNativeDownload() {
    return supportsTelegramDownload() || isMobileDevice();
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

async function tryShareFile(blob, filename) {
    if (typeof navigator.share !== 'function') {
        return false;
    }

    try {
        const file = new File([blob], filename, {
            type: blob.type || 'application/octet-stream',
        });

        if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
            return false;
        }

        await navigator.share({ files: [file], title: filename });
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

async function downloadBlobOnDevice(blob, filename) {
    if (supportsTelegramDownload()) {
        const preparedUrl = await prepareDataDownloadUrl(blob, filename);
        await tryTelegramDownload(preparedUrl, filename);
        return { method: 'telegram' };
    }

    if (isMobileDevice()) {
        const shared = await tryShareFile(blob, filename);

        if (shared) {
            return { method: 'share' };
        }
    }

    triggerBlobDownload(blob, filename);
    return { method: 'blob' };
}

async function downloadRemoteUrl(trimmed, safeFilename) {
    const proxyUrl = buildProxyDownloadUrl(trimmed, safeFilename);

    if (prefersNativeDownload() && proxyUrl) {
        await tryTelegramDownload(proxyUrl, safeFilename);
        return { method: 'telegram' };
    }

    const blob = await fetchViaProxy(trimmed, safeFilename);

    if (isMobileDevice()) {
        const shared = await tryShareFile(blob, safeFilename);

        if (shared) {
            return { method: 'share' };
        }
    }

    triggerBlobDownload(blob, safeFilename);
    return { method: 'blob' };
}

export async function downloadMediaUrl(url, filename = 'cybermate-media') {
    const trimmed = String(url || '').trim();

    if (!trimmed) {
        throw new Error('No media URL to download.');
    }

    const safeFilename = String(filename || 'cybermate-media').trim() || 'cybermate-media';

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        const blob = trimmed.startsWith('data:')
            ? dataUrlToBlob(trimmed)
            : await fetch(trimmed).then((response) => {
                if (!response.ok) {
                    throw new Error('Download failed.');
                }

                return response.blob();
            });

        return downloadBlobOnDevice(blob, safeFilename);
    }

    if (!/^https?:\/\//i.test(trimmed)) {
        throw new Error('Unsupported media URL.');
    }

    return downloadRemoteUrl(trimmed, safeFilename);
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
