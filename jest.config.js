module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/__test__/**/*.test.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/*'],
};
