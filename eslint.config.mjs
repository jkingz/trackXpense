import nextConfig from 'eslint-config-next/core-web-vitals';
import nextTsConfig from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = [
  ...nextConfig,
  ...nextTsConfig,
  {
    // `.delta/` holds git-excluded worktree/clone copies of this repo.
    // `next lint` never reached them; `eslint .` does, so they are ignored here.
    ignores: ['.delta/**', 'next-env.d.ts'],
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
          ],
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];

export default eslintConfig;
