// /frontend/src/api/servicos/dashboardService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IGestorDashboardKpi, IVendedorDashboardKpi } from '../../tipos/schemas';

// Chave de cache para os KPIs do Gestor
const GESTOR_KPI_CACHE_KEY = 'gestorKpis';
const VENDEDOR_KPI_CACHE_KEY = 'vendedorKpis';

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