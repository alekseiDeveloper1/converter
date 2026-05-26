/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['jest-canvas-mock'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;
