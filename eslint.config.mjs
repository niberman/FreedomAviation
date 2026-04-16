import nextPlugin from 'eslint-config-next';

const config = [
  ...nextPlugin,
  {
    ignores: [
      '.next/**',
      '.vercel/**',
      '.claude/**',
      '.cursor/**',
      'dist/**',
      'node_modules/**',
      'scripts/**',
      'supabase/.temp/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
];

export default config;
