// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\jest.config.js
module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/jest.mock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/jest.mock.js',
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};