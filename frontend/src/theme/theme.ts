// /frontend/src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

// Cores base (você pode substituir por um sistema de cor baseado em Material You no futuro)
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

// Tema baseado em Material Design 3
export const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: cores.azulPrimario,
          light: cores.azulClaro,
          dark: cores.azulEscuro,
          contrastText: '#fff',
        },
        secondary: {
          main: '#5F6C87',
          light: '#8A96A9',
          dark: '#354256',
          contrastText: '#fff',
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
    },
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
    // Adicionando tipografia do Material Design 3
    h1: {
      fontSize: '6rem',
      fontWeight: 300,
      lineHeight: 1.167,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '3.75rem',
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '3rem',
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
  },
  shape: {
    borderRadius: 12, // MD3 usa bordas mais arredondadas
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10, // Ajuste de borda para MD3
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)', // Sombras mais fortes no MD3
          borderRadius: 16, // Bordas mais arredondadas
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});