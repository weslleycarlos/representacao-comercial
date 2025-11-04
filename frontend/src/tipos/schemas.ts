// /frontend/src/tipos/schemas.ts
// Este arquivo espelha os SCHEMAS de RESPOSTA do FastAPI (Pydantic)
// (Ele é muito similar ao auth.ts, mas focado nas respostas de CRUD)
import type { IEmpresa, IOrganizacao, IUsuario } from "./auth";

// --- Schemas de Empresa ---
export interface EmpresaCompletaSchema extends IEmpresa {
  nr_inscricao_estadual?: string;
  ds_email_contato?: string;
  nr_telefone_contato?: string;
  ds_site?: string;
  dt_criacao: string; // (JSON converte datetime para string ISO)
  dt_atualizacao: string;
}

export interface OrganizacaoSchema extends IOrganizacao{
  id_organizacao: number;
  no_organizacao: string;
  nr_cnpj?: string;
  st_assinatura?: string;
  tp_plano?: string;
}

export interface VendedorSchema extends IUsuario {
  // O VendedorSchema é um UsuarioSchema...
  // ...que também inclui a lista de empresas que ele representa.
  empresas_vinculadas: IEmpresa[]; 
  // (Se você preferir usar o EmpresaSchema aqui, também funciona, 
  // desde que EmpresaSchema esteja definido ANTES de VendedorSchema)
}