import pluginVue from 'eslint-plugin-vue';
import checkFile from 'eslint-plugin-check-file';
import prettier from 'eslint-config-prettier';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
  { ignores: ['dist', 'node_modules'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    plugins: { 'check-file': checkFile },
    rules: {
      'func-style': ['error', 'expression'],
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.vue': 'PASCAL_CASE', 'src/**/*.{ts,js}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
  prettier, // por último: desliga regras de estilo que conflitam com o Prettier
);
