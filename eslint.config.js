import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";

export default [
  // ── Ignored paths ──────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "server/tests/**/*.snap",
      "coverage/**",
    ],
  },

  // ── Base JS rules (all files) ──────────────────────────────────────────────
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
  },

  // ── Server (Node.js ESM) ──────────────────────────────────────────────────
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "no-throw-literal": "error",
    },
  },

  // ── Client (React / Browser ESM) ──────────────────────────────────────────
  {
    files: ["client/src/**/*.{js,jsx}"],
    plugins: { react: reactPlugin },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "react/jsx-uses-vars": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // ── Test files ─────────────────────────────────────────────────────────────
  {
    files: ["server/tests/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },

  // ── Config / tooling files ─────────────────────────────────────────────────
  {
    files: ["*.config.js", "eslint.config.js", "vite.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
