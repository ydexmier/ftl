import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    testTimeout: 15000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['app/api/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['src/lib/emails/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
