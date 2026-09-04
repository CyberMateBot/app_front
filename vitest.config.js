import { defineConfig } from 'vitest/config';

// Separate from vite.config.js on purpose: the app's build config wires up
// Railway-specific plugins/proxies that unit tests don't need, and keeping
// them apart avoids the test runner ever needing a dev server or network.
export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    },
});
