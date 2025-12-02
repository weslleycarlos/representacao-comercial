// /frontend/src/api/servicos/adminService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IAdminDashboardKpiSchema, IOrganizacao, IOrganizacaoDetalhada, ILogAuditoria } from '../../tipos/schemas';
import type { AdminOrganizacaoFormData } from '../../tipos/validacao';

const ADMIN_KPI_KEY = 'adminKpis';
const ADMIN_ORGS_KEY = 'adminOrgs';
const ADMIN_ORG_DETAIL_KEY = (id: number) => ['adminOrgDetail', id];
const ADMIN_LOGS_KEY = (filters?: any) => ['adminLogs', filters];

// --- DASHBOARD ---

export const useGetAdminKpis = () => {
  const fetchKpis = async (): Promise<IAdminDashboardKpiSchema> => {
    const { data } = await apiClient.get('/admin/dashboard/kpis');
    return data;
  };

  return useQuery({
    queryKey: [ADMIN_KPI_KEY],
    queryFn: fetchKpis,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// --- ORGANIZAÇÕES ---

export const useGetOrganizacoes = () => {
  const fetchOrgs = async (): Promise<IOrganizacao[]> => {
    const { data } = await apiClient.get('/admin/organizacoes/');
    return data;
  };
  return useQuery({ queryKey: [ADMIN_ORGS_KEY], queryFn: fetchOrgs });
};

export const useGetOrganizacaoById = (id?: number) => {
  const fetchOrg = async (): Promise<IOrganizacaoDetalhada> => {
    if (!id) throw new Error("ID is required");
    const { data } = await apiClient.get(`/admin/organizacoes/${id}`);
    return data;
  };

  return useQuery({
    queryKey: ADMIN_ORG_DETAIL_KEY(id!),
    queryFn: fetchOrg,
    enabled: !!id
  });
};

export const useCreateOrganizacao = () => {
  const queryClient = useQueryClient();
  const create = async (data: AdminOrganizacaoFormData): Promise<IOrganizacao> => {
    const { data: res } = await apiClient.post('/admin/organizacoes/', data);
    return res;
  };
  return useMutation({
    mutationFn: create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_ORGS_KEY] }),
  });
};

export const useUpdateOrganizacao = () => {
  const queryClient = useQueryClient();
  interface UpdatePayload { id: number; data: Partial<AdminOrganizacaoFormData>; }

  const update = async ({ id, data }: UpdatePayload): Promise<IOrganizacao> => {
    const { data: res } = await apiClient.put(`/admin/organizacoes/${id}`, data);
    return res;
  };
  return useMutation({
    mutationFn: update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_ORGS_KEY] }),
  });
};

// --- LOGS GLOBAIS ---

export const useGetLogsAdmin = (filters?: { id_organizacao?: number; tp_entidade?: string }) => {
  const fetchLogs = async (): Promise<ILogAuditoria[]> => {
    const params = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v != null && v !== '')
    );
    const { data } = await apiClient.get('/admin/logs/', { params });
    return data;
  };

  return useQuery({
    queryKey: ADMIN_LOGS_KEY(filters),
    queryFn: fetchLogs
  });
};