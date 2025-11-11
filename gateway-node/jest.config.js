export default {
    testEnvironment: 'node',
    transform: {},
    verbose: true,
    moduleFileExtensions: ['js', 'json'],
    roots: ['<rootDir>/tests'],
    setupFiles: ['dotenv/config'],
    collectCoverageFrom: ['src/utils/**/*.js', 'src/middleware/**/*.js', 'src/models/common/**/*.js'],
    coverageDirectory: 'coverage',

    testTimeout: 20000, // Increase for async DB operations
};