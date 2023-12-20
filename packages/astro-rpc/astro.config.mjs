import { defineConfig } from 'astro/config';
import { rpc as astroRpc } from './src/main';

export default defineConfig({
  output: 'hybrid',
  integrations: [
    astroRpc()
  ],
  srcDir: 'e2e',
});
