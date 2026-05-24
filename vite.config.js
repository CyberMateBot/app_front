import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 5173,
        // Railway public domain; true = allow any host (fixes "Blocked request" in Telegram WebView)
        allowedHosts: true,
        proxy: {
            '/v1': {
                target: 'http://localhost:8090',
                changeOrigin: true,
                // Match backend SERVER_*_TIMEOUT and AI provider calls (~90s)
                timeout: 120_000,
                proxyTimeout: 120_000,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 4173,
        allowedHosts: true,
    },
});
