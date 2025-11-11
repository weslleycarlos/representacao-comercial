// /frontend/src/api/servicos/gestorCatalogoService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { 
  ICategoriaProduto, 
  IProdutoCompleto, 
  ICatalogo, 
  IItemCatalogo 
} from '../../tipos/schemas';
import type { 
  ProdutoFormData, 
  CatalogoFormData, 
  ItemCatalogoFormData 
} from '../../tipos/validacao';

// --- Chaves de Cache ---
const CATEGORIA_CACHE_KEY = 'categoriasGestor';
const PRODUTO_CACHE_KEY = 'produtosGestor';
const CATALOGO_CACHE_KEY = (idEmpresa: number) => ['catalogosGestor', idEmpresa];
const ITEM_CATALOGO_CACHE_KEY = (idCatalogo: number) => ['itensCatalogoGestor', idCatalogo];


/**
 * Hook (useQuery) para buscar TODAS as categorias da organização
 */
export const useGetCategorias = () => {
  const fetchCategorias = async (): Promise<ICategoriaProduto[]> => {
    // (A API que criamos no backend fica em /gestor/catalogo/categorias)
    const { data } = await apiClient.get('/gestor/catalogo/categorias');
    return data;
  };

  return useQuery({
    queryKey: [CATEGORIA_CACHE_KEY], // Usa a Chave de Cache
    queryFn: fetchCategorias,
  });
};

// ============================================
// Hooks de PRODUTOS (Definição)
// ============================================

/**
 * Hook (useQuery) para buscar PRODUTOS (definições) por empresa
 */
export const useGetProdutosPorEmpresa = (idEmpresa: number) => {
  const fetchProdutos = async (): Promise<IProdutoCompleto[]> => {
    const { data } = await apiClient.get('/gestor/catalogo/produtos', {
      params: { id_empresa: idEmpresa }
    });
    return data;
  };

  return useQuery({
    queryKey: [PRODUTO_CACHE_KEY, idEmpresa],
    queryFn: fetchProdutos,
    enabled: !!idEmpresa, // Só executa se a empresa for selecionada
  });
};

/**
 * Hook (useMutation) para CRIAR um novo PRODUTO (definição)
 */
export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  const createProduto = async (produtoData: ProdutoFormData): Promise<IProdutoCompleto> => {
    const { data } = await apiClient.post('/gestor/catalogo/produtos', produtoData);
    return data;
  };

  return useMutation({
    mutationFn: createProduto,
    onSuccess: (data) => {
      // Invalida a query de produtos desta empresa
      queryClient.invalidateQueries({ 
        queryKey: [PRODUTO_CACHE_KEY, data.id_empresa] 
      });
    },
  });
};

/**
 * Hook (useMutation) para ATUALIZAR um PRODUTO (definição)
 */
export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    idProduto: number;
    data: Partial<ProdutoFormData>; // Partial<> pois podem ser dados parciais
  }

  const updateProduto = async (payload: UpdatePayload): Promise<IProdutoCompleto> => {
    const { data } = await apiClient.put(
      `/gestor/catalogo/produtos/${payload.idProduto}`,
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateProduto,
    onSuccess: (data) => {
      // Invalida a query de produtos desta empresa
      queryClient.invalidateQueries({ 
        queryKey: [PRODUTO_CACHE_KEY, data.id_empresa] 
      });
      // (Opcional) Atualiza o cache individual do produto
      queryClient.setQueryData([PRODUTO_CACHE_KEY, 'detalhe', data.id_produto], data);
    },
  });
};

/**
 * Hook (useMutation) para EXCLUIR um PRODUTO (Soft Delete)
 */
export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  const deleteProduto = async (idProduto: number): Promise<void> => {
    // (A API para DELETE de produto não foi criada no backend.
    // Vamos assumir que a rota PUT /produtos/{id} com fl_ativo=false é usada
    // ou que precisamos adicionar a rota DELETE)
    
    // Por enquanto, vamos usar a rota PUT para DESATIVAR
    const { data } = await apiClient.put(
      `/gestor/catalogo/produtos/${idProduto}`,
      { fl_ativo: false } // Envia o payload de desativação
    );
    return data;
  };

  return useMutation({
    mutationFn: deleteProduto,
    onSuccess: (_, idProduto) => {
      // Invalida todos os caches de produto
      queryClient.invalidateQueries({ queryKey: [PRODUTO_CACHE_KEY] });
    },
  });
};

// ============================================
// Hooks de CATÁLOGOS (Capas / Listas de Preço)
// ============================================

/**
 * Hook (useQuery) para buscar os CATÁLOGOS (capas) de uma empresa
 */
export const useGetCatalogosPorEmpresa = (idEmpresa: number) => {
  const fetchCatalogos = async (): Promise<ICatalogo[]> => {
    const { data } = await apiClient.get('/gestor/catalogo/catalogos', {
      params: { id_empresa: idEmpresa }
    });
    return data;
  };

  return useQuery({
    queryKey: CATALOGO_CACHE_KEY(idEmpresa),
    queryFn: fetchCatalogos,
    enabled: !!idEmpresa,
  });
};

/**
 * Hook (useMutation) para CRIAR um novo CATÁLOGO (capa)
 */
export const useCreateCatalogo = () => {
  const queryClient = useQueryClient();

  const createCatalogo = async (catalogoData: CatalogoFormData): Promise<ICatalogo> => {
    const { data } = await apiClient.post('/gestor/catalogo/catalogos', catalogoData);
    return data;
  };

  return useMutation({
    mutationFn: createCatalogo,
    onSuccess: (data) => {
      // Invalida a query de catálogos desta empresa
      queryClient.invalidateQueries({ 
        queryKey: CATALOGO_CACHE_KEY(data.id_empresa) 
      });
    },
  });
};

export const useUpdateCatalogo = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    idCatalogo: number;
    // (Usamos Partial<> pois os campos são opcionais)
    data: Partial<CatalogoFormData>; 
  }

  const updateCatalogo = async (payload: UpdatePayload): Promise<ICatalogo> => {
    const { data } = await apiClient.put(
      `/gestor/catalogo/catalogos/${payload.idCatalogo}`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateCatalogo,
    onSuccess: (data) => {
      // Invalida a query de catálogos desta empresa
      queryClient.invalidateQueries({ 
        queryKey: CATALOGO_CACHE_KEY(data.id_empresa) 
      });
    },
  });
};

/**
 * Hook (useMutation) para DESATIVAR (Soft Delete) um catálogo
 */
export const useDeleteCatalogo = () => {
  const queryClient = useQueryClient();

  interface DeletePayload {
    idCatalogo: number;
    idEmpresa: number; // Para invalidar o cache
  }

  const deleteCatalogo = async (payload: DeletePayload): Promise<ICatalogo> => {
    // Soft delete é um PUT/UPDATE
    const { data } = await apiClient.put(
      `/gestor/catalogo/catalogos/${payload.idCatalogo}`, 
      { fl_ativo: false } // O payload da desativação
    );
    return data;
  };

  return useMutation({
    mutationFn: deleteCatalogo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CATALOGO_CACHE_KEY(data.id_empresa) });
    },
  });
};
// ============================================
// Hooks de ITENS DE CATÁLOGO (Preços)
// ============================================

/**
 * Hook (useQuery) para buscar os ITENS (preços) dentro de um catálogo
 */
export const useGetItensCatalogo = (idCatalogo: number) => {
  const fetchItens = async (): Promise<IItemCatalogo[]> => {
    const { data } = await apiClient.get(`/gestor/catalogo/catalogos/${idCatalogo}/itens`);
    return data;
  };

  return useQuery({
    queryKey: ITEM_CATALOGO_CACHE_KEY(idCatalogo),
    queryFn: fetchItens,
    enabled: !!idCatalogo,
  });
};

/**
 * Hook (useMutation) para ADICIONAR UM PRODUTO/PREÇO a um catálogo
 */
export const useAddItemCatalogo = () => {
  const queryClient = useQueryClient();

  interface AddPayload {
    idCatalogo: number;
    data: ItemCatalogoFormData;
  }

  const addItem = async (payload: AddPayload): Promise<IItemCatalogo> => {
    const { data } = await apiClient.post(
      `/gestor/catalogo/catalogos/${payload.idCatalogo}/itens`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: addItem,
    onSuccess: (data) => {
      // Invalida os itens deste catálogo
      queryClient.invalidateQueries({ 
        queryKey: ITEM_CATALOGO_CACHE_KEY(data.id_catalogo) 
      });
    },
  });
};

/**
 * Hook (useMutation) para ATUALIZAR UM PREÇO em um catálogo
 */
export const useUpdateItemCatalogo = () => {
  const queryClient = useQueryClient();

  interface UpdatePayload {
    idItemCatalogo: number;
    idCatalogo: number; // Para invalidar o cache
    data: Partial<ItemCatalogoFormData>; // O schema de formulário
  }

  const updateItem = async (payload: UpdatePayload): Promise<IItemCatalogo> => {
    const { data } = await apiClient.put(
      `/gestor/catalogo/itens/${payload.idItemCatalogo}`, 
      payload.data
    );
    return data;
  };

  return useMutation({
    mutationFn: updateItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ITEM_CATALOGO_CACHE_KEY(variables.idCatalogo) 
      });
    },
  });
};

/**
 * Hook (useMutation) para REMOVER UM PRODUTO de um catálogo
 */
export const useDeleteItemCatalogo = () => {
  const queryClient = useQueryClient();

  interface DeletePayload {
    idItemCatalogo: number;
    idCatalogo: number; // Para invalidar o cache
  }

  const deleteItem = async (payload: DeletePayload): Promise<void> => {
    await apiClient.delete(`/gestor/catalogo/itens/${payload.idItemCatalogo}`);
  };

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ITEM_CATALOGO_CACHE_KEY(variables.idCatalogo) 
      });
    },
  });
};

// (Rotas de Categoria, Variação, Updates e Deletes seguem o mesmo padrão)