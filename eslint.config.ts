import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat';
import prettierConfig from 'eslint-config-prettier';
import reactNative from 'eslint-plugin-react-native';

const FEATURES = ['applications', 'capabilities', 'inbox', 'intake', 'prep', 'settings'];

/**
 * Builds the `no-restricted-imports` options. Each override replaces the whole rule config,
 * so every variant repeats the shared entries and only changes which feature paths are allowed.
 * `@/features/applications/model` is a public entry point (see its barrel comment).
 * `allowedFeaturePaths` is a regex alternation of paths under `@/features/` that are allowed.
 */
function restrictedImports(allowedFeaturePaths: string): Linter.RuleEntry {
  return [
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
          group: ['@react-native-ai/apple'],
          message:
            'Only src/services/ai/foundationModels.ios.ts may import the on-device model library.',
        },
        {
          regex: `^@/features/(?!(?:applications/model|${allowedFeaturePaths})$)[^/]+/`,
          message: 'Import other features through their index (@/features/<name>).',
        },
      ],
    },
  ];
}

// A path that never matches, for code that may not reach into any feature.
const NO_FEATURE_PATHS = '(?!)';

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
      'no-restricted-imports': restrictedImports(NO_FEATURE_PATHS),
    },
  },
  // A feature may reach into its own internals; other features go through their index.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**`],
    rules: { 'no-restricted-imports': restrictedImports(`${feature}/.+`) },
  })),
  {
    // The store imports slice files directly: barrels pull in screens, which import the store.
    // `prep/autoPrep` registers the store's listeners and imports no screens.
    files: ['src/store/**'],
    rules: {
      'no-restricted-imports': restrictedImports('[^/]+/slice|intake/draftsSlice|prep/autoPrep'),
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
    files: ['src/services/ai/foundationModels.ios.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
]);
