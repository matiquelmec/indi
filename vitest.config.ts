import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // Remove plugins to avoid version conflicts
  plugins: [],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    globals: true,
    css: true,
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/', 'dist/', 'backend/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'backend/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})