'use client';

import { createTheme } from '@mui/material/styles';

// Material 3 tones seeded from a cool sea-fog teal. Depth comes from these surface
// tones rather than shadows.
interface SurfaceTones {
  low: string;
  main: string;
  high: string;
  highest: string;
}

interface ToneColor {
  main: string;
  contrastText: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    surface: SurfaceTones;
    tonal: ToneColor;
    danger: ToneColor;
  }
  interface PaletteOptions {
    surface?: SurfaceTones;
    tonal?: ToneColor;
    danger?: ToneColor;
  }
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#EF6A5B', contrastText: '#FFFFFF' },
        secondary: { main: '#6E5AD8', contrastText: '#FFFFFF' },
        error: { main: '#BA1A1A', contrastText: '#FFFFFF' },
        success: { main: '#2E8B67' },
        warning: { main: '#A56800' },
        background: { default: '#F3EFE6', paper: '#FFFCF5' },
        text: { primary: '#18171B', secondary: '#6A6260' },
        divider: '#D6CEC2',
        surface: { low: '#EBE5D9', main: '#E5DED1', high: '#DDD5C7', highest: '#D4CABB' },
        tonal: { main: '#D6ECE5', contrastText: '#173A35' },
        danger: { main: '#C5221F', contrastText: '#FFFFFF' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#FF8B78', contrastText: '#28100C' },
        secondary: { main: '#BBA8FF', contrastText: '#241B4F' },
        error: { main: '#FFB4AB', contrastText: '#690005' },
        success: { main: '#7FD8B0' },
        warning: { main: '#F6C453' },
        background: { default: '#121113', paper: '#1C1A1E' },
        text: { primary: '#F4EFEA', secondary: '#BDB5B4' },
        divider: '#403A40',
        surface: { low: '#1C1A1E', main: '#242126', high: '#2D2930', highest: '#38323B' },
        tonal: { main: '#29433F', contrastText: '#D6ECE5' },
        danger: { main: '#DC362E', contrastText: '#FFFFFF' },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Google Sans Flex Variable", "Google Sans", Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': {
            outline: `2px solid ${(theme.vars ?? theme).palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
        sizeLarge: { minHeight: 52, fontSize: '1rem' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 28, backgroundImage: 'none' } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          const palette = (theme.vars ?? theme).palette;
          // Keep informational alerts in the Callfog palette instead of MUI's default blue.
          const tonalInfo = ownerState.variant !== 'filled' && ownerState.variant !== 'outlined' && ownerState.severity === 'info';
          return {
            borderRadius: 12,
            ...(tonalInfo && {
              backgroundColor: palette.tonal.main,
              color: palette.tonal.contrastText,
              '& .MuiAlert-icon': { color: palette.primary.main },
            }),
          };
        },
      },
    },
    MuiTooltip: {
      defaultProps: { enterDelay: 400 },
    },
  },
});
