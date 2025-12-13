// Shared ESLint config for Vlossom packages
// Usage: extends: ["@vlossom/config/eslint"]

module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: ["node_modules/", "dist/", ".turbo/"],
};
