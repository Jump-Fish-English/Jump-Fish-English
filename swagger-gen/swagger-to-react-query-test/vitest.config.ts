import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    typecheck: {
      enabled: true,
    },
    include: ['tests/**/*.vitest.ts'],
  },
});
