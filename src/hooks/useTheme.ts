import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme, isDark: theme === 'dark', setTheme } },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
      return {
        theme: savedTheme,
        toggleTheme: () => {
          const next = savedTheme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(next);
          localStorage.setItem('theme', next);
        },
        isDark: savedTheme === 'dark',
        setTheme: (next: Theme) => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(next);
          localStorage.setItem('theme', next);
        },
      };
    }
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      isDark: false,
      setTheme: () => {},
    };
  }
  return context;
}