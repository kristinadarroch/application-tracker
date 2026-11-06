import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';

import { ThemeProvider } from '@/design-system';
import { makeStore, type RootState, type TestStore } from '@/store/store';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: TestStore;
}

/** Renders with a fresh, unpersisted store and the light theme. Returns the store for assertions. */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { preloadedState, store = makeStore(preloadedState), ...renderOptions } = options;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider preference="light">{children}</ThemeProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
