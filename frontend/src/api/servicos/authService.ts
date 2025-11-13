// /frontend/src/api/servicos/authService.ts
import { useMutation } from '@tanstack/react-query';
import { type AxiosError } from 'axios';
import apiClient from '../axios';
import type { ILoginResponse } from '../../tipos/auth';
import type { LoginFormData } from '../../tipos/validacao';

// --- MUTATION (Hook para POST/PUT/DELETE) ---

/**
 * Hook customizado (useMutation) para realizar o login.
 * Ele gerencia o loading, error, e o sucesso da chamada.
 */
export const useLogin = () => {
  const loginMutation = async (loginData: LoginFormData): Promise<ILoginResponse> => {
    // O Axios serializa 'loginData' para JSON automaticamente
    const { data } = await apiClient.post<ILoginResponse>('/auth/login', loginData);
    return data;
  };

  return useMutation<ILoginResponse, AxiosError<{ detail: string }>, LoginFormData>({
    mutationFn: loginMutation,
    // (Lógica 'onSuccess' ou 'onError' pode ser adicionada aqui ou na página)
  });
};

export const useSelectCompany = () => {
  // (Não precisamos invalidar caches aqui, pois a UI irá recarregar)
  
  const selectCompany = async (idEmpresa: number): Promise<ISelectCompanyResponse> => {
    const { data } = await apiClient.post('/auth/select-company', {
      id_empresa: idEmpresa,
    });
    return data;
  };

  return useMutation({
    mutationFn: selectCompany,
    // (onSuccess será tratado na página)
  });
};

// (Futuramente, adicionaremos aqui 'useSelectCompany' e 'useGetMe')