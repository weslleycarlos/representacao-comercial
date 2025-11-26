// /frontend/src/paginas/gestor/DashboardGestor.tsx
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon,
  AccountBalance as WalletIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useGetGestorKpis, useGetRankingVendedores } from '../../api/servicos/dashboardService';
import { formatCurrency } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  subtitle: string;
  icon: React.ReactElement;
  isLoading: boolean;
}

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
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'primary.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { color: 'primary' })}
        </Box>
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
              sx={{ fontWeight: 600, height: 24 }}
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

export const PaginaDashboardGestor: React.FC = () => {
  const { data: kpis, isLoading: loadingKpis } = useGetGestorKpis();
  const { data: ranking, isLoading: loadingRanking } = useGetRankingVendedores();

  // Trends mockadas
  const mockTrends = useMemo(
    () => ({
      faturamento: 12.5,
      pedidos: 8.2,
      ticket: -3.1,
      comissoes: 15.3,
    }),
    []
  );

  // Evolução de vendas (mockado)
  const evolucaoMock = useMemo(
    () => [
      { mes: 'Jan', valor: 180000 },
      { mes: 'Fev', valor: 195000 },
      { mes: 'Mar', valor: 210000 },
      { mes: 'Abr', valor: 198000 },
      { mes: 'Mai', valor: 230000 },
      { mes: 'Jun', valor: Number(kpis?.vendas_mes_atual || 245000) },
    ],
    [kpis?.vendas_mes_atual]
  );

  const metasMock = useMemo(
    () => ({
      mensal: { atual: Number(kpis?.vendas_mes_atual || 0), meta: 300000 },
      trimestral: { atual: 673890, meta: 800000 },
    }),
    [kpis?.vendas_mes_atual]
  );

  const metaMensalPercent = Math.min((metasMock.mensal.atual / metasMock.mensal.meta) * 100, 100);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visão geral do desempenho
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Faturamento Total"
            value={formatCurrency(kpis?.vendas_mes_atual)}
            trend={mockTrends.faturamento}
            subtitle="vs mês anterior"
            icon={<MoneyIcon />}
            isLoading={loadingKpis}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total de Pedidos"
            value={kpis?.pedidos_mes_atual?.toString() || '0'}
            trend={mockTrends.pedidos}
            subtitle="vs mês anterior"
            icon={<CartIcon />}
            isLoading={loadingKpis}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(kpis?.ticket_medio_mes_atual)}
            trend={mockTrends.ticket}
            subtitle="vs mês anterior"
            icon={<PeopleIcon />}
            isLoading={loadingKpis}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Comissões (Est.)"
            value={formatCurrency(kpis?.comissoes_pendentes_mes_atual)}
            trend={mockTrends.comissoes}
            subtitle="vs mês anterior"
            icon={<WalletIcon />}
            isLoading={loadingKpis}
          />
        </Grid>
      </Grid>

      {/* Gráfico e Metas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Evolução de Vendas */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Evolução de Vendas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Últimos 6 meses (Simulado)
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                height: 280,
                gap: 1,
              }}
            >
              {evolucaoMock.map((item, idx) => {
                const maxValor = Math.max(...evolucaoMock.map((e) => e.valor));
                const altura = (item.valor / maxValor) * 100;
                const isCurrent = idx === evolucaoMock.length - 1;

                return (
                  <Box
                    key={item.mes}
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Tooltip title={formatCurrency(item.valor)} arrow>
                      <Box
                        sx={{
                          width: '100%',
                          height: `${altura}%`,
                          bgcolor: isCurrent ? 'primary.main' : 'primary.light',
                          opacity: isCurrent ? 1 : 0.5,
                          borderRadius: '6px 6px 0 0',
                          transition: 'all 0.3s ease-in-out',
                          cursor: 'pointer',
                          '&:hover': { opacity: 1, transform: 'scaleY(1.02)' },
                        }}
                      />
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {item.mes}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Metas */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Metas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Progresso atual (Simulado)
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
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
              >
                {formatCurrency(metasMock.mensal.atual)} / {formatCurrency(metasMock.mensal.meta)}
              </Typography>
            </Box>

            {/* Ícone decorativo */}
            <Box sx={{ textAlign: 'center', mt: 'auto' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: 'warning.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Sua equipe está em {ranking && ranking.length > 0 ? 'bom' : 'início de'} ritmo!
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Ranking de Vendedores */}
      <Paper
        elevation={0}
        sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Ranking de Vendedores
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Baseado nas vendas aprovadas deste mês
        </Typography>

        {loadingRanking ? (
          <LinearProgress sx={{ borderRadius: 1 }} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={100}>Posição</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Vendas</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ranking?.map((vendedor, index) => (
                  <TableRow key={vendedor.id_usuario} hover>
                    <TableCell>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        color={index === 0 ? 'primary' : 'default'}
                        sx={{ fontWeight: 700, minWidth: 48 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.875rem', bgcolor: 'primary.light' }}>
                          {vendedor.no_vendedor?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {vendedor.no_vendedor}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {formatCurrency(vendedor.vl_total_vendas)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {vendedor.qt_pedidos}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {!ranking?.length && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma venda registrada neste mês.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};