module.exports = [
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.ts"],
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
  require("eslint-config-love"),
  require("eslint-plugin-prettier/recommended"),
  {
    rules: {
      "@typescript-eslint/class-methods-use-this": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
