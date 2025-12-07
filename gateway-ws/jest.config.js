export default {
    testEnvironment: 'node',
    transform: {},
    verbose: true,
    moduleFileExtensions: ['js', 'json'],
    roots: ['<rootDir>/tests'],
    // setupFiles: ['dotenv/config'],
    collectCoverageFrom: ['src/utils/**/*.js', 'src/middleware/**/*.js'],
    coverageDirectory: 'coverage',

    globalSetup: './tests/integration/setup/globalSetup.js',
    globalTeardown: './tests/integration/setup/globalTeardown.js',

    testTimeout: 20000, // Increase for async DB operations
};