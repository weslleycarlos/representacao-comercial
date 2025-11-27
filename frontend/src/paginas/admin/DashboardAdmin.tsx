// /frontend/src/paginas/admin/DashboardAdmin.tsx
import React from 'react';
import { Box, Paper, Typography, Alert, Skeleton, Avatar, Divider } from '@mui/material';
import { 
  Business as BusinessIcon,
  Block as BlockIcon,
  SupervisorAccount as SupervisorIcon,
  Group as GroupIcon,
  ShoppingCart as CartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useGetAdminKpis } from '../../api/servicos/adminService';

// Componente StatCard Melhorado
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  isLoading: boolean;
  icon: React.ReactElement;
  color?: string;
  subtitle?: string;
  trend?: { value: number; label: string };
}> = ({ title, value, isLoading, icon, color = 'error.main', subtitle, trend }) => (
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
      <>
        <Skeleton variant="text" width="70%" height={48} />
        {subtitle && <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />}
      </>
    ) : (
      <>
        <Typography variant="h4" component="p" fontWeight={700} sx={{ mb: subtitle || trend ? 1 : 0 }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
            {trend.value >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend.value >= 0 ? 'success.main' : 'error.main',
                fontWeight: 600
              }}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </Typography>
          </Box>
        )}
      </>
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

// Função para formatar números grandes
const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
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
          Erro ao carregar dados: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      </Box>
    );
  }

  // Cálculo do ticket médio
  const ticketMedio = data?.total_pedidos_sistema && data.total_pedidos_sistema > 0
    ? data.valor_total_pedidos_sistema / data.total_pedidos_sistema
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard Global
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral consolidada do sistema SaaS
        </Typography>
      </Box>

      {/* Seção: Organizações */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        📊 Organizações
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          lg: 'repeat(4, 1fr)' 
        }, 
        gap: 3, 
        mb: 4 
      }}>
        <StatCard 
          title="Organizações Ativas" 
          value={data?.total_organizacoes_ativas ?? 0}
          isLoading={isLoading}
          icon={<BusinessIcon />}
          color="success.main"
          subtitle="Em operação"
        />
        <StatCard 
          title="Organizações Suspensas" 
          value={data?.total_organizacoes_suspensas ?? 0}
          isLoading={isLoading}
          icon={<BlockIcon />}
          color="error.main"
          subtitle="Requer atenção"
        />
        <StatCard 
          title="Gestores Ativos" 
          value={data?.total_gestores_ativos ?? 0}
          isLoading={isLoading}
          icon={<SupervisorIcon />}
          color="primary.main"
          subtitle="Administradores"
        />
        <StatCard 
          title="Vendedores Ativos" 
          value={data?.total_vendedores_ativos ?? 0}
          isLoading={isLoading}
          icon={<GroupIcon />}
          color="info.main"
          subtitle="Força de vendas"
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Seção: Transações */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        💰 Transações
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: 3 
      }}>
        <StatCard 
          title="Total de Pedidos" 
          value={formatNumber(data?.total_pedidos_sistema ?? 0)}
          isLoading={isLoading}
          icon={<CartIcon />}
          color="warning.main"
          subtitle="Pedidos registrados"
        />
        <StatCard 
          title="Valor Total Transacionado" 
          value={formatCurrency(data?.valor_total_pedidos_sistema ?? 0)}
          isLoading={isLoading}
          icon={<MoneyIcon />}
          color="success.dark"
          subtitle="Volume financeiro"
        />
        <StatCard 
          title="Ticket Médio" 
          value={formatCurrency(ticketMedio)}
          isLoading={isLoading}
          icon={<TrendingUpIcon />}
          color="info.dark"
          subtitle="Por pedido"
        />
      </Box>

      {/* Card de Resumo Adicional */}
      {!isLoading && data && (
        <Paper 
          elevation={0}
          sx={{ 
            mt: 4, 
            p: 3, 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            📈 Resumo do Sistema
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Taxa de Organizações Ativas
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {data.total_organizacoes_ativas + data.total_organizacoes_suspensas > 0
                  ? Math.round((data.total_organizacoes_ativas / (data.total_organizacoes_ativas + data.total_organizacoes_suspensas)) * 100)
                  : 0}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Média de Usuários por Org
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {data.total_organizacoes_ativas > 0
                  ? Math.round((data.total_gestores_ativos + data.total_vendedores_ativos) / data.total_organizacoes_ativas)
                  : 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total de Usuários
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {data.total_gestores_ativos + data.total_vendedores_ativos}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};