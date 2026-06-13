import { createServer } from 'node:http';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const port = Number(process.env.PORT || 3000);
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const NO_CACHE = 'no-cache, no-store, must-revalidate';
const IMMUTABLE = 'public, max-age=31536000, immutable';

const cacheHeaders = [
    {
        source: '**',
        headers: [{ key: 'Cache-Control', value: NO_CACHE }],
    },
    {
        source: 'assets/**',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
    },
    {
        source: 'build-meta.json',
        headers: [{ key: 'Cache-Control', value: NO_CACHE }],
    },
    {
        source: '**/*.{js,css,png,jpg,jpeg,gif,webp,svg,ico,woff,woff2}',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE }],
    },
];

try {
    await access(path.join(dist, 'index.html'));
} catch {
    console.error('ERROR: dist/index.html not found. Run npm run build first.');
    process.exit(1);
}

createServer((request, response) =>
    handler(request, response, {
        public: dist,
        rewrites: [{ source: '**', destination: '/index.html' }],
        headers: cacheHeaders,
    }),
).listen(port, '0.0.0.0', () => {
    console.log(`CyberMate frontend listening on http://0.0.0.0:${port}`);
});
