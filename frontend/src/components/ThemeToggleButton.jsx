// src/components/ThemeToggleButton.jsx
import React, { useContext } from 'react';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../theme/ColorModeContext';

const ThemeToggleButton = () => {
  const theme = useTheme(); // Access current theme mode
  const { toggleColorMode } = useContext(ColorModeContext);

  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label="toggle theme"
        aria-pressed={isDarkMode}
        sx={{
          transition: 'color 0.3s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        {isDarkMode ? (
          <LightModeIcon sx={{ color: theme.palette.text.primary }} />
        ) : (
          <DarkModeIcon sx={{ color: theme.palette.text.secondary }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
