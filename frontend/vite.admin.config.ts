import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        host: true,
        open: 'admin.html'
    },
    build: {
        sourcemap: false,
        outDir: 'dist/admin/',
        rollupOptions: {
            input: 'admin.html'
        }
    }
});


