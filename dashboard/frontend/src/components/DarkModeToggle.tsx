import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeContext } from '../context/ThemeContext';

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();

  return (
    <Tooltip title={darkMode ? 'switch to light mode' : 'switch to dark mode'} placement="right">
      <Fab
        size="small"
        onClick={toggleDarkMode}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
        }}
        color="primary"
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </Fab>
    </Tooltip>
  );
};

export default DarkModeToggle;
