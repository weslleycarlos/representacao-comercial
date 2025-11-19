// /frontend/src/api/servicos/vendedorService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type {
  ICategoriaProduto,
  IItemCatalogoVenda,
  IEndereco,
  IPedidoCompleto,
  IClienteCompleto,
  IFormaPagamento,
  IVendedor,
} from '../../tipos/schemas';
import type {
  PedidoCreateFormData,
  PedidoUpdate, 
  PedidoCancelRequest,
  ClienteFormData,
  EnderecoFormData,
  VendedorFormData,
} from '../../tipos/validacao';

// --- CACHE KEYS ---
const VENDEDOR_CACHE_KEY = 'vendedores';
const VENDEDOR_CATALOGO_KEY = 'catalogoVendedor';
const VENDEDOR_CATEGORIAS_KEY = 'categoriasVendedor';
const VENDEDOR_PEDIDOS_KEY = 'pedidosVendedor';
const VENDEDOR_PEDIDO_DETALHE_KEY = (id: number) => ['pedidosVendedor', id];
const CLIENTE_CACHE_KEY = 'clientes';
const VENDEDOR_FORMAS_PGTO_KEY = 'formasPagamentoVendedor';
const VENDEDOR_ENDERECO_CACHE_KEY = (idCliente: number) => ['vendedor', 'enderecos', idCliente];

// --- INTERFACES ---
interface UpdatePayload {
  id: number;
  data: Omit<VendedorFormData, 'password'>; // Omitimos a senha da atualização padrão
}

interface VincularPayload {
  id_usuario: number;
  id_empresa: number;
}

interface AddPayload {
  idCliente: number;
  data: EnderecoFormData;
}

interface UpdateEnderecoPayload {
  idEndereco: number;
  idCliente: number;
  data: Partial<EnderecoFormData>;
}

interface DeletePayload {
  idEndereco: number;
  idCliente: number;
}

interface CancelPayload {
  idPedido: number;
  data: PedidoCancelRequest; // (data = { motivo: "..." })
}

// --- HOOKS ---

// --- VENDEDORES (CRUD) ---

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

/**
 * Hook (useQuery) para buscar as Formas de Pagamento (Globais + da Org)
 * (Reutiliza a rota do Gestor, pois a permissão de Vendedor é suficiente)
 */
export const useGetFormasPagamento = () => {
  const fetchFormasPgto = async (): Promise<IFormaPagamento[]> => {
    // (O backend (gestor/config.py) já retorna as globais + da org)
    const { data } = await apiClient.get('/vendedor/config/formas-pagamento');
    return data;
  };

  return useQuery({
    queryKey: [VENDEDOR_FORMAS_PGTO_KEY],
    queryFn: fetchFormasPgto,
  });
};

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

// --- CATÁLOGO (Vendedor) ---

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

// --- PEDIDOS (Vendedor) ---

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
 * Hook (useQuery) para buscar UM pedido específico
 */
export const useGetMeuPedidoDetalhe = (idPedido: number) => {
  const fetchPedido = async (): Promise<IPedidoCompleto> => {
    const { data } = await apiClient.get(`/vendedor/pedidos/${idPedido}`);
    return data;
  };

  return useQuery({
    queryKey: VENDEDOR_PEDIDO_DETALHE_KEY(idPedido),
    queryFn: fetchPedido,
    enabled: !!idPedido, // Só executa se o ID for fornecido
  });
};

/**
 * Hook (useMutation) para CRIAR um novo Pedido.
 * (O 'PedidoCreateFormData' não deve conter 'vl_unitario')
 */
export const useCreatePedido = () => {
  const queryClient = useQueryClient();

  const createPedido = async (pedidoData: PedidoCreateFormData): Promise<IPedidoCompleto> => {
    // A API (backend) espera o formato PedidoCreate (sem dados extras de UI)
    // Nós já limpamos o vl_unitario do schema da API (backend)
    
    // (Podemos precisar limpar dados extras do formulário aqui, se o Zod não o fizer)
    
    const { data } = await apiClient.post('/vendedor/pedidos/', pedidoData);
    return data;
  };

  return useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_PEDIDOS_KEY] });
    },
  });
};

/**
 * Hook (useMutation) para CANCELAR um pedido
 */
export const useCancelarPedido = () => {
  const queryClient = useQueryClient();

  const cancelarPedido = async (payload: CancelPayload): Promise<IPedidoCompleto> => {
    const { data } = await apiClient.post(
      `/vendedor/pedidos/${payload.idPedido}/cancelar`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: cancelarPedido,
    onSuccess: (data) => {
      // Atualiza o cache da lista E o cache do detalhe
      queryClient.invalidateQueries({ queryKey: [VENDEDOR_PEDIDOS_KEY] });
      queryClient.setQueryData(VENDEDOR_PEDIDO_DETALHE_KEY(data.id_pedido), data);
    },
  });
};

// --- CLIENTES (Vendedor) ---

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
    queryKey: [CLIENTE_CACHE_KEY, { ativo: true }],
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

// --- ENDEREÇOS (Vendedor) ---

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

  const updateEndereco = async (payload: UpdateEnderecoPayload): Promise<IEndereco> => {
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