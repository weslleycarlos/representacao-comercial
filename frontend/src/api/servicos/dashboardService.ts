// /frontend/src/api/servicos/dashboardService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IGestorDashboardKpi, IVendedorDashboardKpi, IVwVendasVendedor } from '../../tipos/schemas';

// Chave de cache para os KPIs do Gestor
const GESTOR_KPI_CACHE_KEY = 'gestorKpis';
const VENDEDOR_KPI_CACHE_KEY = 'vendedorKpis';
const RANKING_VENDEDORES_KEY = 'gestorRankingVendedores';

/**
 * Hook (useQuery) para buscar os KPIs do dashboard do Gestor
 */
export const useGetGestorKpis = () => {
  
  const fetchKpis = async (): Promise<IGestorDashboardKpi> => {
    const { data } = await apiClient.get('/gestor/dashboard/kpis');
    return data;
  };

  return useQuery({
    queryKey: [GESTOR_KPI_CACHE_KEY],
    queryFn: fetchKpis,
    retry: 1,
    refetchOnWindowFocus: false, // Dashboard não precisa atualizar a cada foco
  });
};

export const useGetVendedorKpis = () => {
  const fetchKpis = async (): Promise<IVendedorDashboardKpi> => {
    const { data } = await apiClient.get('/vendedor/dashboard/kpis');
    return data;
  };

  return useQuery({
    queryKey: [VENDEDOR_KPI_CACHE_KEY],
    queryFn: fetchKpis,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para buscar o Ranking de Vendas por Vendedor (para o Top Vendedores)
 * Filtra por mês atual
 */
export const useGetRankingVendedores = () => {
  const fetchRanking = async (): Promise<IVwVendasVendedor[]> => {
    // Calcula o primeiro e último dia do mês atual
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startDate = `${primeiroDia.getFullYear()}-${pad(primeiroDia.getMonth() + 1)}-${pad(primeiroDia.getDate())}`;
    const endDate = `${ultimoDia.getFullYear()}-${pad(ultimoDia.getMonth() + 1)}-${pad(ultimoDia.getDate())}`;

    // Chama a rota com datas do mês atual
    const { data } = await apiClient.get('/gestor/dashboard/relatorio/vendas-vendedor', {
      params: { start_date: startDate, end_date: endDate }
    });
    return data;
  };

  return useQuery({
    queryKey: [RANKING_VENDEDORES_KEY],
    queryFn: fetchRanking,
    retry: 1,
  });
};