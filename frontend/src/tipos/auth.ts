// /frontend/src/tipos/auth.ts

// Espelha o OrganizacaoSchema do FastAPI
export interface IOrganizacao {
  id_organizacao: number;
  no_organizacao: string;
  nr_cnpj?: string;
  st_assinatura?: string;
  tp_plano?: string;
}

// Espelha o EmpresaSchema do FastAPI
export interface IEmpresa {
  id_empresa: number;
  id_organizacao: number;
  no_empresa: string;
  nr_cnpj: string;
  pc_comissao_padrao: number;
  fl_ativa: boolean;
}

// Espelha o UsuarioSchema do FastAPI
export interface IUsuario {
  id_usuario: number;
  id_organizacao?: number;
  ds_email: string;
  tp_usuario: 'super_admin' | 'gestor' | 'vendedor';
  no_completo?: string;
  nr_telefone?: string;
  fl_ativo: boolean;
  dt_ultimo_acesso?: string;
}

// Espelha o LoginResponse do FastAPI
export interface ILoginResponse {
  token: {
    access_token: string;
    token_type: string;
  };
  usuario: IUsuario;
  organizacao?: IOrganizacao;
  empresas_vinculadas: IEmpresa[];
}

// Define o que vamos armazenar em nosso Contexto de Autenticação
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