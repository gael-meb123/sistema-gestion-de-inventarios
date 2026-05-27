module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['tests*.js', '**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
