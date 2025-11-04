// /frontend/src/api/servicos/authService.ts
import { useMutation } from '@tanstack/react-query';
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

  return useMutation({
    mutationFn: loginMutation,
    // (Lógica 'onSuccess' ou 'onError' pode ser adicionada aqui ou na página)
  });
};

// (Futuramente, adicionaremos aqui 'useSelectCompany' e 'useGetMe')