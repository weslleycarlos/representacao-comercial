// /frontend/src/tipos/validacao.ts
import { z } from 'zod';

// Regex para validar o formato 00.000.000/0000-00
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// Regex para validar o formato 00000-000
const cepRegex = /^\d{5}-\d{3}$/;

// Validação para o formulário de Login
export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
  
  password: z.string()
    .min(1, { message: 'A senha é obrigatória.' })
});
// Exporta o tipo TypeScript inferido do schema Zod
export type LoginFormData = z.infer<typeof loginSchema>;

// Validação para o formulário de Empresa (Gestor)
export const empresaSchema = z.object({
  // Baseado no EmpresaCreate do Pydantic
  no_empresa: z.string().min(3, { message: 'O nome da empresa é obrigatório.' }),
  nr_cnpj: z.string()
    .min(18, { message: 'O CNPJ deve ter 18 caracteres.' })
    .regex(cnpjRegex, { message: 'Formato de CNPJ inválido.' }),
    // (Podemos adicionar uma validação de CNPJ real aqui depois)
  // Opcionais (baseado no EmpresaUpdate)
  nr_inscricao_estadual: z.string().optional(),
  ds_email_contato: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  nr_telefone_contato: z.string().optional(),
  ds_site: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
  pc_comissao_padrao: z.coerce.number()
    .min(0, { message: "Comissão não pode ser negativa." })
    .max(100, { message: "Comissão não pode ser maior que 100." })
    .optional(),
  fl_ativa: z.boolean().default(true),
});
// Exporta o tipo TypeScript inferido
export type EmpresaFormData = z.infer<typeof empresaSchema>;


// Validação para o formulário de Vendedor (Gestor)
export const vendedorSchema = z.object({
  // Baseado no VendedorCreate do Pydantic
  ds_email: z.string().min(1, "O email é obrigatório.").email("Email inválido."),
  // A senha só é obrigatória na criação, não na edição
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").optional().or(z.literal('')),
  no_completo: z.string().min(3, { message: 'O nome completo é obrigatório.' }),
  nr_telefone: z.string().optional().or(z.literal('')),
  fl_ativo: z.boolean().default(true),
});
// Exporta o tipo TypeScript inferido
export type VendedorFormData = z.infer<typeof vendedorSchema>;

// Validação para o formulário de Cliente (Gestor)
export const clienteSchema = z.object({
  // Baseado no ClienteCreate do Pydantic
  no_razao_social: z.string().min(3, { message: 'A Razão Social é obrigatória.' }),
  nr_cnpj: z.string()
    .min(18, { message: 'O CNPJ deve ter 18 caracteres.' })
    .regex(cnpjRegex, { message: 'Formato de CNPJ inválido.' }),
  
  // Opcionais
  no_fantasia: z.string().optional(),
  nr_inscricao_estadual: z.string().optional(),
  ds_email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  nr_telefone: z.string().optional().or(z.literal('')),
  ds_observacoes: z.string().optional().or(z.literal('')),
  fl_ativo: z.boolean().default(true),
});
// Exporta o tipo TypeScript inferido
export type ClienteFormData = z.infer<typeof clienteSchema>;

// Validação para o formulário de Endereço (Cliente)
export const enderecoSchema = z.object({
  tp_endereco: z.string().min(1, { message: "O tipo é obrigatório (ex: entrega, cobranca)." }),
  ds_logradouro: z.string().min(3, { message: 'O logradouro é obrigatório.' }),
  nr_endereco: z.string().optional().or(z.literal('')),
  ds_complemento: z.string().optional().or(z.literal('')),
  no_bairro: z.string().optional().or(z.literal('')),
  no_cidade: z.string().min(2, { message: "A cidade é obrigatória." }),
  sg_estado: z.string().length(2, { message: "O estado (UF) deve ter 2 caracteres." }),
  nr_cep: z.string()
    .min(9, { message: "O CEP deve ter 9 caracteres (00000-000)." })
    .regex(cepRegex, { message: "Formato de CEP inválido (00000-000)." }),
  fl_principal: z.boolean().default(false),
});
// Exporta o tipo TypeScript inferido
export type EnderecoFormData = z.infer<typeof enderecoSchema>;


// Validação para o formulário de Contato (Cliente)
export const contatoSchema = z.object({
  no_contato: z.string().min(3, { message: 'O nome do contato é obrigatório.' }),
  ds_cargo: z.string().optional().or(z.literal('')),
  ds_email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  nr_telefone: z.string().optional().or(z.literal('')),
  fl_principal: z.boolean().default(false),
});
// Exporta o tipo TypeScript inferido
export type ContatoFormData = z.infer<typeof contatoSchema>;


export const produtoSchema = z.object({
  cd_produto: z.string().min(1, "O código é obrigatório."),
  ds_produto: z.string().min(3, "A descrição é obrigatória."),
  sg_unidade_medida: z.string().optional().or(z.literal('')),
  fl_ativo: z.boolean().default(true),
  id_empresa: z.number().describe("A empresa é obrigatória."),
  id_categoria: z.coerce.number()
    .nullable()
    .optional()
    .transform(val => val === 0 ? null : val),
});
export type ProdutoFormData = z.infer<typeof produtoSchema>;


export const catalogoSchema = z.object({
  no_catalogo: z.string().min(3, "O nome do catálogo é obrigatório."),
  ds_descricao: z.string().optional().or(z.literal('')),
  dt_inicio_vigencia: z.preprocess((val) => (val === "" ? null : val), 
      z.coerce.date().optional().nullable()
  ),
  dt_fim_vigencia: z.preprocess((val) => (val === "" ? null : val), 
      z.coerce.date().optional().nullable()
  ),
  fl_ativo: z.boolean().default(true),
  id_empresa: z.number().describe("A empresa é obrigatória."),
});
export type CatalogoFormData = z.infer<typeof catalogoSchema>;

export const itemCatalogoSchema = z.object({
  id_produto: z.number().describe("O produto é obrigatório."),
  vl_preco_catalogo: z.coerce.number()
    .min(0.01, "O preço deve ser maior que zero."),
  fl_ativo_no_catalogo: z.boolean().default(true),
});
export type ItemCatalogoFormData = z.infer<typeof itemCatalogoSchema>;

// Este é o schema para UM item DENTRO do carrinho
export const itemPedidoSchema = z.object({
  id_produto: z.number().min(1, "Produto é obrigatório."),
  id_variacao: z.number().optional().nullable(),
  
  // (Dados que pegamos do catálogo, mas salvamos no formulário)
  cd_produto: z.string(), // Para exibição
  ds_produto: z.string(), // Para exibição
  vl_unitario_base: z.coerce.number(), // O preço (do catálogo + variação)
  
  // Dados que o usuário edita
  qt_quantidade: z.coerce.number().min(1, "Qtd. deve ser > 0"),
  pc_desconto_item: z.coerce.number().min(0).max(100).optional().default(0),
  
  // (vl_total_item será calculado)
});

export type ItemPedidoFormData = z.infer<typeof itemPedidoSchema>;

// Este é o schema para o formulário INTEIRO
export const pedidoCreateSchema = z.object({
  // Agora é obrigatório (não pode ser nulo ou opcional)
  id_cliente: z.number().min(1, "Selecione um cliente."),
  
  // (Campos de cadastro rápido removidos)
  
  id_endereco_entrega: z.number().min(1, "Endereço de entrega é obrigatório." ),
  id_endereco_cobranca: z.number().min(1, "Endereço de cobrança é obrigatório." ),
  id_forma_pagamento: z.number().min(1,"Forma de pagamento é obrigatória." ),
  
  pc_desconto: z.coerce.number().min(0).optional().default(0),
  ds_observacoes: z.string().optional().or(z.literal('')),
  
  itens: z.array(itemPedidoSchema).min(1, "O pedido deve ter pelo menos um item."),
});

export type PedidoCreateFormData = z.infer<typeof pedidoCreateSchema>;

// Validação para ATUALIZAR um Pedido (Vendedor)
// (Conforme o PRD, só podemos atualizar observações ou desconto)
export const pedidoUpdateSchema = z.object({
  ds_observacoes: z.string().optional().or(z.literal('')),
  pc_desconto: z.coerce.number().min(0).optional(),
});

export type PedidoUpdateFormData = z.infer<typeof pedidoUpdateSchema>;


// Validação para CANCELAR um Pedido (Vendedor)
export const pedidoCancelSchema = z.object({
  motivo: z.string().min(5, { message: "O motivo do cancelamento é obrigatório (mín. 5 caracteres)." }),
});

export type PedidoCancelRequestData = z.infer<typeof pedidoCancelSchema>;