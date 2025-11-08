module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\.[tj]sx?$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Resolve imports that use a .js extension back to the TypeScript source files.
  // Example: import { x } from '../../services/foo.js' -> resolves to ../../services/foo(.ts)
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  // If your project uses ESM semantics for TS modules, treat .ts as ESM for Jest.
  // Remove or adjust if your codebase is CJS.
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 20000,
};
