// /frontend/src/tipos/validacao.ts
import { z } from 'zod';

// Regex para validar o formato 00.000.000/0000-00
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// Regex para validar o formato 00000-000
const cepRegex = /^\d{5}-\d{3}$/;

// Regex para telefone brasileiro (com DDD)
const telefoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

// Validação para o formulário de Login
export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
  
  password: z.string()
    .min(1, { message: 'A senha é obrigatória.' })
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Validação para o formulário de Empresa (Gestor)
export const empresaSchema = z.object({ // ✅ CORRIGIDO: removido 'e' extra
  no_empresa: z.string().min(3, { message: 'O nome da empresa é obrigatório (mín. 3 caracteres).' }),
  nr_cnpj: z.string()
    .min(18, { message: 'O CNPJ deve ter 18 caracteres.' })
    .regex(cnpjRegex, { message: 'Formato de CNPJ inválido (use: 00.000.000/0000-00).' }),
  
  nr_inscricao_estadual: z.string().nullable().optional().or(z.literal('')),
  ds_email_contato: z.string()
    .email({ message: 'Email de contato inválido.' })
    .nullable()
    .optional()
    .or(z.literal('')),
  nr_telefone_contato: z.string()
    .regex(telefoneRegex, { message: 'Formato de telefone inválido.' })
    .nullable()
    .optional()
    .or(z.literal('')),
  ds_site: z.string()
    .url({ message: 'URL do site inválida.' })
    .nullable()
    .optional()
    .or(z.literal(''))
    .or(z.literal('')),
  
  pc_comissao_padrao: z.coerce.number()
    .min(0, { message: 'Comissão não pode ser negativa.' })
    .max(100, { message: 'Comissão não pode ser maior que 100%.' })
    .optional()
    .default(0),
  fl_ativa: z.boolean().default(true),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;

// Validação para o formulário de Vendedor (Gestor)
export const vendedorSchema = z.object({
  ds_email: z.string()
    .min(1, "O email é obrigatório.")
    .email("Por favor, insira um email válido."),
  password: z.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
    .optional()
    .or(z.literal('')),
  no_completo: z.string()
    .min(3, { message: 'O nome completo é obrigatório (mín. 3 caracteres).' })
    .max(100, { message: 'Nome muito longo (máx. 100 caracteres).' }),
  nr_telefone: z.string()
    .regex(telefoneRegex, { message: 'Formato de telefone inválido.' })
    .optional()
    .or(z.literal('')),
  fl_ativo: z.boolean().default(true),
});

export type VendedorFormData = z.infer<typeof vendedorSchema>;

// Validação para o formulário de Cliente (Gestor)
export const clienteSchema = z.object({
  no_razao_social: z.string()
    .min(3, { message: 'A Razão Social é obrigatória (mín. 3 caracteres).' })
    .max(150, { message: 'Razão Social muito longa (máx. 150 caracteres).' }),
  nr_cnpj: z.string()
    .min(18, { message: 'O CNPJ deve ter 18 caracteres.' })
    .regex(cnpjRegex, { message: 'Formato de CNPJ inválido (use: 00.000.000/0000-00).' }),
  
  no_fantasia: z.string()
    .max(150, { message: 'Nome Fantasia muito longo (máx. 150 caracteres).' })
    .optional()
    .or(z.literal('')),
  nr_inscricao_estadual: z.string().optional().or(z.literal('')),
  ds_email: z.string()
    .email({ message: 'Email inválido.' })
    .optional()
    .or(z.literal('')),
  nr_telefone: z.string()
    .regex(telefoneRegex, { message: 'Formato de telefone inválido.' })
    .optional()
    .or(z.literal('')),
  ds_observacoes: z.string()
    .max(500, { message: 'Observações muito longas (máx. 500 caracteres).' })
    .optional()
    .or(z.literal('')),
  fl_ativo: z.boolean().default(true),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// Validação para o formulário de Endereço (Cliente)
export const enderecoSchema = z.object({
  tp_endereco: z.string()
    .min(1, { message: "O tipo é obrigatório (ex: entrega, cobrança)." }),
  ds_logradouro: z.string()
    .min(3, { message: 'O logradouro é obrigatório (mín. 3 caracteres).' })
    .max(200, { message: 'Logradouro muito longo (máx. 200 caracteres).' }),
  nr_endereco: z.string()
    .max(20, { message: 'Número muito longo (máx. 20 caracteres).' })
    .optional()
    .or(z.literal('')),
  ds_complemento: z.string()
    .max(100, { message: 'Complemento muito longo (máx. 100 caracteres).' })
    .optional()
    .or(z.literal('')),
  no_bairro: z.string()
    .max(100, { message: 'Bairro muito longo (máx. 100 caracteres).' })
    .optional()
    .or(z.literal('')),
  no_cidade: z.string()
    .min(2, { message: "A cidade é obrigatória (mín. 2 caracteres)." })
    .max(100, { message: 'Cidade muito longa (máx. 100 caracteres).' }),
  sg_estado: z.string()
    .length(2, { message: "O estado (UF) deve ter exatamente 2 caracteres." })
    .toUpperCase(),
  nr_cep: z.string()
    .min(9, { message: "O CEP deve ter 9 caracteres (00000-000)." })
    .regex(cepRegex, { message: "Formato de CEP inválido (use: 00000-000)." }),
  fl_principal: z.boolean().default(false),
});

export type EnderecoFormData = z.infer<typeof enderecoSchema>;

// Validação para o formulário de Contato (Cliente)
export const contatoSchema = z.object({
  no_contato: z.string()
    .min(3, { message: 'O nome do contato é obrigatório (mín. 3 caracteres).' })
    .max(100, { message: 'Nome muito longo (máx. 100 caracteres).' }),
  ds_cargo: z.string()
    .max(100, { message: 'Cargo muito longo (máx. 100 caracteres).' })
    .optional()
    .or(z.literal('')),
  ds_email: z.string()
    .email({ message: 'Email inválido.' })
    .optional()
    .or(z.literal('')),
  nr_telefone: z.string()
    .regex(telefoneRegex, { message: 'Formato de telefone inválido.' })
    .optional()
    .or(z.literal('')),
  fl_principal: z.boolean().default(false),
});

export type ContatoFormData = z.infer<typeof contatoSchema>;

// Validação para Produto
export const produtoSchema = z.object({
  cd_produto: z.string()
    .min(1, "O código é obrigatório.")
    .max(50, "Código muito longo (máx. 50 caracteres)."),
  ds_produto: z.string()
    .min(3, "A descrição é obrigatória (mín. 3 caracteres).")
    .max(200, "Descrição muito longa (máx. 200 caracteres)."),
  sg_unidade_medida: z.string()
    .max(10, "Unidade de medida muito longa (máx. 10 caracteres).")
    .optional()
    .or(z.literal('')),
  fl_ativo: z.boolean().default(true),
  id_empresa: z.number().min(1, "A empresa é obrigatória."),
  id_categoria: z.coerce.number()
    .nullable()
    .optional()
    .transform(val => val === 0 ? null : val),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;

// Validação para Catálogo
export const catalogoSchema = z.object({
  no_catalogo: z.string()
    .min(3, "O nome do catálogo é obrigatório (mín. 3 caracteres).")
    .max(100, "Nome do catálogo muito longo (máx. 100 caracteres)."),
  ds_descricao: z.string()
    .max(500, "Descrição muito longa (máx. 500 caracteres).")
    .nullable()
    .optional()
    .or(z.literal('')),
  
  dt_inicio_vigencia: z.coerce.date().nullable().optional(),
  dt_fim_vigencia: z.coerce.date().nullable().optional(),

  fl_ativo: z.boolean().default(true),
  id_empresa: z.number().min(1, "A empresa é obrigatória."),
}).refine((data) => {
  if (data.dt_fim_vigencia && data.dt_inicio_vigencia) {
    return data.dt_fim_vigencia >= data.dt_inicio_vigencia;
  }
  return true;
}, {
  message: "A data final deve ser posterior ou igual à data inicial.",
  path: ["dt_fim_vigencia"],
});

export type CatalogoFormData = z.infer<typeof catalogoSchema>;

// Validação para Item do Catálogo
export const itemCatalogoSchema = z.object({
  id_produto: z.number().min(1, "O produto é obrigatório."),
  vl_preco_catalogo: z.coerce.number()
    .min(0.01, "O preço deve ser maior que zero.")
    .max(999999.99, "Preço muito alto."),
  fl_ativo_no_catalogo: z.boolean().default(true),
});

export type ItemCatalogoFormData = z.infer<typeof itemCatalogoSchema>;

// Schema para item do pedido
export const itemPedidoSchema = z.object({
  id_produto: z.number().min(1, "Produto é obrigatório."),
  id_variacao: z.number().optional().nullable(),
  
  cd_produto: z.string(),
  ds_produto: z.string(),
  vl_unitario_base: z.coerce.number()
    .min(0.01, "Preço unitário deve ser maior que zero."),
  
  qt_quantidade: z.coerce.number()
    .min(1, "Quantidade deve ser maior que zero.")
    .max(9999, "Quantidade muito alta."),
  pc_desconto_item: z.coerce.number()
    .min(0, "Desconto não pode ser negativo.")
    .max(100, "Desconto não pode ser maior que 100%.")
    .optional()
    .default(0),
});

export type ItemPedidoFormData = z.infer<typeof itemPedidoSchema>;

// Schema para criação de pedido
export const pedidoCreateSchema = z.object({
  id_catalogo: z.number().min(1,"Selecione um catálogo."),
  id_cliente: z.number().min(1, "Selecione um cliente."),
  
  id_endereco_entrega: z.number().min(1, "Endereço de entrega é obrigatório."),
  id_endereco_cobranca: z.number().min(1, "Endereço de cobrança é obrigatório."),
  id_forma_pagamento: z.number().min(1, "Forma de pagamento é obrigatória."),
  
  pc_desconto: z.coerce.number()
    .min(0, "Desconto não pode ser negativo.")
    .max(100, "Desconto não pode ser maior que 100%.")
    .optional()
    .default(0),
  ds_observacoes: z.string()
    .max(500, "Observações muito longas (máx. 500 caracteres).")
    .optional()
    .or(z.literal('')),
  
  itens: z.array(itemPedidoSchema).min(1, "O pedido deve ter pelo menos um item."),
});

export type PedidoCreateFormData = z.infer<typeof pedidoCreateSchema>;

// Validação para atualização de pedido
export const pedidoUpdateSchema = z.object({
  ds_observacoes: z.string()
    .max(500, "Observações muito longas (máx. 500 caracteres).")
    .optional()
    .or(z.literal('')),
  pc_desconto: z.coerce.number()
    .min(0, "Desconto não pode ser negativo.")
    .max(100, "Desconto não pode ser maior que 100%.")
    .optional(),
});

export type PedidoUpdateFormData = z.infer<typeof pedidoUpdateSchema>;

// Validação para cancelamento de pedido
export const pedidoCancelSchema = z.object({
  motivo: z.string()
    .min(5, { message: "O motivo do cancelamento é obrigatório (mín. 5 caracteres)." })
    .max(500, { message: "Motivo muito longo (máx. 500 caracteres)." }),
});

export type PedidoCancelRequestData = z.infer<typeof pedidoCancelSchema>;

// Validação para MUDANÇA DE STATUS (Gestor)
export const pedidoStatusSchema = z.object({
  novo_status: z.string().min(1, "Selecione um status."),
  // (O backend adiciona a observação de auditoria automaticamente, 
  // mas se quisermos permitir uma obs manual, adicionaríamos aqui)
});

export type PedidoStatusFormData = z.infer<typeof pedidoStatusSchema>;

// ============================================
// Validação: Configurações (Gestor)
// ============================================

// 1. Forma de Pagamento
export const formaPagamentoSchema = z.object({
  no_forma_pagamento: z.string().min(3, "O nome é obrigatório (mín. 3 caracteres)."),
  fl_permite_parcelamento: z.boolean().default(false),
  qt_maximo_parcelas: z.coerce.number()
    .min(1, "O mínimo é 1 parcela.")
    .max(24, "O máximo permitido é 24 parcelas.")
    .default(1),
  fl_ativa: z.boolean().default(true),
});

export type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>;

// 2. Regra de Comissão
export const regraComissaoSchema = z.object({
  pc_comissao: z.coerce.number({ invalid_type_error: "Comissão é obrigatória" })
    .min(0, "A comissão não pode ser negativa.")
    .max(100, "A comissão não pode ser maior que 100%."),
    
  // Pode ser nulo (significa "Todas as Empresas" ou "Todos os Vendedores")
  id_empresa: z.coerce.number().nullable().optional().transform(v => v === 0 ? null : v),
  id_usuario: z.coerce.number().nullable().optional().transform(v => v === 0 ? null : v),
  
  nr_prioridade: z.coerce.number().default(0),
  
  dt_inicio_vigencia: z.coerce.date().nullable().optional(),
  dt_fim_vigencia: z.coerce.date().nullable().optional(),
  
  fl_ativa: z.boolean().default(true),
}).refine((data) => {
  if (data.dt_inicio_vigencia && data.dt_fim_vigencia) {
    return data.dt_fim_vigencia >= data.dt_inicio_vigencia;
  }
  return true;
}, {
  message: "A data final deve ser posterior à data inicial.",
  path: ["dt_fim_vigencia"],
});

export type RegraComissaoFormData = z.infer<typeof regraComissaoSchema>;


// ============================================
// Validação: Super Admin
// ============================================

// Schema para o Gestor Inicial (aninhado na criação da organização)
const adminGestorSchema = z.object({
  ds_email: z.string().email("Email inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  no_completo: z.string().min(3, "Nome obrigatório."),
  nr_telefone: z.string().optional().or(z.literal('')),
});

// Schema para Criar/Editar Organização
export const adminOrganizacaoSchema = z.object({
  no_organizacao: z.string().min(3, "Nome da organização é obrigatório."),
  nr_cnpj: z.string()
    .min(14, "CNPJ inválido.") // (Pode usar o regex de CNPJ aqui se quiser)
    .optional().or(z.literal('')),
  
  tp_plano: z.string().min(1, "Selecione um plano."),
  
  st_assinatura: z.string().optional().default('ativo'), // Para edição
  
  qt_limite_usuarios: z.coerce.number().min(1, "Mínimo 1 usuário."),
  qt_limite_empresas: z.coerce.number().min(1, "Mínimo 1 empresa."),
  
  // O campo 'gestor' é obrigatório apenas na criação
  gestor: adminGestorSchema.optional(),
});

export type AdminOrganizacaoFormData = z.infer<typeof adminOrganizacaoSchema>;