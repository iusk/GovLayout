import { createTheme } from '@mui/material/styles';

// U.S. flag blue + red, used sparingly against a neutral dark background.
// Dark mode only (per requirements).
export const flagBlue = '#3C3B6E';
export const flagRed = '#B22234';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: flagBlue, contrastText: '#FFFFFF' },
    secondary: { main: flagRed, contrastText: '#FFFFFF' },
    background: {
      default: '#0E0E12',
      paper: '#16161D',
    },
    text: {
      primary: '#E6E6EC',
      secondary: '#A8A8B3',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, Segoe UI, sans-serif',
    h1: { fontWeight: 500 },
    h2: { fontWeight: 500 },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
  },
});
