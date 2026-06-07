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
