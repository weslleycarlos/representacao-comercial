// /frontend/src/api/servicos/utilsService.ts
import { useMutation } from '@tanstack/react-query';
import apiClient from '../axios';

// --- MUTATIONS (para buscas sob demanda) ---

/**
 * Hook (useMutation) para consultar um CEP.
 * Retorna os dados do endereço.
 */
export const useConsultaCEP = () => {
  const consultaCEP = async (cep: string) => {
    // Remove qualquer máscara (deixa só números)
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      throw new Error("CEP deve ter 8 dígitos.");
    }
    
    const { data } = await apiClient.get(`/utils/cep/v1/${cepLimpo}`);
    return data;
  };

  return useMutation({
    mutationFn: consultaCEP,
    // (onError será tratado no componente que o chama)
  });
};

/**
 * Hook (useMutation) para consultar um CNPJ.
 * Retorna os dados da empresa (Razão Social, Fantasia, etc.)
 */
export const useConsultaCNPJ = () => {
  const consultaCNPJ = async (cnpj: string) => {
    // Remove qualquer máscara (deixa só números)
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      throw new Error("CNPJ deve ter 14 dígitos.");
    }

    const { data } = await apiClient.get(`/utils/cnpj/v1/${cnpjLimpo}`);
    return data;
  };

  return useMutation({
    mutationFn: consultaCNPJ,
  });
};