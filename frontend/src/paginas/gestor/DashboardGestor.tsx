// /frontend/src/paginas/gestor/DashboardGestor.tsx
// Versão completa - Layout dashboard profissional com dados mockados

import React from 'react';
import { 
  Box, Typography, Paper, Skeleton, Avatar, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon,
  AccountBalance as WalletIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

// Tipos
interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  subtitle: string;
  icon: React.ReactElement;
  isLoading: boolean;
}

// Componente StatCard melhorado
const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, icon, isLoading }) => {
  const trendColor = trend >= 0 ? 'success' : 'error';
  const TrendIcon = trend >= 0 ? TrendingUpIcon : TrendingDownIcon;
  
  return (
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
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {icon}
        </Avatar>
      </Box>
      
      {isLoading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              icon={<TrendIcon style={{ fontSize: 16 }} />}
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              color={trendColor}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

// Mock de dados
const mockData = {
  kpis: {
    faturamento: { value: 'R$ 245.890', trend: 12.5 },
    pedidos: { value: '127', trend: 8.2 },
    ticket: { value: 'R$ 1.936', trend: -3.1 },
    comissoes: { value: 'R$ 24.589', trend: 15.3 }
  },
  evolucao: [
    { mes: 'Jan', valor: 180000 },
    { mes: 'Fev', valor: 195000 },
    { mes: 'Mar', valor: 210000 },
    { mes: 'Abr', valor: 198000 },
    { mes: 'Mai', valor: 230000 },
    { mes: 'Jun', valor: 245890 }
  ],
  topVendedores: [
    { nome: 'Carlos Silva', vendas: 'R$ 89.450', pedidos: 42, avatar: 'CS' },
    { nome: 'Ana Santos', vendas: 'R$ 76.200', pedidos: 38, avatar: 'AS' },
    { nome: 'Pedro Oliveira', vendas: 'R$ 54.320', pedidos: 29, avatar: 'PO' },
    { nome: 'Maria Costa', vendas: 'R$ 25.920', pedidos: 18, avatar: 'MC' }
  ],
  metas: {
    mensal: { atual: 245890, meta: 300000 },
    trimestral: { atual: 673890, meta: 800000 }
  }
};

export const PaginaDashboardGestor: React.FC = () => {
  const isLoading = false;
  const { kpis, evolucao, topVendedores, metas } = mockData;
  
  const metaMensalPercent = (metas.mensal.atual / metas.mensal.meta) * 100;
  const metaTrimestralPercent = (metas.trimestral.atual / metas.trimestral.meta) * 100;
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral do desempenho - Junho 2024
        </Typography>
      </Box>

      {/* KPIs Grid - 4 colunas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <StatCard 
          title="Faturamento Total"
          value={kpis.faturamento.value}
          trend={kpis.faturamento.trend}
          subtitle="vs mês anterior"
          icon={<MoneyIcon />}
          isLoading={isLoading}
        />
        <StatCard 
          title="Total de Pedidos"
          value={kpis.pedidos.value}
          trend={kpis.pedidos.trend}
          subtitle="vs mês anterior"
          icon={<CartIcon />}
          isLoading={isLoading}
        />
        <StatCard 
          title="Ticket Médio"
          value={kpis.ticket.value}
          trend={kpis.ticket.trend}
          subtitle="vs mês anterior"
          icon={<PeopleIcon />}
          isLoading={isLoading}
        />
        <StatCard 
          title="Comissões"
          value={kpis.comissoes.value}
          trend={kpis.comissoes.trend}
          subtitle="vs mês anterior"
          icon={<WalletIcon />}
          isLoading={isLoading}
        />
      </Box>

      {/* Grid Principal - 2 colunas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: 3, 
        mb: 3 
      }}>
        
        {/* Evolução de Vendas */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Evolução de Vendas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Últimos 6 meses
          </Typography>
          
          {isLoading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 280, gap: 1 }}>
              {evolucao.map((item, idx) => {
                const maxValor = Math.max(...evolucao.map(e => e.valor));
                const altura = (item.valor / maxValor) * 100;
                const isCurrent = idx === evolucao.length - 1;
                
                return (
                  <Box key={item.mes} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontWeight={600} color={isCurrent ? 'primary.main' : 'text.primary'}>
                      {(item.valor / 1000).toFixed(0)}k
                    </Typography>
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: `${altura}%`,
                        bgcolor: isCurrent ? 'primary.main' : 'primary.dark',
                        opacity: isCurrent ? 1 : 0.5,
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        '&:hover': { opacity: 1 }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {item.mes}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Progresso de Metas */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Metas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Progresso atual
          </Typography>
          
          {/* Meta Mensal */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Meta Mensal
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight={700}>
                {metaMensalPercent.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={metaMensalPercent} 
              sx={{ 
                height: 8, 
                borderRadius: 1,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 1 }
              }} 
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                R$ {(metas.mensal.atual / 1000).toFixed(0)}k
              </Typography>
              <Typography variant="caption" color="text.secondary">
                R$ {(metas.mensal.meta / 1000).toFixed(0)}k
              </Typography>
            </Box>
          </Box>

          {/* Meta Trimestral */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Meta Trimestral
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={700}>
                {metaTrimestralPercent.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={metaTrimestralPercent} 
              color="success"
              sx={{ 
                height: 8, 
                borderRadius: 1,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { borderRadius: 1 }
              }} 
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                R$ {(metas.trimestral.atual / 1000).toFixed(0)}k
              </Typography>
              <Typography variant="caption" color="text.secondary">
                R$ {(metas.trimestral.meta / 1000).toFixed(0)}k
              </Typography>
            </Box>
          </Box>

          {/* Ícone decorativo */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, mx: 'auto' }}>
              <TrophyIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Continue assim!
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Top Vendedores */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Top Vendedores do Mês
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ranking de desempenho
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Posição</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Vendedor</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Vendas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>Pedidos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topVendedores.map((vendedor, index) => (
                <TableRow key={vendedor.nome} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      color={index === 0 ? 'primary' : 'default'}
                      sx={{ fontWeight: 700, minWidth: 48 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.875rem' }}>
                        {vendedor.avatar}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {vendedor.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {vendedor.vendas}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {vendedor.pedidos}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};