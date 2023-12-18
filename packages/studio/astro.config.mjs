import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { rpc as astroRpc } from 'astro-rpc';

export default defineConfig({
  output: 'hybrid',
  integrations: [react(), astroRpc()],
  vite: {
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  },
});
