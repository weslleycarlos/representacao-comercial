// /frontend/src/api/axios.ts
import axios from 'axios';

// 1. Define a URL base da nossa API (do backend FastAPI)
//    (O Vite carrega automaticamente variáveis de .env com prefixo VITE_)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

// 2. Cria a instância principal do Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. (Futuro) Interceptor para anexar o Token JWT
//    Vamos implementar isso quando fizermos a página de Login.

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Busca o token salvo
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export default apiClient;