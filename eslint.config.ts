import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { js },
    extends: ["eslint:recommended"],
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  ...tseslint.configs.recommended,

  {
    ...pluginReact.configs.flat.recommended,
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
]);