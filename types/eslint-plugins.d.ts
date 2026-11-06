// These ESLint packages ship without type declarations.
declare module 'eslint-config-expo/flat' {
  import type { Linter } from 'eslint';
  const config: Linter.Config[];
  export default config;
}

declare module 'eslint-plugin-react-native' {
  import type { ESLint } from 'eslint';
  const plugin: ESLint.Plugin;
  export default plugin;
}
