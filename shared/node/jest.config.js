export default {
    testEnvironment: 'node',
    transform: {},
    verbose: true,
    moduleFileExtensions: ['js', 'json'],
    roots: ['<rootDir>/tests'],
    collectCoverageFrom: ['src/models/common/**/*.js'],
    coverageDirectory: 'coverage',
};