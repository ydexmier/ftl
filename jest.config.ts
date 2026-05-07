import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/api/**/*.test.ts'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@models/(.*)$': '<rootDir>/models/$1',
        '^@components/(.*)$': '<rootDir>/components/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            moduleResolution: 'node',
            esModuleInterop: true,
            allowJs: true,
            strict: false,
          },
        }],
      },
      collectCoverageFrom: [
        'app/api/admin/users/**/*.ts',
      ],
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/ui/**/*.test.tsx', '**/__tests__/ui/**/*.test.ts'],
      preset: 'ts-jest',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@models/(.*)$': '<rootDir>/models/$1',
        '^@components/(.*)$': '<rootDir>/components/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            moduleResolution: 'node',
            esModuleInterop: true,
            allowJs: true,
            jsx: 'react-jsx',
            strict: false,
          },
        }],
      },
    },
  ],
  collectCoverageFrom: [
    'app/api/admin/users/**/*.ts',
  ],
};

export default config;
