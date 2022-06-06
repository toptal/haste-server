/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../',
  testRegex: '\\.test\\.ts$',
  reporters: ['default'],
  roots: [
    "test"
  ],
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1"
  }
}
