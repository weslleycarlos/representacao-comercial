// /frontend/src/api/servicos/vendedorService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { 
  ICategoriaProduto, 
  IItemCatalogoVenda,
  IEndereco,
  IPedidoCompleto,
  IClienteCompleto
} from '../../tipos/schemas';
import type { 
  PedidoCreateFormData,
  ClienteFormData,
  EnderecoFormData
} from '../../tipos/validacao';
import type { IVendedor } from '../../tipos/schemas';
import type { VendedorFormData } from '../../tipos/validacao';

// Define uma "chave" de cache para este recurso
const VENDEDOR_CACHE_KEY = 'vendedores';
const VENDEDOR_CATALOGO_KEY = 'catalogoVendedor';
const VENDEDOR_CATEGORIAS_KEY = 'categoriasVendedor';
const VENDEDOR_PEDIDOS_KEY = 'pedidosVendedor';
const CLIENTE_CACHE_KEY = 'clientes';

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


/**
 * Hook (useQuery) para o VENDEDOR buscar clientes da organização
 */
export const useGetVendedorClientes = () => {
  const fetchClientes = async (): Promise<IClienteCompleto[]> => {
    // --- ESTA É A ROTA CORRETA ---
    const { data } = await apiClient.get('/vendedor/clientes/');
    return data;
  };

  return useQuery({
    queryKey: [CLIENTE_CACHE_KEY, { ativo: true }], // (Mesma chave do gestor)
    queryFn: fetchClientes,
  });
};

/**
 * Hook (useMutation) para o VENDEDOR criar um novo cliente
 */
export const useCreateVendedorCliente = () => {
  const queryClient = useQueryClient();

  const createCliente = async (clienteData: ClienteFormData): Promise<IClienteCompleto> => {
    // --- ESTA É A ROTA CORRETA ---
    const { data } = await apiClient.post('/vendedor/clientes/', clienteData);
    return data;
  };

  return useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTE_CACHE_KEY] });
    },
  });
};

// ============================================
// ENDEREÇOS (Vendedor)
// ============================================

const VENDEDOR_ENDERECO_CACHE_KEY = (idCliente: number) => ['vendedor', 'enderecos', idCliente];

export const useGetVendedorEnderecos = (idCliente: number) => {
  const fetchEnderecos = async (): Promise<IEndereco[]> => {
    // Chama a nova rota do Vendedor
    const { data } = await apiClient.get(`/vendedor/clientes/${idCliente}/enderecos`);
    return data;
  };

  return useQuery({
    queryKey: VENDEDOR_ENDERECO_CACHE_KEY(idCliente),
    queryFn: fetchEnderecos,
    enabled: !!idCliente, 
  });
};

export const useAddVendedorEndereco = () => {
  const queryClient = useQueryClient();
  interface AddPayload { idCliente: number; data: EnderecoFormData; }

  const addEndereco = async (payload: AddPayload): Promise<IEndereco> => {
    const { data } = await apiClient.post(
      `/vendedor/clientes/${payload.idCliente}/enderecos`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: addEndereco,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: VENDEDOR_ENDERECO_CACHE_KEY(variables.idCliente) 
      });
    },
  });
};

export const useUpdateVendedorEndereco = () => {
  const queryClient = useQueryClient();
  interface UpdatePayload { idEndereco: number; idCliente: number; data: Partial<EnderecoFormData>; }

  const updateEndereco = async (payload: UpdatePayload): Promise<IEndereco> => {
    const { data } = await apiClient.put(
      `/vendedor/enderecos/${payload.idEndereco}`, // Rota do Vendedor
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateEndereco,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: VENDEDOR_ENDERECO_CACHE_KEY(variables.idCliente) 
      });
    },
  });
};

export const useDeleteVendedorEndereco = () => {
  const queryClient = useQueryClient();
  interface DeletePayload { idEndereco: number; idCliente: number; }

  const deleteEndereco = async (payload: DeletePayload): Promise<void> => {
    await apiClient.delete(`/vendedor/enderecos/${payload.idEndereco}`); // Rota do Vendedor
  };

  return useMutation({
    mutationFn: deleteEndereco,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: VENDEDOR_ENDERECO_CACHE_KEY(variables.idCliente) 
      });
    },
  });
};