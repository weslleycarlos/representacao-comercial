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
 */
export const useGetRankingVendedores = () => {
  const fetchRanking = async (): Promise<IVwVendasVendedor[]> => {
    // Chama a rota de relatório que já criamos no backend
    const { data } = await apiClient.get('/gestor/dashboard/relatorio/vendas-vendedor');
    return data;
  };

  return useQuery({
    queryKey: [RANKING_VENDEDORES_KEY],
    queryFn: fetchRanking,
    retry: 1,
  });
};