import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: 'src/admin',
    server: {
        port: 5174,
        host: true,
    },
    build: {
        sourcemap: false,
        outDir: '../../dist/admin'
    }
});


