// /frontend/src/api/servicos/adminService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IAdminDashboardKpiSchema } from '../../tipos/schemas';

// Chave de cache para os KPIs do Admin
const ADMIN_KPI_CACHE_KEY = 'adminKpis';

/**
 * Hook (useQuery) para buscar os KPIs globais do Super Admin
 */
export const useGetAdminKpis = () => {
  
  const fetchKpis = async (): Promise<IAdminDashboardKpiSchema> => {
    const { data } = await apiClient.get('/admin/dashboard/kpis');
    return data;
  };

  return useQuery({
    queryKey: [ADMIN_KPI_CACHE_KEY], // Chave de cache
    queryFn: fetchKpis,
    retry: 1,
    refetchOnWindowFocus: false, // Evita refetch desnecessário no dashboard
  });
};

// (No futuro, adicionaremos aqui os hooks de CRUD de Organizações)