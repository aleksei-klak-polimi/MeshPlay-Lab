export default {
    testEnvironment: 'node',
    transform: {},
    verbose: true,
    moduleFileExtensions: ['js', 'json'],
    roots: ['<rootDir>/tests'],
    setupFiles: ['dotenv/config'],
    collectCoverageFrom: ['src/utils/**/*.js'],
    coverageDirectory: 'coverage',
};