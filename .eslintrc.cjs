module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'airbnb-base',
    'airbnb-typescript/base',
    'eslint-config-prettier',
  ],
  ignorePatterns: ['dist', '*.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'prettier/prettier': 'error',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        '': 'never',
        js: 'never',
        ts: 'never',
        mjs: 'never',
      },
    ],
  },
};
