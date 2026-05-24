import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const railwayHosts = [
    'tgappfront-production.up.railway.app',
    '.up.railway.app',
];

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 5173,
        allowedHosts: railwayHosts,
        proxy: {
            '/v1': {
                target: 'http://localhost:8090',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: Number(process.env.PORT) || 4173,
        allowedHosts: railwayHosts,
    },
});
