import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      DB_PATH: ':memory:',
      JWT_SECRET: 'test-secret',
      LOG_LEVEL: 'silent',
    },
  },
});
