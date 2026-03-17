module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.app.json", "./tsconfig.node.json", "./tsconfig.test.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/prefer-promise-reject-errors": "off",
  },
  ignorePatterns: ["coverage", "dist"],
  overrides: [
    {
      files: ["src/components/ui/**/*.tsx"],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
  ],
};