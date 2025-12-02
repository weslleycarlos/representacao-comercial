// /frontend/src/tipos/schemas.ts
// ARQUIVO MESTRE
// A única fonte de verdade para todos os tipos de dados da API (Pydantic Schemas).

// ============================================
// TIPOS BASE (Usuário, Empresa, Org)
// ============================================

export interface IOrganizacao {
  id_organizacao: number;
  no_organizacao: string;
  nr_cnpj?: string;
  st_assinatura?: string;
  tp_plano?: string;
}

export interface IOrganizacaoDetalhada extends IOrganizacao {
  gestores: IUsuario[];
}

export interface IEmpresa {
  id_empresa: number;
  id_organizacao: number;
  no_empresa: string;
  nr_cnpj: string;
  pc_comissao_padrao: number;
  fl_ativa: boolean;
}

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

export interface IVendedor extends IUsuario {
  // Um Vendedor é um IUsuario + suas empresas
  empresas_vinculadas: IEmpresa[];
}

// ============================================
// TIPOS COMPOSTOS (Respostas de API)
// ============================================




export interface IEmpresaCompleta extends IEmpresa {
  nr_inscricao_estadual?: string;
  ds_email_contato?: string;
  nr_telefone_contato?: string;
  ds_site?: string;
  dt_criacao: string;
  dt_atualizacao: string;
}

// --- Clientes ---
export interface IEndereco {
  id_endereco: number;
  id_cliente: number;
  tp_endereco: string;
  ds_logradouro: string;
  nr_endereco?: string;
  ds_complemento?: string;
  no_bairro?: string;
  no_cidade: string;
  sg_estado: string;
  nr_cep: string;
  fl_principal: boolean;
}

export interface IContato {
  id_contato: number;
  id_cliente: number;
  no_contato: string;
  ds_cargo?: string;
  ds_email?: string;
  nr_telefone?: string;
  fl_principal: boolean;
}

export interface ICliente {
  id_cliente: number;
  id_organizacao: number;
  nr_cnpj: string;
  no_razao_social: string;
  // ... (outros campos base)
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface IClienteCompleto extends ICliente {
  enderecos: IEndereco[];
  contatos: IContato[];
}

// --- Catálogo e Produtos (REVISADOS) ---

export interface ICategoriaProduto {
  id_categoria: number;
  id_organizacao: number;
  no_categoria: string;
  id_categoria_pai?: number;
}

export interface IVariacaoProduto {
  id_variacao: number;
  id_produto: number;
  ds_tamanho?: string;
  ds_cor?: string;
  cd_sku?: string;
  vl_ajuste_preco: number; // Decimal vira number
  qt_estoque: number;
  fl_ativa: boolean;
}

export interface IProduto {
  // (Este é o "DNA" do produto - SEM PREÇO)
  id_produto: number;
  id_empresa: number;
  id_categoria?: number;
  cd_produto: string;
  ds_produto: string;
  sg_unidade_medida?: string;
  fl_ativo: boolean;
  dt_criacao: string;
}

export interface IProdutoSimples extends IProduto {
  variacoes: IVariacaoProduto[];
  categoria?: ICategoriaProduto;
}

export interface IProdutoCompleto extends IProduto {
  variacoes: IVariacaoProduto[];
  categoria?: ICategoriaProduto;
  // listas_de_preco: IItemCatalogo[]; // (Adicionado abaixo)
}

export interface ICatalogo {
  id_catalogo: number;
  id_empresa: number;
  no_catalogo: string;
  ds_descricao?: string;
  dt_inicio_vigencia?: string;
  dt_fim_vigencia?: string;
  fl_ativo: boolean;
}

export interface IItemCatalogo {
  id_item_catalogo: number;
  id_catalogo: number;
  id_produto: number;
  vl_preco_catalogo: number;
  fl_ativo_no_catalogo: boolean;
  produto?: IProdutoSimples;
}

export interface IItemCatalogoAninhado {
  // (Este é o 'ItemCatalogoAninhadoSchema' do backend)
  // (É igual ao IItemCatalogo, mas SEM o 'produto')
  id_item_catalogo: number;
  id_catalogo: number;
  id_produto: number;
  vl_preco_catalogo: number;
  fl_ativo_no_catalogo: boolean;
}

// (Adicionando o relacionamento que faltava no IProdutoCompleto)
export interface IProdutoCompleto extends IProduto {
  variacoes: IVariacaoProduto[];
  categoria?: ICategoriaProduto;
  listas_de_preco: IItemCatalogoAninhado[];
}

export interface IItemCatalogoVenda {
  // (Este é o schema que o VENDEDOR vê no catálogo)
  id_item_catalogo: number;
  id_catalogo: number;
  vl_preco_catalogo: number;
  fl_ativo_no_catalogo: boolean;

  // O produto aninhado (com suas variações)
  produto: IProdutoCompleto;
}

export interface IFormaPagamento {
  id_forma_pagamento: number;
  id_organizacao?: number;
  no_forma_pagamento: string;
  fl_permite_parcelamento: boolean;
  qt_maximo_parcelas: number;
  fl_ativa: boolean;
}

export interface IRegraComissao {
  id_regra_comissao: number;
  id_organizacao: number;
  pc_comissao: number;
  nr_prioridade: number;
  fl_ativa: boolean;
  dt_inicio_vigencia?: string;
  dt_fim_vigencia?: string;

  // Relacionamentos (opcionais, dependendo da query)
  id_empresa?: number;
  id_usuario?: number;
  empresa?: IEmpresa;
  usuario?: IUsuario;
}

export interface IItemPedido {
  id_item_pedido: number;
  id_produto: number;
  id_variacao?: number;
  qt_quantidade: number;
  vl_unitario: number;
  pc_desconto_item: number;
  vl_total_item: number;
  produto?: IProduto;
}

export interface IPedidoCompleto {
  id_pedido: number;
  id_usuario: number;
  id_empresa: number;
  id_cliente: number;
  nr_pedido?: string;
  st_pedido: string;
  vl_total: number;
  dt_pedido: string;
  ds_observacoes?: string;

  // Relacionamentos Aninhados
  cliente: ICliente;
  vendedor: IUsuario;
  empresa: IEmpresa;
  endereco_entrega?: IEndereco;
  endereco_cobranca?: IEndereco;
  forma_pagamento?: IFormaPagamento;
  itens: IItemPedido[];
  // comissoes: IComissaoPedido[]; // (Se precisarmos)
}

// JSON helper types
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export interface ILogAuditoria {
  id_log: number; // (BigInteger vira number)
  id_organizacao?: number;
  id_usuario?: number;
  tp_entidade: string;
  id_entidade: number;
  tp_acao: string;
  ds_valores_antigos?: JsonValue; // JSON
  ds_valores_novos?: JsonValue; // JSON
  ds_endereco_ip?: string;
  dt_acao: string;

  usuario?: IUsuario; // (Schema simplificado)
}
// /frontend/src/tipos/schemas.ts
// Substitui $PLACEHOLDER$
// Tipos/Helpers para lidar com JSON vindo do DB (SQLite pode retornar string)
export type DbJson = string | JsonValue | null;

export function parseDbJson<T extends JsonValue = JsonValue>(v: DbJson): T | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

// Exemplo de mapeamento seguro de uma linha do DB para ILogAuditoria
export function mapRowToLogAuditoria(row: Record<string, unknown>): ILogAuditoria {
  return {
    id_log: Number(row['id_log']),
    id_organizacao: row['id_organizacao'] ? Number(row['id_organizacao']) : undefined,
    id_usuario: row['id_usuario'] ? Number(row['id_usuario']) : undefined,
    tp_entidade: String(row['tp_entidade']),
    id_entidade: Number(row['id_entidade']),
    tp_acao: String(row['tp_acao']),
    ds_valores_antigos: parseDbJson(row['ds_valores_antigos'] as DbJson),
    ds_valores_novos: parseDbJson(row['ds_valores_novos'] as DbJson),
    ds_endereco_ip: row['ds_endereco_ip'] ? String(row['ds_endereco_ip']) : undefined,
    dt_acao: String(row['dt_acao']),
    usuario: (row['usuario'] as unknown) as IUsuario | undefined,
  };
}

// ============================================
// TIPOS DE AUTENTICAÇÃO (Tokens e Respostas)
// ============================================

export interface IToken {
  access_token: string;
  token_type: string;
}

export interface ISelectCompanyResponse {
  token: IToken;
  empresa_ativa: IEmpresa;
}

// ============================================
// TIPOS DE DASHBOARD (Respostas das Views)
// ============================================

export interface IVwVendasVendedor {
  id_usuario: number;
  no_vendedor?: string;
  dt_mes_referencia: string;
  qt_pedidos: number;
  vl_total_vendas: number;
  vl_ticket_medio: number;
}

export interface IVwComissaoCalculada {
  id_pedido: number;
  nr_pedido?: string;
  no_vendedor?: string;
  no_empresa?: string;
  vl_total: number;
  pc_comissao_aplicada: number;
  vl_comissao_calculada: number;
  dt_pedido: string;
}

export interface IVwVendasEmpresa {
  id_empresa: number;
  no_empresa?: string;
  id_organizacao: number;
  dt_mes_referencia: string;
  qt_pedidos: number;
  vl_total_vendas: number;
  qt_clientes_atendidos: number;
}

export interface IVwVendasCidade {
  no_cidade: string;
  sg_estado: string;
  id_organizacao: number;
  dt_mes_referencia: string;
  qt_pedidos: number;
  vl_total_vendas: number;
}

// ============================================
// TIPOS DE KPI (Respostas dos Dashboards)
// ============================================

export interface IAdminDashboardKpi {
  total_organizacoes_ativas: number;
  total_organizacoes_suspensas: number;
  total_gestores_ativos: number;
  total_vendedores_ativos: number;
  total_pedidos_sistema: number;
  valor_total_pedidos_sistema: number;
}

export interface IGestorDashboardKpi {
  vendas_mes_atual: number;
  pedidos_mes_atual: number;
  ticket_medio_mes_atual: number;
  clientes_atendidos_mes_atual: number;
  comissoes_pendentes_mes_atual: number;
}

export interface IVendedorDashboardKpi {
  vendas_mes_atual: number;
  comissao_mes_atual: number;
  pedidos_mes_atual: number;
  ticket_medio_mes_atual: number;
}