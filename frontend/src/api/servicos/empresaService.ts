// /frontend/src/api/servicos/empresaService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IEmpresa } from '../../tipos/auth'; // Reutiliza a interface
import type { EmpresaFormData } from '../../tipos/validacao';
import type { EmpresaCompletaSchema } from '../../tipos/schemas'; // Importa o schema de resposta completo

// Define uma "chave" de cache para este recurso
const EMPRESA_CACHE_KEY = 'empresas';

// --- QUERY (Hook para GET) ---
/**
 * Hook customizado (useQuery) para buscar a lista de empresas do gestor.
 * Gerencia cache, loading e erros automaticamente.
 */
export const useGetEmpresas = () => {
  const fetchEmpresas = async (): Promise<EmpresaCompletaSchema[]> => {
    const { data } = await apiClient.get('/gestor/empresas/');
    return data;
  };

  return useQuery({
    queryKey: [EMPRESA_CACHE_KEY], // Chave de cache
    queryFn: fetchEmpresas,       // Função que busca os dados
  });
};


// --- MUTATIONS (Hooks para POST, PUT, DELETE) ---
/**
 * Hook customizado (useMutation) para CRIAR uma nova empresa.
 */
export const useCreateEmpresa = () => {
  const queryClient = useQueryClient(); // Para invalidar o cache

  const createEmpresa = async (empresaData: EmpresaFormData): Promise<IEmpresa> => {
    const { data } = await apiClient.post('/gestor/empresas/', empresaData);
    return data;
  };

  return useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
      // Invalida o cache [EMPRESA_CACHE_KEY] para forçar o useGetEmpresas a recarregar
      queryClient.invalidateQueries({ queryKey: [EMPRESA_CACHE_KEY] });
    },
    // (onError é tratado na página que chama o hook)
  });
};

/**
 * Hook customizado (useMutation) para ATUALIZAR uma empresa.
 */
export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();

  // O tipo 'payload' inclui o ID e os dados do formulário
  interface UpdatePayload {
    id: number;
    data: EmpresaFormData;
  }

  const updateEmpresa = async (payload: UpdatePayload): Promise<IEmpresa> => {
    const { data } = await apiClient.put(`/gestor/empresas/${payload.id}`, payload.data);
    return data;
  };

  return useMutation({
    mutationFn: updateEmpresa,
    onSuccess: () => {
      // Invalida o cache para atualizar a tabela
      queryClient.invalidateQueries({ queryKey: [EMPRESA_CACHE_KEY] });
    },
  });
};

/**
 * Hook customizado (useMutation) para DESATIVAR (Soft Delete) uma empresa.
 */
export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();

  const deleteEmpresa = async (id: number): Promise<void> => {
    // A API retorna 204 (No Content), por isso o 'Promise<void>'
    await apiClient.delete(`/gestor/empresas/${id}`);
  };

  return useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMPRESA_CACHE_KEY] });
    },
  });
};