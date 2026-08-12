import { compressImageFile } from './compressImage.js';
import { validateMediaUploadFile } from './mediaUploadLimits.js';

/**
 * @param {File} file
 * @param {'ru' | 'en'} [language]
 */
export async function readImageReferenceFile(file, language = 'ru') {
    const validationError = validateMediaUploadFile('image', file, language);
    if (validationError) {
        throw new Error(validationError);
    }

    return compressImageFile(file, {
        maxSide: 2048,
        maxBytes: 8 * 1024 * 1024,
        quality: 0.85,
    });
}

/**
 * @param {File} file
 * @param {'ru' | 'en'} [language]
 */
export function readVideoReferenceFile(file, language = 'ru') {
    const validationError = validateMediaUploadFile('video', file, language);
    if (validationError) {
        return Promise.reject(new Error(validationError));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            if (!dataUrl) {
                reject(new Error(language === 'ru' ? 'Не удалось прочитать видео.' : 'Failed to read video.'));
                return;
            }
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            resolve({
                previewUrl: dataUrl,
                base64,
                mimeType: file.type || 'video/mp4',
                name: file.name,
            });
        };
        reader.onerror = () => {
            reject(new Error(language === 'ru' ? 'Не удалось прочитать видео.' : 'Failed to read video.'));
        };
        reader.readAsDataURL(file);
    });
}
