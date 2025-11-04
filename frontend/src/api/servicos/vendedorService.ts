// /frontend/src/api/servicos/vendedorService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { VendedorSchema } from '../../tipos/schemas';
import type { VendedorFormData } from '../../tipos/validacao';

// Define uma "chave" de cache para este recurso
const VENDEDOR_CACHE_KEY = 'vendedores';

// --- QUERY (Hook para GET) ---
export const useGetVendedores = () => {
  const fetchVendedores = async (): Promise<VendedorSchema[]> => {
    const { data } = await apiClient.get('/gestor/vendedores/');
    return data;
  };

  return useQuery({
    queryKey: [VENDEDOR_CACHE_KEY],
    queryFn: fetchVendedores,
  });
};

// --- MUTATIONS (Hooks para POST, PUT, DELETE) ---

export const useCreateVendedor = () => {
  const queryClient = useQueryClient();

  const createVendedor = async (vendedorData: VendedorFormData): Promise<VendedorSchema> => {
    const { data } = await apiClient.post('/gestor/vendedores/', vendedorData);
    return data;
  };

  return useMutation({
    mutationFn: createVendedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_CACHE_KEY] });
    },
  });
};

export const useUpdateVendedor = () => {
  const queryClient = useQueryClient();
  interface UpdatePayload {
    id: number;
    data: Omit<VendedorFormData, 'password'>; // Omitimos a senha da atualização padrão
  }

  const updateVendedor = async (payload: UpdatePayload): Promise<VendedorSchema> => {
    const { data } = await apiClient.put(`/gestor/vendedores/${payload.id}`, payload.data);
    return data;
  };

  return useMutation({
    mutationFn: updateVendedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_CACHE_KEY] });
    },
  });
};

interface VincularPayload {
  id_usuario: number;
  id_empresa: number;
}

export const useVincularEmpresa = () => {
  const queryClient = useQueryClient();

  const vincular = async (payload: VincularPayload) => {
    // A API espera UsuarioEmpresaSchema, mas retorna o vínculo criado
    const { data } = await apiClient.post('/gestor/vendedores/vincular-empresa', payload);
    return data;
  };

  return useMutation({
    mutationFn: vincular,
    onSuccess: () => {
      // Quando um vínculo muda, atualizamos a lista de vendedores
      // (pois a coluna "Empresas" na tabela precisa ser atualizada)
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_CACHE_KEY] });
    },
  });
};

/**
 * Hook para DESVINCULAR um Vendedor de uma Empresa
 */
export const useDesvincularEmpresa = () => {
  const queryClient = useQueryClient();

  const desvincular = async (payload: VincularPayload) => {
    // O backend espera um body (payload) e retorna 204 (No Content)
    await apiClient.delete('/gestor/vendedores/desvincular-empresa', { data: payload });
  };

  return useMutation({
    mutationFn: desvincular,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_CACHE_KEY] });
    },
  });
};

// (Não há rota DELETE para Vendedor, apenas PUT para desativar 'fl_ativo')