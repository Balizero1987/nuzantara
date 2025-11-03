/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: ["dist/**"],
  rules: {
    "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }]
  }
};
