// /frontend/src/api/servicos/gestorPedidoService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IPedidoCompleto } from '../../tipos/schemas';
import type { PedidoStatusFormData } from '../../tipos/validacao';

// Chave de cache
const GESTOR_PEDIDOS_KEY = (filters?: any) => ['pedidosGestor', filters];

/**
 * Hook (useQuery) para listar TODOS os pedidos da organização (com filtros)
 */
export const useGetPedidosGestor = (filters?: { 
  id_vendedor?: number;
  id_cliente?: number;
  st_pedido?: string;
  // Adicione paginação aqui se necessário
}) => {
  const fetchPedidos = async (): Promise<IPedidoCompleto[]> => {
    // Limpa filtros undefined/null/vazios
    const params = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v != null && v !== '')
    );
    
    const { data } = await apiClient.get('/gestor/pedidos/', { params });
    return data;
  };

  return useQuery({
    queryKey: GESTOR_PEDIDOS_KEY(filters),
    queryFn: fetchPedidos,
  });
};

/**
 * Hook (useMutation) para MUDAR STATUS do pedido
 */
export const useUpdateStatusPedido = () => {
  const queryClient = useQueryClient();

  interface StatusPayload {
    idPedido: number;
    data: PedidoStatusFormData;
  }

  const updateStatus = async (payload: StatusPayload): Promise<IPedidoCompleto> => {
    const { data } = await apiClient.put(
      `/gestor/pedidos/${payload.idPedido}/status`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      // Invalida a lista geral de pedidos do gestor
      queryClient.invalidateQueries({ queryKey: ['pedidosGestor'] });
    },
  });
};