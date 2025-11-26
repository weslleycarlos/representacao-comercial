// /frontend/src/api/servicos/gestorConfigService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../axios';
import type { IFormaPagamento, IRegraComissao } from '../../tipos/schemas';
import type { FormaPagamentoFormData, RegraComissaoFormData } from '../../tipos/validacao';

// Chaves de Cache
const FORMAS_PGTO_KEY = 'gestorFormasPgto';
const REGRAS_COMISSAO_KEY = 'gestorRegrasComissao';

// ============================================
// FORMAS DE PAGAMENTO
// ============================================

export const useGetFormasPagamentoGestor = () => {
  const fetch = async (): Promise<IFormaPagamento[]> => {
    const { data } = await apiClient.get('/gestor/config/formas-pagamento');
    return data;
  };
  return useQuery({ queryKey: [FORMAS_PGTO_KEY], queryFn: fetch });
};

export const useCreateFormaPagamento = () => {
  const queryClient = useQueryClient();
  const create = async (formData: FormaPagamentoFormData): Promise<IFormaPagamento> => {
    const { data } = await apiClient.post('/gestor/config/formas-pagamento', formData);
    return data;
  };
  return useMutation({
    mutationFn: create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FORMAS_PGTO_KEY] }),
  });
};

// (Adicione useUpdateFormaPagamento e useDeleteFormaPagamento se precisar no futuro)


// ============================================
// REGRAS DE COMISSÃO
// ============================================

export const useGetRegrasComissao = () => {
  const fetch = async (): Promise<IRegraComissao[]> => {
    const { data } = await apiClient.get('/gestor/config/regras-comissao');
    return data;
  };
  return useQuery({ queryKey: [REGRAS_COMISSAO_KEY], queryFn: fetch });
};

export const useCreateRegraComissao = () => {
  const queryClient = useQueryClient();
  const create = async (formData: RegraComissaoFormData): Promise<IRegraComissao> => {
    const { data } = await apiClient.post('/gestor/config/regras-comissao', formData);
    return data;
  };
  return useMutation({
    mutationFn: create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REGRAS_COMISSAO_KEY] }),
  });
};


// ============================================
// FORMAS DE PAGAMENTO (Hooks Extras)
// ============================================

export const useUpdateFormaPagamento = () => {
  const queryClient = useQueryClient();
  interface UpdatePayload { id: number; data: Partial<FormaPagamentoFormData>; }

  const update = async ({ id, data }: UpdatePayload): Promise<IFormaPagamento> => {
    const { data: res } = await apiClient.put(`/gestor/config/formas-pagamento/${id}`, data);
    return res;
  };
  return useMutation({
    mutationFn: update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FORMAS_PGTO_KEY] }),
  });
};

export const useDeleteFormaPagamento = () => {
  const queryClient = useQueryClient();
  const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/gestor/config/formas-pagamento/${id}`);
  };
  return useMutation({
    mutationFn: remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FORMAS_PGTO_KEY] }),
  });
};

// ============================================
// REGRAS DE COMISSÃO (Hooks Extras)
// ============================================

export const useUpdateRegraComissao = () => {
  const queryClient = useQueryClient();
  interface UpdatePayload { id: number; data: Partial<RegraComissaoFormData>; }

  const update = async ({ id, data }: UpdatePayload): Promise<IRegraComissao> => {
    const { data: res } = await apiClient.put(`/gestor/config/regras-comissao/${id}`, data);
    return res;
  };
  return useMutation({
    mutationFn: update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REGRAS_COMISSAO_KEY] }),
  });
};

export const useDeleteRegraComissao = () => {
  const queryClient = useQueryClient();
  const remove = async (id: number): Promise<void> => {
    await apiClient.delete(`/gestor/config/regras-comissao/${id}`);
  };
  return useMutation({
    mutationFn: remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [REGRAS_COMISSAO_KEY] }),
  });
};