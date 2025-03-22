// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\jest.config.js
module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};