// /frontend/src/api/servicos/vendedorService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { 
  ICategoriaProduto, 
  IItemCatalogoVenda, // O que o Vendedor VÊ
  IPedidoCompleto 
} from '../../tipos/schemas';
import type { 
  PedidoCreateFormData // (O que o Vendedor ENVIA)
} from '../../tipos/validacao';
import type { IVendedor } from '../../tipos/schemas';
import type { VendedorFormData } from '../../tipos/validacao';

// Define uma "chave" de cache para este recurso
const VENDEDOR_CACHE_KEY = 'vendedores';
const VENDEDOR_CATALOGO_KEY = 'catalogoVendedor';
const VENDEDOR_CATEGORIAS_KEY = 'categoriasVendedor';
const VENDEDOR_PEDIDOS_KEY = 'pedidosVendedor';

// --- QUERY (Hook para GET) ---
export const useGetVendedores = () => {
  const fetchVendedores = async (): Promise<IVendedor[]> => {
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

  const createVendedor = async (vendedorData: VendedorFormData): Promise<IVendedor> => {
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

  const updateVendedor = async (payload: UpdatePayload): Promise<IVendedor> => {
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

export const useGetCatalogoVenda = (idCategoria?: number) => {
  const fetchCatalogo = async (): Promise<IItemCatalogoVenda[]> => {
    const { data } = await apiClient.get('/vendedor/catalogo/', {
      params: { id_categoria: idCategoria }
    });
    return data;
  };

  return useQuery({
    // A chave de cache muda se a categoria mudar
    queryKey: [VENDEDOR_CATALOGO_KEY, { idCategoria }], 
    queryFn: fetchCatalogo,
  });
};

/**
 * Hook (useQuery) para buscar as Categorias (para o Vendedor filtrar)
 */
export const useGetCategoriasVenda = () => {
  const fetchCategorias = async (): Promise<ICategoriaProduto[]> => {
    const { data } = await apiClient.get('/vendedor/catalogo/categorias');
    return data;
  };

  return useQuery({
    queryKey: [VENDEDOR_CATEGORIAS_KEY],
    queryFn: fetchCategorias,
  });
};


// ============================================
// PEDIDOS DO VENDEDOR (CRUD)
// ============================================

/**
 * Hook (useMutation) para CRIAR um novo Pedido.
 * (O 'PedidoCreateFormData' não deve conter 'vl_unitario')
 */
export const useCreatePedido = () => {
  const queryClient = useQueryClient();

  const createPedido = async (pedidoData: PedidoCreateFormData): Promise<IPedidoCompleto> => {
    const { data } = await apiClient.post('/vendedor/pedidos/', pedidoData);
    return data;
  };

  return useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      // Invalida a lista de pedidos do vendedor
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_PEDIDOS_KEY] });
    },
  });
};

/**
 * Hook (useQuery) para buscar os pedidos do Vendedor logado
 */
export const useGetMeusPedidos = () => {
  const fetchPedidos = async (): Promise<IPedidoCompleto[]> => {
    const { data } = await apiClient.get('/vendedor/pedidos/');
    return data;
  };

  return useQuery({
    queryKey: [VENDEDOR_PEDIDOS_KEY],
    queryFn: fetchPedidos,
  });
};