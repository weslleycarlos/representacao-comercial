// /frontend/src/paginas/gestor/DashboardGestor.tsx
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  LinearProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon,
  AccountBalance as WalletIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useGetGestorKpis, useGetRankingVendedores } from '../../api/servicos/dashboardService';
import { useRelatorioVendasEmpresa, useEvolucaoVendasMensal } from '../../api/servicos/relatorioService';
import { formatCurrency } from '../../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';

interface StatCardProps {
  title: string;
  value: string;
  trend: number | null; // null significa "sem comparação (novo)"
  subtitle: string;
  icon: React.ReactElement;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, icon, isLoading }) => {
  const TrendIcon = trend == null ? InfoIcon : trend >= 0 ? TrendingUpIcon : TrendingDownIcon;

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
            <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
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
            {trend == null ? (
              <Chip
                icon={<TrendIcon style={{ fontSize: 16 }} />}
                label={`Novo`}
                color="default"
                size="small"
                sx={{ fontWeight: 600, height: 24 }}
              />
            ) : (
              <Chip
                icon={<TrendIcon style={{ fontSize: 16 }} />}
                label={`${trend > 0 ? '+' : ''}${trend.toFixed(0)}%`}
                color={trend >= 0 ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 600, height: 24 }}
              />
            )}
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
  const { data: evolucaoVendas } = useEvolucaoVendasMensal();

  // Trends: calcular comparando com mês anterior usando relatórios
  const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

  const pad = (n: number) => String(n).padStart(2, '0');

  const today = new Date();
  // Format dates using local components (avoid toISOString timezone shifts)
  const startCurrentDate = firstDayOfMonth(today);
  const endCurrentDate = lastDayOfMonth(today);
  const startCurrent = `${startCurrentDate.getFullYear()}-${pad(startCurrentDate.getMonth() + 1)}-${pad(startCurrentDate.getDate())}`;
  const endCurrent = `${endCurrentDate.getFullYear()}-${pad(endCurrentDate.getMonth() + 1)}-${pad(endCurrentDate.getDate())}`;

  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const startPrevDate = firstDayOfMonth(prevMonthDate);
  const endPrevDate = lastDayOfMonth(prevMonthDate);
  const startPrev = `${startPrevDate.getFullYear()}-${pad(startPrevDate.getMonth() + 1)}-${pad(startPrevDate.getDate())}`;
  const endPrev = `${endPrevDate.getFullYear()}-${pad(endPrevDate.getMonth() + 1)}-${pad(endPrevDate.getDate())}`;

  // Busca vendas por empresa para o mês atual e mês anterior (somaremos para obter totals)
  const { data: vendasEmpresaCurrent } = useRelatorioVendasEmpresa(startCurrent, endCurrent);
  const { data: vendasEmpresaPrev } = useRelatorioVendasEmpresa(startPrev, endPrev);

  type VRow = { vl_total_vendas?: number; qt_pedidos?: number };
  const sumVendas = (rows?: VRow[]) => (rows || []).reduce((s, r) => s + Number(r?.vl_total_vendas || 0), 0);
  const sumPedidos = (rows?: VRow[]) => (rows || []).reduce((s, r) => s + Number(r?.qt_pedidos || 0), 0);

  const vendasCurrentTotal = sumVendas(vendasEmpresaCurrent);
  const vendasPrevTotal = sumVendas(vendasEmpresaPrev);
  const pedidosCurrentTotal = sumPedidos(vendasEmpresaCurrent);
  const pedidosPrevTotal = sumPedidos(vendasEmpresaPrev);

  const calcPercentChange = (current: number, previous: number): number | null => {
    if (previous === 0) {
      if (current === 0) return 0;
      return null; // sem comparação válida (novo)
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const mockTrends = useMemo(() => ({
    faturamento: calcPercentChange(vendasCurrentTotal, vendasPrevTotal),
    pedidos: calcPercentChange(pedidosCurrentTotal, pedidosPrevTotal),
    ticket: (() => {
      const ticketCurrent = pedidosCurrentTotal > 0 ? vendasCurrentTotal / pedidosCurrentTotal : 0;
      const ticketPrev = pedidosPrevTotal > 0 ? vendasPrevTotal / pedidosPrevTotal : 0;
      return calcPercentChange(ticketCurrent, ticketPrev);
    })(),
    comissoes: 0, // Se quiser comissões, precisamos somar a view de comissões por mês (poderia usar useRelatorioComissoes)
  }), [vendasCurrentTotal, vendasPrevTotal, pedidosCurrentTotal, pedidosPrevTotal]);

  // Evolução de vendas (real, últimos 12 meses)
  const graficoData = useMemo(
    () => evolucaoVendas || [
      { mes: 'Jan', valor: 0 },
      { mes: 'Fev', valor: 0 },
      { mes: 'Mar', valor: 0 },
      { mes: 'Abr', valor: 0 },
      { mes: 'Mai', valor: 0 },
      { mes: 'Jun', valor: 0 },
    ],
    [evolucaoVendas]
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
              Últimos 12 meses
            </Typography>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={graficoData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="valor" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Baseado nas vendas aprovadas deste mês
        </Typography>

        {loadingRanking ? (
          <LinearProgress sx={{ borderRadius: 1 }} />
        ) : ranking && ranking.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ranking} margin={{ top: 20, right: 30, left: 80, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="no_vendedor" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
              <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
              <Bar dataKey="vl_total_vendas" fill="#1976d2" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Nenhuma venda registrada neste mês.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};