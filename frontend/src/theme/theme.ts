// /frontend/src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

// Estas são as cores do seu protótipo (Stitch)
const cores = {
  azulPrimario: '#4A90E2',     // Cor 'primary' (usada no dashboard)
  fundoEscuro: '#101522',      // Cor 'background-dark'
  fundoCartaoEscuro: '#192033', // Cor 'card-dark' (para Paper/Cards)
  textoEscuro: '#ffffff',       // Cor 'text-dark'
  textoSutilEscuro: '#92a0c9', // Cor 'subtle-dark'
  bordaEscura: '#323f67',       // Cor 'border-dark'
};

// Criamos o tema focando no 'dark mode'
export const theme = createTheme({
  palette: {
    // 1. Define o modo escuro como padrão
    mode: 'dark', 
    
    // 2. Define as cores personalizadas
    primary: {
      main: cores.azulPrimario,
    },
    background: {
      default: cores.fundoEscuro, // Fundo da página
      paper: cores.fundoCartaoEscuro, // Fundo de componentes como Paper, Card, Menu
    },
    text: {
      primary: cores.textoEscuro,
      secondary: cores.textoSutilEscuro,
    },
    divider: cores.bordaEscura, // Cor das bordas/divisórias
  },
  
  // 3. Define a fonte do seu protótipo
  typography: {
    fontFamily: '"Manrope", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800, // 'font-black' (peso 900) ou 800
      letterSpacing: '-0.03em', // 'tracking-[-0.03em]'
    },
    h5: {
      fontWeight: 700, // 'font-bold'
    },
    // (Podemos ajustar mais fontes depois)
  },
  
  // 4. Define o arredondamento (border-radius)
  shape: {
    borderRadius: 8, // (MUI usa 4 por padrão, 8 é mais moderno como no seu prototype "rounded-lg")
  },
});