import config from '@unix/eslint'

export default [
  {
    ignores: [
      '**/.astro/**',
      '**/.wrangler/**',
      '**/dist/**',
      '**/migrations/**',
      '**/*.astro',
      '**/*.sql',
      'prettier.config.cjs',
      'self-host.ts',
    ],
  },
  ...config,
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [
            -4, -1, 0, 1, 2, 4, 5, 6, 10, 20, 34, 60, 64, 80, 100, 300, 400, 429,
            501, 900, 1024, 1500, 1800, 3600, 4001, 86400,
          ],
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
  {
    files: [
      'src/scrapers/**/*.{ts,tsx}',
      'src/services/api-gateway/**/*.{ts,tsx}',
      'src/islands/api/**/*.{ts,tsx}',
      'src/components/api-nav.tsx',
      'src/pages/api/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/max-params': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'func-style': 'off',
      'no-useless-assignment': 'off',
      '@unix/function-blank-lines': 'off',
      '@unix/compact-return-if': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
]
