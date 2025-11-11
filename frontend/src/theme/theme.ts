// /frontend/src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const cores = {
  azulPrimario: '#4A90E2',
  azulClaro: '#63A4FF',
  azulEscuro: '#2D5FA4',
  fundoClaro: '#F8FAFC',
  fundoCartaoClaro: '#FFFFFF',
  textoPrimario: '#1A1F2C',
  textoSecundario: '#5F6C87',
  bordaClara: '#E2E8F0',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: cores.azulPrimario,
      light: cores.azulClaro,
      dark: cores.azulEscuro,
    },
    background: {
      default: cores.fundoClaro,
      paper: cores.fundoCartaoClaro,
    },
    text: {
      primary: cores.textoPrimario,
      secondary: cores.textoSecundario,
    },
    divider: cores.bordaClara,
  },
  typography: {
    fontFamily: '"Manrope", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 700,
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});
