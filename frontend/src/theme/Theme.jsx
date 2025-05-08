// src/theme.js
import { createTheme } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#1F4E3D',
      light: '#4B796A',
      dark: '#153B2D',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#212121',
    },
    background: {
      default: '#F7F9FA',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#555555',
    },
    action: {
      hover: 'rgba(31, 78, 61, 0.04)',
      selected: 'rgba(31, 78, 61, 0.08)',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'sans-serif'].join(','),
    h4: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F7F9FA',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
});

export default baseTheme;
