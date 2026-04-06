module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/scripts/**',
    // Third-party email + heavy PDF pipeline; not practical for unit coverage targets
    '!src/utils/mailgun.service.ts',
    '!src/api/v2/invoices/invoices.service.ts',
    '!src/api/v2/invoices/invoices.controller.ts',
    '!src/api/v2/invoices/invoices.validation.ts',
    // v1 invoice HTTP/XML paths are superseded by v2; keep routes wired but out of coverage budget
    '!src/api/v1/invoices/invoices.controller.ts',
    '!src/api/v1/invoices/invoices.validation.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 90,
      lines: 90,
      functions: 88,
      branches: 68,
    },
  },
};
