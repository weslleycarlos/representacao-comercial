// /frontend/src/api/servicos/clienteService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IClienteCompleto, IEndereco, IContato } from '../../tipos/schemas';
import type { ClienteFormData , EnderecoFormData, ContatoFormData} from '../../tipos/validacao';

// Define uma "chave" de cache para este recurso
const CLIENTE_CACHE_KEY = 'clientes';
// Chave de cache para os endereços de UM cliente
const ENDERECO_CACHE_KEY = (idCliente: number) => ['clientes', idCliente, 'enderecos'];

const CONTATO_CACHE_KEY = (idCliente: number) => ['clientes', idCliente, 'contatos'];


/**
 * Hook (useQuery) para buscar os endereços de um cliente específico.
 */
export const useGetEnderecosPorCliente = (idCliente: number) => {
  const fetchEnderecos = async (): Promise<IEndereco[]> => {
    // --- CORREÇÃO ---
    // Agora chama a rota de API específica que criamos
    const { data } = await apiClient.get(`/gestor/clientes/${idCliente}/enderecos`);
    return data;
  };

  return useQuery({
    queryKey: ENDERECO_CACHE_KEY(idCliente),
    queryFn: fetchEnderecos,
    enabled: !!idCliente, 
  });
};


/**
 * Hook (useMutation) para ADICIONAR um endereço a um cliente.
 */
export const useAddEndereco = () => {
  const queryClient = useQueryClient();

  interface AddPayload {
    idCliente: number;
    data: EnderecoFormData;
  }

  const addEndereco = async (payload: AddPayload): Promise<IEndereco> => {
    const { data } = await apiClient.post(
      `/gestor/clientes/${payload.idCliente}/enderecos`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: addEndereco,
    onSuccess: (_, variables) => {
      // Invalida o cache de endereços DESTE cliente
      queryClient.invalidateQueries({ 
        queryKey: ENDERECO_CACHE_KEY(variables.idCliente) 
      });
      // Também invalida o cliente completo (caso a lista esteja aninhada)
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};

/**
 * Hook (useMutation) para ATUALIZAR um endereço.
 */
export const useUpdateEndereco = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    idEndereco: number;
    idCliente: number;
    data: Partial<EnderecoFormData>;
  }

  const updateEndereco = async (payload: UpdatePayload): Promise<IEndereco> => {
    // --- CORREÇÃO DA URL AQUI ---
    const { data } = await apiClient.put(
      `/gestor/clientes/enderecos/${payload.idEndereco}`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateEndereco,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ENDERECO_CACHE_KEY(variables.idCliente) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};

/**
 * Hook (useMutation) para EXCLUIR um endereço.
 */
export const useDeleteEndereco = () => {
  const queryClient = useQueryClient();

  interface DeletePayload {
    idEndereco: number;
    idCliente: number;
  }

  const deleteEndereco = async (payload: DeletePayload): Promise<void> => {
    // --- CORREÇÃO DA URL AQUI ---
    await apiClient.delete(`/gestor/clientes/enderecos/${payload.idEndereco}`);
  };

  return useMutation({
    mutationFn: deleteEndereco,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ENDERECO_CACHE_KEY(variables.idCliente) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};

// --- QUERY (Hook para GET) ---
/**
 * Hook customizado (useQuery) para buscar a lista de clientes do gestor.
 */
export const useGetClientes = (apenasAtivos: boolean = true) => {
  
  const fetchClientes = async (): Promise<IClienteCompleto[]> => {
    // Passa o filtro 'ativo' como um query param
    const { data } = await apiClient.get('/gestor/clientes/', {
      params: { ativo: apenasAtivos }
    });
    return data;
  };

  return useQuery({
    // A chave de cache inclui o filtro, 
    // para que "clientes ativos" e "todos os clientes" sejam cacheados separadamente.
    queryKey: [CLIENTE_CACHE_KEY, { ativo: apenasAtivos }], 
    queryFn: fetchClientes,
  });
};

// --- MUTATIONS (Hooks para POST, PUT, DELETE) ---

/**
 * Hook customizado (useMutation) para CRIAR um novo cliente.
 */
export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  const createCliente = async (clienteData: ClienteFormData): Promise<IClienteCompleto> => {
    const { data } = await apiClient.post('/gestor/clientes/', clienteData);
    return data;
  };

  return useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      // Invalida TODO o cache de clientes (ativos e inativos)
      queryClient.invalidateQueries({ queryKey: [CLIENTE_CACHE_KEY] });
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    id: number;
    data: ClienteFormData;
  }

  const updateCliente = async (payload: UpdatePayload): Promise<IClienteCompleto> => {
    const { data } = await apiClient.put(`/gestor/clientes/${payload.id}`, payload.data);
    return data;
  };

  return useMutation({
    mutationFn: updateCliente,
    onSuccess: (data) => {
      // Invalida a lista principal
      queryClient.invalidateQueries({ queryKey: [CLIENTE_CACHE_KEY] });
      // Também atualiza o cache da query individual (se existir)
      queryClient.setQueryData([CLIENTE_CACHE_KEY, data.id_cliente], data);
    },
  });
};

/**
 * Hook customizado (useMutation) para DESATIVAR (Soft Delete) um cliente.
 */
export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  const deleteCliente = async (id: number): Promise<void> => {
    await apiClient.delete(`/gestor/clientes/${id}`);
  };

  return useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTE_CACHE_KEY] });
    },
  });
};

/**
 * Hook (useQuery) para buscar os contatos de um cliente específico.
 */
export const useGetContatosPorCliente = (idCliente: number) => {
  const fetchContatos = async (): Promise<IContato[]> => {
    const { data } = await apiClient.get(`/gestor/clientes/${idCliente}/contatos`);
    return data;
  };

  return useQuery({
    queryKey: CONTATO_CACHE_KEY(idCliente),
    queryFn: fetchContatos,
    enabled: !!idCliente, 
  });
};

/**
 * Hook (useMutation) para ADICIONAR um contato a um cliente.
 */
export const useAddContato = () => {
  const queryClient = useQueryClient();

  interface AddPayload {
    idCliente: number;
    data: ContatoFormData;
  }

  const addContato = async (payload: AddPayload): Promise<IContato> => {
    const { data } = await apiClient.post(
      `/gestor/clientes/${payload.idCliente}/contatos`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: addContato,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: CONTATO_CACHE_KEY(variables.idCliente) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};

/**
 * Hook (useMutation) para ATUALIZAR um contato.
 */
export const useUpdateContato = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    idContato: number;
    idCliente: number; 
    data: Partial<ContatoFormData>;
  }

  const updateContato = async (payload: UpdatePayload): Promise<IContato> => {
    const { data } = await apiClient.put(
      `/gestor/clientes/contatos/${payload.idContato}`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateContato,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: CONTATO_CACHE_KEY(variables.idCliente) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};

/**
 * Hook (useMutation) para EXCLUIR um contato.
 */
export const useDeleteContato = () => {
  const queryClient = useQueryClient();

  interface DeletePayload {
    idContato: number;
    idCliente: number;
  }

  const deleteContato = async (payload: DeletePayload): Promise<void> => {
    await apiClient.delete(`/gestor/clientes/contatos/${payload.idContato}`);
  };

  return useMutation({
    mutationFn: deleteContato,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: CONTATO_CACHE_KEY(variables.idCliente) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clientes', variables.idCliente] 
      });
    },
  });
};