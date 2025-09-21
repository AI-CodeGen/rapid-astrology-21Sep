module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['dist/', 'node_modules/'],
  overrides: [
    {
      files: ['**/frontend/src/**/*.{js,jsx}'],
      env: { browser: true, es2022: true },
      plugins: ['react','react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      settings: { react: { version: 'detect' } },
      rules: {
        'react/prop-types': 'off'
      }
    }
  ]
};
