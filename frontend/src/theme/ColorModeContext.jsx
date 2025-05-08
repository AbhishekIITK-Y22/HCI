import React, { createContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import baseTheme from './Theme';

export const ColorModeContext = createContext();

export default function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState('light');

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    const newTheme = createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode,
        ...(mode === 'light'
          ? {
              background: {
                default: '#f0f2f5',
                paper: '#ffffff',
              },
              text: {
                primary: '#212121',
                secondary: '#555555',
              },
            }
          : {
              background: {
                default: '#121212',
                paper: '#1e1e1e',
              },
              text: {
                primary: '#ffffff',
                secondary: '#cccccc',
              },
            }),
      },
      components: {
        ...baseTheme.components,
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: mode === 'light' ? '#f0f2f5' : '#121212',
              minHeight: '100vh',
              margin: 0,
              padding: 0,
            },
          },
        },
      },
    });
    return newTheme;
  }, [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
