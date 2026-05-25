import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from 'fs';

const input = path.join(__dirname, '../public/cybermate-logo.png');
const output = path.join(__dirname, '../public/cybermate-logo-transparent.png');

const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r <= 45 && g <= 45 && b <= 45) {
            data[i + 3] = 0;
        } else {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }
}

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

const pngBuffer = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .png()
    .toBuffer();

fs.writeFileSync(output, pngBuffer);
console.log('Logo saved:', cropW, 'x', cropH, output);
