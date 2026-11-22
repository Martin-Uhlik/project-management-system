import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // VITE_BACKEND comes from the .env in the repository root (or from the environment / Docker build argument)
    envDir: '..',
    server: {
        port: 3000,
        // docker-compose.dev.yml: set VITE_WATCH_POLLING=true if saved files don't reload inside Docker
        watch: { usePolling: process.env.VITE_WATCH_POLLING === 'true' },
    },
    build: {
        outDir: 'build',
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.ts',
        css: false,
    },
});
