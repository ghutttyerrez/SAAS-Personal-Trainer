module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.test.js",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/src/__tests__/setup.ts",
    "<rootDir>/src/__tests__/globalSetup.ts",
    "<rootDir>/src/__tests__/globalTeardown.ts",
    "<rootDir>/src/__tests__/utils.ts",
    "<rootDir>/src/__tests__/mocks.ts",
    // Ignorar temporariamente testes abrangentes/legados e pasta de cobertura (regex válidos)
    "/auth-comprehensive\\.test\\.ts$",
    "/auth-fixed\\.test\\.ts$",
    "<rootDir>/src/__tests__/coverage/.*",
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testTimeout: 10000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  globalSetup: "<rootDir>/src/__tests__/globalSetup.ts",
  globalTeardown: "<rootDir>/src/__tests__/globalTeardown.ts",
  // Threshold de cobertura mínima
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
