import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat';
import prettierConfig from 'eslint-config-prettier';
import reactNative from 'eslint-plugin-react-native';

export default defineConfig([
  globalIgnores(['dist/*', 'ios/*', 'android/*', '.expo/*', 'coverage/*']),
  expoConfig,
  prettierConfig,
  {
    plugins: { 'react-native': reactNative },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-redux',
              importNames: ['useDispatch', 'useSelector'],
              message: 'Use useAppDispatch / useAppSelector from @/store/hooks.',
            },
          ],
          patterns: [
            {
              group: ['@/design-system/*'],
              message: 'Import the design system from @/design-system only.',
            },
            {
              group: ['react-native-foundation-models', '@react-native-ai/apple'],
              message:
                'Only src/services/ai/foundationModels.ts may import the on-device model library.',
            },
          ],
        },
      ],
    },
  },
  {
    // The design system and the AI adapter are the only places allowed to reach their internals.
    files: ['src/design-system/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Raw color values live only in the palette.
    files: ['src/design-system/tokens/**'],
    rules: { 'react-native/no-color-literals': 'off' },
  },
  {
    files: ['src/services/ai/foundationModels.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
]);
