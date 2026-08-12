/** Limits aligned with WaveSpeed upload API (see pkg/ai/wavespeed_upload.go). */

export const MEDIA_UPLOAD_LIMITS = {
    image: {
        maxBytes: 8 * 1024 * 1024,
        accept: 'image/jpeg,image/png,image/webp,image/gif',
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    },
    video: {
        maxBytes: 16 * 1024 * 1024,
        accept: 'video/mp4,video/webm,video/quicktime',
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        extensions: ['.mp4', '.webm', '.mov'],
    },
};

/**
 * @param {'image' | 'video'} kind
 * @param {File} file
 * @param {'ru' | 'en'} [language]
 */
export function validateMediaUploadFile(kind, file, language = 'ru') {
    const limits = MEDIA_UPLOAD_LIMITS[kind];
    const ru = language === 'ru';

    if (!file) {
        return ru ? 'Выберите файл.' : 'Choose a file.';
    }

    const mime = String(file.type || '').toLowerCase();
    const name = String(file.name || '').toLowerCase();
    const mimeOk = limits.mimeTypes.includes(mime);
    const extOk = limits.extensions.some((ext) => name.endsWith(ext));

    if (!mimeOk && !extOk) {
        return ru
            ? `Формат не поддерживается. Допустимо: ${limits.extensions.join(', ')}`
            : `Unsupported format. Allowed: ${limits.extensions.join(', ')}`;
    }

    if (file.size > limits.maxBytes) {
        const maxMb = Math.round(limits.maxBytes / (1024 * 1024));
        return ru
            ? `Файл слишком большой (макс. ${maxMb} МБ).`
            : `File is too large (max ${maxMb} MB).`;
    }

    return '';
}

/**
 * @param {string} url
 * @param {'ru' | 'en'} [language]
 */
export function validateMediaReferenceUrl(url, language = 'ru') {
    const trimmed = String(url || '').trim();
    if (!trimmed) {
        return '';
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return language === 'ru'
                ? 'Ссылка должна начинаться с http:// или https://'
                : 'URL must start with http:// or https://';
        }
    } catch {
        return language === 'ru' ? 'Некорректная ссылка.' : 'Invalid URL.';
    }

    return '';
}

export function formatMediaUploadHint(kind, language = 'ru') {
    const limits = MEDIA_UPLOAD_LIMITS[kind];
    const maxMb = Math.round(limits.maxBytes / (1024 * 1024));
    const formats = limits.extensions.join(', ');

    if (language === 'ru') {
        return `Ссылка или файл (${formats}, до ${maxMb} МБ)`;
    }
    return `URL or file (${formats}, up to ${maxMb} MB)`;
}
