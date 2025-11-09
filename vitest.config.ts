import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

const isRunningVitest = !!process.env.VITEST;
const testEnvDir = path.resolve(__dirname, './config/test-env');

export default defineConfig({
  envDir: isRunningVitest ? testEnvDir : process.cwd(),
  plugins: [react()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    envDir: testEnvDir,
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test-utils/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
});

