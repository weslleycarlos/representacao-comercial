// /frontend/src/tipos/auth.ts
// Este arquivo define APENAS os tipos para o PROCESSO de autenticação.

import type { 
  IUsuario, 
  IOrganizacao, 
  IEmpresa 
} from './schemas'; // Importa os tipos base do nosso arquivo mestre

// 1. Espelha o LoginResponse do FastAPI
export interface ILoginResponse {
  token: {
    access_token: string;
    token_type: string;
  };
  usuario: IUsuario;
  organizacao?: IOrganizacao;
  empresas_vinculadas: IEmpresa[];
}

// 2. Define o que vamos armazenar em nosso Contexto de Autenticação
export interface IAuthContext {
  usuario: IUsuario | null;
  organizacao: IOrganizacao | null;
  empresaAtiva: IEmpresa | null;
  empresasVinculadas: IEmpresa[];
  token: string | null;
  estaLogado: boolean;
  login: (data: ILoginResponse) => void;
  logout: () => void;
  selecionarEmpresa: (empresa: IEmpresa, novoToken: string) => void;
}