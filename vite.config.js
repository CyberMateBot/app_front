import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gitRef = (
    process.env.RAILWAY_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || 'dev'
).slice(0, 12);
const builtAt = new Date().toISOString();
// Unique per build — Telegram WebView caches index.html aggressively.
const buildId = `${gitRef}-${Date.now().toString(36)}`;

const CACHE_BUST_SCRIPT = `<script>
(function () {
  var BUILD_ID = ${JSON.stringify(buildId)};
  var PARAM = 'cm_b';
  try {
    var url = new URL(window.location.href);
    if (url.searchParams.get(PARAM) !== BUILD_ID) {
      url.searchParams.set(PARAM, BUILD_ID);
      window.location.replace(url.toString());
      return;
    }
    sessionStorage.setItem('cybermate:active-build-id', BUILD_ID);
  } catch (e) {}
})();
</script>`;

function buildMetaPayload() {
    return {
        buildId,
        builtAt,
        gitRef,
    };
}

function cybermateBuildMetaPlugin() {
    return {
        name: 'cybermate-build-meta',
        transformIndexHtml(html) {
            let next = html.replace(
                '<head>',
                `<head>\n    ${CACHE_BUST_SCRIPT}`,
            );
            next = next.replace(
                '</head>',
                `    <meta name="cm-build-id" content="${buildId}" />\n  </head>`,
            );
            return next;
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
