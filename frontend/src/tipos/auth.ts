// /frontend/src/tipos/auth.ts
// Este arquivo define APENAS os tipos para o PROCESSO de autenticação.

import type { 
  IUsuario, 
  IOrganizacao, 
  IEmpresa,
  IToken
} from './schemas';

// 1. Espelha o LoginResponse do FastAPI
export interface ILoginResponse {
  token: IToken; // <-- Usa o tipo importado
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
  token: string | null; // (O token JWT é armazenado como string)
  estaLogado: boolean;
  login: (data: ILoginResponse) => void;
  logout: () => void;
  selecionarEmpresa: (empresa: IEmpresa, novoToken: string) => void;
}