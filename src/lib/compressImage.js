/**
 * Сжимает изображение перед отправкой в API (меньше base64 → быстрее запрос).
 */
export function compressImageFile(
    file,
    { maxSide = 2048, maxBytes = 2 * 1024 * 1024, quality = 0.85 } = {},
) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = image;
            const scale = Math.min(1, maxSide / Math.max(width, height, 1));
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas is not supported'));
                return;
            }
            ctx.drawImage(image, 0, 0, width, height);

            const exportWithQuality = (q) => {
                const dataUrl = canvas.toDataURL('image/jpeg', q);
                const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
                const approxBytes = Math.ceil((base64.length * 3) / 4);

                if (approxBytes > maxBytes && q > 0.45) {
                    exportWithQuality(Math.max(0.45, q - 0.1));
                    return;
                }

                resolve({
                    previewUrl: dataUrl,
                    base64,
                    mimeType: 'image/jpeg',
                });
            };

            exportWithQuality(quality);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        image.src = objectUrl;
    });
}
