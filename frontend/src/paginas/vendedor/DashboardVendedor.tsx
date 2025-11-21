// /frontend/src/paginas/vendedor/DashboardVendedor.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Alert, 
  Button,
  Stack,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useGetVendedorKpis } from '../../api/servicos/dashboardService';
import { StatCard } from '../../componentes/dashboard/StatCard';
import { formatCurrency, formatInteger } from '../../utils/format';
import { useAuth } from '../../contextos/AuthContext';

export const PaginaVendedorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { data: kpis, isLoading, isError, error } = useGetVendedorKpis();

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Erro ao carregar KPIs: {(error as any)?.message || 'Erro desconhecido'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* HEADER */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom={!isMobile}>
            Olá, {usuario?.no_completo?.split(' ')[0] || 'Vendedor'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aqui está o resumo do seu desempenho neste mês.
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          startIcon={<ViewIcon />}
          onClick={() => navigate('/vendedor/pedidos')}
          size={isMobile ? "medium" : "large"}
          fullWidth={isMobile}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '100%', sm: '200px' }
          }}
        >
          Ver Pedidos
        </Button>
      </Box>

      {/* KPIs GRID */}
      <Grid container spacing={2}> {/* Reduced spacing for better mobile */}
        {/* Vendas Totais */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Minhas Vendas (Mês)" 
            value={formatCurrency(kpis?.vendas_mes_atual)}
            isLoading={isLoading}
            subtitle="Valor total vendido"
            color="primary"
          />
        </Grid>
        
        {/* Comissões */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Minhas Comissões" 
            value={formatCurrency(kpis?.comissao_mes_atual)}
            isLoading={isLoading}
            subtitle="Total a receber"
            color="success"
          />
        </Grid>

        {/* Quantidade de Pedidos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Pedidos Realizados" 
            value={formatInteger(kpis?.pedidos_mes_atual)}
            isLoading={isLoading}
            subtitle="Qtd. este mês"
            color="info"
          />
        </Grid>

        {/* Ticket Médio */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Ticket Médio" 
            value={formatCurrency(kpis?.ticket_medio_mes_atual)}
            isLoading={isLoading}
            subtitle="Valor por pedido"
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* ESPAÇO PARA FUTURAS MELHORIAS */}
      <Box sx={{ mt: 4 }}>
        <Typography 
          variant="h6" 
          fontWeight="medium" 
          color="text.secondary"
          textAlign="center"
        >
          🚀 Mais análises em breve...
        </Typography>
        {/* Futuro: Gráfico de metas, ranking de produtos, etc. */}
      </Box>
    </Box>
  );
};