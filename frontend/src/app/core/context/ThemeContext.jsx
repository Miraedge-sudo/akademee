import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

/**
 * Convert a hex color like "#085041" to its RGB components "8,80,65".
 */
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#085041');
  return r
    ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`
    : '8,80,65';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('akademee-theme') || 'light';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('akademee-primary-color') || '#085041';
  });

  const [primaryRgb, setPrimaryRgb] = useState(() => {
    return hexToRgb(primaryColor);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('akademee-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(primaryColor);
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-rgb', rgb);
    setPrimaryRgb(rgb);
    localStorage.setItem('akademee-primary-color', primaryColor);
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, primaryRgb, updatePrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}