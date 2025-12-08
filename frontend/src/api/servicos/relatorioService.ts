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

/**
 * Hook para obter série de vendas por mês (últimos 12 meses)
 * Retorna array com { mes: string, valor: number } para usar em gráficos
 */
export const useEvolucaoVendasMensal = () => {
  return useQuery({
    queryKey: ['evolucaoVendasMensal'],
    queryFn: async () => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const months: Array<{ mes: string; valor: number }> = [];

      // Gera datas para últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesLabel = monthNames[d.getMonth()];

        const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
        const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
        const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

        try {
          const { data } = await apiClient.get<IVwVendasEmpresa[]>('/gestor/dashboard/relatorio/vendas-empresa', {
            params: { start_date: startStr, end_date: endStr }
          });

          const total = (data || []).reduce((s, r) => s + Number(r.vl_total_vendas || 0), 0);
          console.log(`[Evolução Vendas] ${mesLabel} (${startStr} até ${endStr}): ${data?.length || 0} registros, total = ${total}`);
          months.push({ mes: mesLabel, valor: total });
        } catch (err) {
          // Se erro, coloca 0 para o mês
          console.error(`[Evolução Vendas] Erro ao buscar ${mesLabel}:`, err);
          months.push({ mes: mesLabel, valor: 0 });
        }
      }

      return months;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
};