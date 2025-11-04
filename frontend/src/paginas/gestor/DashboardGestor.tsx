// /frontend/src/paginas/gestor/DashboardGestor.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export const PaginaDashboardGestor: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4">Dashboard do Gestor</Typography>
      <Typography>Bem-vindo ao painel da sua organização.</Typography>
      {/* Os KPIs e gráficos (TanStack Query) virão aqui */}
    </Box>
  );
};