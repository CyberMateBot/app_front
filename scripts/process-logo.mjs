import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = process.argv[2] ?? 'C:\\Users\\Пользователь\\Desktop\\photo_2026-06-19_23-51-56.jpg';
const publicDir = path.resolve(__dirname, '../public');

function isBackgroundPixel(r, g, b, threshold = 55) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const spread = max - min;

    if (max <= threshold) {
        return true;
    }

    if (max <= threshold + 24 && spread <= 14) {
        return true;
    }

    return false;
}

function floodFillBackground(pixels, width, height) {
    const visited = new Uint8Array(width * height);
    const queue = [];

    for (let x = 0; x < width; x += 1) {
        queue.push([x, 0], [x, height - 1]);
    }
    for (let y = 0; y < height; y += 1) {
        queue.push([0, y], [width - 1, y]);
    }

    const pixelIndex = (x, y) => (y * width + x) * 4;

    while (queue.length > 0) {
        const [x, y] = queue.pop();
        if (x < 0 || y < 0 || x >= width || y >= height) {
            continue;
        }

        const visitIndex = y * width + x;
        if (visited[visitIndex]) {
            continue;
        }

        const index = pixelIndex(x, y);
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];

        if (!isBackgroundPixel(r, g, b)) {
            continue;
        }

        visited[visitIndex] = 1;
        pixels[index + 3] = 0;
        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
}

async function removeBlackBackground(input, output) {
    const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = data;
    floodFillBackground(pixels, info.width, info.height);

    for (let x = 0; x < info.width; x += 1) {
        for (const y of [0, info.height - 1]) {
            const index = (y * info.width + x) * 4;
            if (isBackgroundPixel(pixels[index], pixels[index + 1], pixels[index + 2], 72)) {
                pixels[index + 3] = 0;
            }
        }
    }

    for (let y = 0; y < info.height; y += 1) {
        for (const x of [0, info.width - 1]) {
            const index = (y * info.width + x) * 4;
            if (isBackgroundPixel(pixels[index], pixels[index + 1], pixels[index + 2], 72)) {
                pixels[index + 3] = 0;
            }
        }
    }

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alpha = pixels[i + 3];

        if (alpha === 0) {
            continue;
        }

        if (isBackgroundPixel(r, g, b, 38)) {
            pixels[i + 3] = 0;
        }
    }

    await sharp(Buffer.from(pixels), {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4,
        },
    })
        .trim({ threshold: 8 })
        .png()
        .toFile(output);
}

async function createCircularIcon(logoPath, outputPath, size) {
    const logoBuffer = await sharp(logoPath).png().toBuffer();
    const innerSize = Math.round(size * 0.84);

    const resized = await sharp(logoBuffer)
        .resize(innerSize, innerSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

    const circleMask = Buffer.from(
        `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
    );

    const padded = await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{ input: resized, gravity: 'center' }])
        .png()
        .toBuffer();

    await sharp(padded)
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toFile(outputPath);
}

await mkdir(publicDir, { recursive: true });

const logoPath = path.join(publicDir, 'logo-cm.png');
const faviconPath = path.join(publicDir, 'favicon.png');
const appleTouchPath = path.join(publicDir, 'apple-touch-icon.png');

await removeBlackBackground(inputPath, logoPath);
await createCircularIcon(logoPath, faviconPath, 192);
await createCircularIcon(logoPath, appleTouchPath, 180);

console.log('Created:', logoPath, faviconPath, appleTouchPath);
