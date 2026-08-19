import { createContext, useCallback, useContext, useState } from 'react';
import { THEME_STORAGE_KEY } from '../constants';

const ThemeContext = createContext(null);

const readStoredTheme = () => {
  // index.html already resolved and applied the theme before first paint, so
  // reading it back from the DOM keeps the two in sync with no flash.
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  const applyTheme = useCallback((next) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing: the theme simply will not persist.
    }
  }, []);

  const toggleTheme = useCallback(
    () => applyTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, applyTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
};
