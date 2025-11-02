// Local do arquivo: src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { api, authService } from '../lib/api'; // Garanta que 'api' está importado

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]); // A lista de empresas do usuário
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  // ESTE É O ÚNICO useEffect NECESSÁRIO PARA A AUTENTICAÇÃO INICIAL
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get("/auth/me"); // Chamada para a rota /me
        
        // Agora populamos tudo de uma vez com a resposta unificada
        setUser(response.data.user);
        setCompany(response.data.company);
        setCompanies(response.data.companies || []); // Recebe a lista de empresas

      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log("Usuário não autenticado.");
        } else {
          console.error("Erro ao verificar autenticação:", error);
        }
        // Limpa tudo em caso de erro
        setUser(null);
        setCompany(null);
        setCompanies([]);
      } finally {
        setLoading(false);
        setInitialAuthCheckComplete(true);
      }
    };

    checkAuthStatus();
  }, []);

  // O resto das suas funções (login, logout, selectCompany) continua aqui...
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      setCompanies(response.data.companies || []);
      // Após o login, a seleção de empresa irá acontecer, então não definimos a empresa aqui.
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setCompany(null);
      setCompanies([]);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };
  
  const selectCompany = async (companyId) => {
    setError(null);
    try {
      const response = await api.post('/auth/select-company', { company_id: companyId });
      setCompany(response.data.company);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao selecionar empresa.');
      throw err;
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      company,
      companies,
      loading,
      error,
      login,
      logout,
      selectCompany,
      initialAuthCheckComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
};