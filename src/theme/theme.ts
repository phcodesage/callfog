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
        primary: { main: '#2F6A73', contrastText: '#FFFFFF' },
        secondary: { main: '#6B5B7B', contrastText: '#FFFFFF' },
        error: { main: '#BA1A1A', contrastText: '#FFFFFF' },
        success: { main: '#2E7D4F' },
        warning: { main: '#8A5A00' },
        background: { default: '#F6F9FA', paper: '#FFFFFF' },
        text: { primary: '#171D1E', secondary: '#3F484A' },
        divider: '#BFC8CA',
        surface: { low: '#F0F4F5', main: '#E9EFF1', high: '#E3E9EB', highest: '#DDE4E5' },
        tonal: { main: '#CDE7EC', contrastText: '#051F23' },
        danger: { main: '#C5221F', contrastText: '#FFFFFF' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#8FD0DA', contrastText: '#00363D' },
        secondary: { main: '#D6BEE4', contrastText: '#3B2948' },
        error: { main: '#FFB4AB', contrastText: '#690005' },
        success: { main: '#7DD9A0' },
        warning: { main: '#F4BE5C' },
        background: { default: '#0F1415', paper: '#171D1E' },
        text: { primary: '#DEE3E5', secondary: '#BFC8CA' },
        divider: '#3F484A',
        surface: { low: '#171D1E', main: '#1B2122', high: '#252B2C', highest: '#303637' },
        tonal: { main: '#334B4F', contrastText: '#CDE7EC' },
        danger: { main: '#DC362E', contrastText: '#FFFFFF' },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'var(--font-roboto-flex), Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
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
