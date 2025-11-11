// /frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App.tsx';
import { theme } from './theme/theme.ts'; // Importa nosso tema
import { AuthProvider } from './contextos/AuthContext';

// 1. Cria a instância do Cliente de Cache (TanStack Query)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações padrão: não tenta buscar dados 3x se falhar (padrão)
      retry: 1, 
      // Não busca dados automaticamente quando a janela ganha foco (opcional)
      refetchOnWindowFocus: false, 
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CssBaseline />
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);