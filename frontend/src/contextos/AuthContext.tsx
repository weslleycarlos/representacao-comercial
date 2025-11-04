// /frontend/src/contextos/AuthContext.tsx
import { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import type { IAuthContext, ILoginResponse, IUsuario, IOrganizacao, IEmpresa } from '../tipos/auth';
import apiClient from '../api/axios'; // Importa nosso cliente Axios

// 1. Cria o Contexto
const AuthContext = createContext<IAuthContext | undefined>(undefined);

// 2. Cria o Provedor (o componente que vai "abraçar" a aplicação)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<IUsuario | null>(null);
  const [organizacao, setOrganizacao] = useState<IOrganizacao | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<IEmpresa | null>(null);
  const [empresasVinculadas, setEmpresasVinculadas] = useState<IEmpresa[]>([]);
  const [token, setToken] = useState<string | null>(() => {
    // Tenta carregar o token do localStorage ao iniciar
    return localStorage.getItem('authToken');
  });

  const estaLogado = !!token;

  // Efeito para configurar o Axios quando o token mudar
  useEffect(() => {
    if (token) {
      // Salva o token para persistir o login
      localStorage.setItem('authToken', token);
      // Configura o cabeçalho padrão do Axios
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Remove o token se deslogar
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Função chamada pela página de Login
  const login = (data: ILoginResponse) => {
    setUsuario(data.usuario);
    setOrganizacao(data.organizacao || null);
    setEmpresasVinculadas(data.empresas_vinculadas || []);
    setToken(data.token.access_token);
    // (empresaAtiva começa como null no login inicial)
    setEmpresaAtiva(null); 
  };

  // Função chamada ao deslogar
  const logout = () => {
    setUsuario(null);
    setOrganizacao(null);
    setEmpresaAtiva(null);
    setEmpresasVinculadas([]);
    setToken(null);
    // (O useEffect acima cuidará de limpar o localStorage e o Axios)
  };
  
  // Função chamada após o Vendedor selecionar a empresa
  const selecionarEmpresa = (empresa: IEmpresa, novoToken: string) => {
    setEmpresaAtiva(empresa);
    setToken(novoToken); // Atualiza o token para o novo (com a empresa ativa)
  };

  const valor = {
    usuario,
    organizacao,
    empresaAtiva,
    empresasVinculadas,
    token,
    estaLogado,
    login,
    logout,
    selecionarEmpresa,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

// 3. Cria o Hook customizado (para facilitar o uso)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};