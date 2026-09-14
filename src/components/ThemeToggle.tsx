'use client';

import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        sx={{
          width: 42,
          height: 42,
          color: 'text.primary',
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'surface.high' },
        }}
      >
        {isDark ? <LightModeRounded fontSize="small" /> : <DarkModeRounded fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
