import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'strip-shebang',
      transform(code, id) {
        if (code.startsWith('#!')) {
          return {
            code: code.replace(/^#![^\r\n]+/, ''),
            map: null,
          };
        }
      },
    },
  ],
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'src/scenes/webui-verification.test.tsx'],
  },
});
