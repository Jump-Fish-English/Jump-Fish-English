import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    include: ['**/*.spec.{ts,tsx}'],
    name: 'jsdom',
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
});
