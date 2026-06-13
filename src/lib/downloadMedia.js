import { apiFetch } from '../api/httpClient.js';
import { getTelegramWebApp } from './telegramWebApp.js';

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

async function fetchDirect(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Download failed.');
    }

    return response.blob();
}

export async function downloadMediaUrl(url, filename = 'cybermate-media') {
    const trimmed = String(url || '').trim();

    if (!trimmed) {
        throw new Error('No media URL to download.');
    }

    const safeFilename = String(filename || 'cybermate-media').trim() || 'cybermate-media';

    if (trimmed.startsWith('data:')) {
        triggerBlobDownload(dataUrlToBlob(trimmed), safeFilename);
        return;
    }

    if (trimmed.startsWith('blob:')) {
        triggerBlobDownload(await fetchDirect(trimmed), safeFilename);
        return;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
        throw new Error('Unsupported media URL.');
    }

    const errors = [];

    try {
        const blob = await fetchViaProxy(trimmed, safeFilename);
        triggerBlobDownload(blob, safeFilename);
        return;
    } catch (error) {
        errors.push(error);
    }

    try {
        await tryTelegramDownload(trimmed, safeFilename);
        return;
    } catch (error) {
        errors.push(error);
    }

    try {
        const blob = await fetchDirect(trimmed);
        triggerBlobDownload(blob, safeFilename);
        return;
    } catch (error) {
        errors.push(error);
    }

    const lastError = errors[errors.length - 1];
    throw lastError instanceof Error ? lastError : new Error('Download failed.');
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
