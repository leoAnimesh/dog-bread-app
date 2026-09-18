import React, { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { buildTheme, type ColorSchemeName, type Theme } from './tokens';

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  /** Force a scheme (used by tests and screenshots); defaults to the OS setting. */
  scheme?: ColorSchemeName;
}

export function ThemeProvider({ scheme, children }: PropsWithChildren<ThemeProviderProps>) {
  const systemScheme = useColorScheme();
  const resolved: ColorSchemeName = scheme ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(resolved), [resolved]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return theme;
}
