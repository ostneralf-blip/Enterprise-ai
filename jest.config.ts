import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // @react-pdf/renderer ist ESM-only — CJS-Mock verhindert SyntaxError in Jest
    '^@react-pdf/renderer$': '<rootDir>/src/__tests__/__mocks__/react-pdf-renderer.js',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
}

export default createJestConfig(config)
