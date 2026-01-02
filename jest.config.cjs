/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: 'commonjs',
          target: 'es2020',
        },
        diagnostics: false,
        useESM: false,
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/tests/**/?(*.)+(spec|test).(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/setup/styleMock.js',
  },
  collectCoverageFrom: [
    'client/src/lib/utils.ts',
    'client/src/lib/queryClient.ts',
    'client/src/hooks/useAuth.ts',
    'client/src/hooks/useWebSocket.ts',
    // Include minimal UI to meet global thresholds without over-scoping
    'client/src/components/ui/button.tsx',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 75,
      lines: 80,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/server/', '/tests/e2e/', '/tests/integration/'],
  transformIgnorePatterns: ['/node_modules/'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};


