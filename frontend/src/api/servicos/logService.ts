// /frontend/src/api/servicos/logService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../axios';
import type { ILogAuditoria } from '../../tipos/schemas'; // Verifique se ILogAuditoria está em schemas.ts

// Chaves de Cache
const LOGS_GESTOR_KEY = (filters?: any) => ['logsGestor', filters];
const LOGS_ADMIN_KEY = (filters?: any) => ['logsAdmin', filters];

// --- GESTOR ---

export const useGetLogsGestor = (filters?: { 
  id_usuario?: number;
  tp_entidade?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const fetchLogs = async (): Promise<ILogAuditoria[]> => {
    // Limpa filtros vazios
    const params = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v != null && v !== '')
    );
    
    const { data } = await apiClient.get('/gestor/logs/', { params });
    return data;
  };

  return useQuery({
    queryKey: LOGS_GESTOR_KEY(filters),
    queryFn: fetchLogs,
    retry: 1,
  });
};

// --- ADMIN (Já deixamos pronto) ---

export const useGetLogsAdmin = (filters?: { 
  id_organizacao?: number;
  id_usuario?: number;
  tp_entidade?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const fetchLogs = async (): Promise<ILogAuditoria[]> => {
    const params = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v != null && v !== '')
    );
    const { data } = await apiClient.get('/admin/logs/', { params });
    return data;
  };

  return useQuery({
    queryKey: LOGS_ADMIN_KEY(filters),
    queryFn: fetchLogs,
    retry: 1,
  });
};