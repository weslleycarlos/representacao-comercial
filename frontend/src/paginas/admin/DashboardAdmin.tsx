// /frontend/src/paginas/admin/DashboardAdmin.tsx
// Versão ajustada - UX moderna e layout melhorado

import React from 'react';
import { Box, Paper, Typography, Alert, Skeleton, Avatar } from '@mui/material';
import { 
  Business as BusinessIcon,
  Block as BlockIcon,
  SupervisorAccount as SupervisorIcon,
  Group as GroupIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useGetAdminKpis } from '../../api/servicos/adminService';

// Componente StatCard
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  isLoading: boolean;
  icon: React.ReactElement;
  color?: string;
}> = ({ title, value, isLoading, icon, color = 'error.main' }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 3,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: color,
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }
    }}
  >
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      mb: 2 
    }}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {title}
      </Typography>
      <Avatar sx={{ 
        bgcolor: color, 
        width: 40, 
        height: 40,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.1)' }
      }}>
        {icon}
      </Avatar>
    </Box>
    
    {isLoading ? (
      <Skeleton variant="text" width="70%" height={48} />
    ) : (
      <Typography variant="h4" component="p" fontWeight={700}>
        {value}
      </Typography>
    )}
  </Paper>
);

// Função para formatar R$
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const PaginaAdminDashboard: React.FC = () => {
  const { data, isLoading, isError, error } = useGetAdminKpis();

  if (isError) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Global
        </Typography>
        <Alert severity="error" sx={{ mt: 3 }}>
          Erro ao carregar dados: {(error as any).message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Global
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral do sistema SaaS
        </Typography>
      </Box>

      {/* Grid de KPIs - Organizações */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard 
          title="Organizações Ativas" 
          value={data?.total_organizacoes_ativas ?? 0}
          isLoading={isLoading}
          icon={<BusinessIcon />}
          color="success.main"
        />
        <StatCard 
          title="Organizações Suspensas" 
          value={data?.total_organizacoes_suspensas ?? 0}
          isLoading={isLoading}
          icon={<BlockIcon />}
          color="error.main"
        />
        <StatCard 
          title="Gestores Ativos" 
          value={data?.total_gestores_ativos ?? 0}
          isLoading={isLoading}
          icon={<SupervisorIcon />}
          color="error.main"
        />
        <StatCard 
          title="Vendedores Ativos" 
          value={data?.total_vendedores_ativos ?? 0}
          isLoading={isLoading}
          icon={<GroupIcon />}
          color="error.main"
        />
      </Box>

      {/* Grid de KPIs - Transações */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        <StatCard 
          title="Total de Pedidos (Sistema)" 
          value={data?.total_pedidos_sistema ?? 0}
          isLoading={isLoading}
          icon={<CartIcon />}
          color="error.main"
        />
        <StatCard 
          title="Valor Total Transacionado" 
          value={formatCurrency(data?.valor_total_pedidos_sistema ?? 0)}
          isLoading={isLoading}
          icon={<MoneyIcon />}
          color="error.main"
        />
      </Box>
    </Box>
  );
};