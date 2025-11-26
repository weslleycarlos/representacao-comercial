// /frontend/src/api/servicos/relatorioService.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../axios';
import type { 
  IVwVendasVendedor, 
  IVwVendasEmpresa, 
  IVwVendasCidade, 
  IVwComissaoCalculada 
} from '../../tipos/schemas';

// Chaves de Cache (incluem as datas para recarregar ao filtrar)
const RELATORIO_KEYS = {
  vendedor: (start?: string, end?: string) => ['relatorioVendasVendedor', { start, end }],
  empresa: (start?: string, end?: string) => ['relatorioVendasEmpresa', { start, end }],
  cidade: (start?: string, end?: string) => ['relatorioVendasCidade', { start, end }],
  comissao: (start?: string, end?: string) => ['relatorioComissoes', { start, end }],
};

// Helper para formatar params
const getParams = (start?: string, end?: string) => ({
  start_date: start || undefined,
  end_date: end || undefined,
});

// --- HOOKS ---

export const useRelatorioVendasVendedor = (start?: string, end?: string) => {
  return useQuery({
    queryKey: RELATORIO_KEYS.vendedor(start, end),
    queryFn: async () => {
      const { data } = await apiClient.get<IVwVendasVendedor[]>('/gestor/dashboard/relatorio/vendas-vendedor', {
        params: getParams(start, end)
      });
      return data;
    }
  });
};

export const useRelatorioVendasEmpresa = (start?: string, end?: string) => {
  return useQuery({
    queryKey: RELATORIO_KEYS.empresa(start, end),
    queryFn: async () => {
      const { data } = await apiClient.get<IVwVendasEmpresa[]>('/gestor/dashboard/relatorio/vendas-empresa', {
        params: getParams(start, end)
      });
      return data;
    }
  });
};

export const useRelatorioVendasCidade = (start?: string, end?: string) => {
  return useQuery({
    queryKey: RELATORIO_KEYS.cidade(start, end),
    queryFn: async () => {
      const { data } = await apiClient.get<IVwVendasCidade[]>('/gestor/dashboard/relatorio/vendas-cidade', {
        params: getParams(start, end)
      });
      return data;
    }
  });
};

export const useRelatorioComissoes = (start?: string, end?: string) => {
  return useQuery({
    queryKey: RELATORIO_KEYS.comissao(start, end),
    queryFn: async () => {
      const { data } = await apiClient.get<IVwComissaoCalculada[]>('/gestor/dashboard/relatorio/comissoes', {
        params: getParams(start, end)
      });
      return data;
    }
  });
};