module.exports = {
  extends: 'airbnb-base',
  parserOptions: {
    sourceType: 'script', // https://github.com/eslint/eslint/issues/5301
  },
  rules: {
    'max-len': ['error',
      {
        code: 200,
        tabWidth: 2,
      },
    ],
  },
};
