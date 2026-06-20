import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const buildId = (
    process.env.RAILWAY_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || String(Date.now())
).slice(0, 12);

function buildMetaPayload() {
    return {
        buildId,
        builtAt: new Date().toISOString(),
    };
}

function cybermateBuildMetaPlugin() {
    return {
        name: 'cybermate-build-meta',
        transformIndexHtml(html) {
            return html.replace(
                '</head>',
                `    <meta name="cm-build-id" content="${buildId}" />\n  </head>`,
            );
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const path = req.url?.split('?')[0];
                if (path !== '/build-meta.json') {
                    next();
                    return;
                }

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Cache-Control', 'no-store');
                res.end(`${JSON.stringify(buildMetaPayload())}\n`);
            });
        },
        closeBundle() {
            const outDir = resolve(process.cwd(), 'dist');
            writeFileSync(
                resolve(outDir, 'build-meta.json'),
                `${JSON.stringify(buildMetaPayload())}\n`,
            );
        },
    };
}

export default defineConfig({
    plugins: [react(), cybermateBuildMetaPlugin()],
    server: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 5173,
        // Railway public domain; true = allow any host (fixes "Blocked request" in Telegram WebView)
        allowedHosts: true,
        proxy: {
            '/v1': {
                target: 'http://127.0.0.1:8090',
                changeOrigin: true,
                // Image/video generation + WaveSpeed polling can take several minutes
                timeout: 360_000,
                proxyTimeout: 360_000,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 4173,
        allowedHosts: true,
    },
});
