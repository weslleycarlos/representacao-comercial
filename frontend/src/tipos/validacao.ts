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

// Exporta o tipo TypeScript inferido
export type ClienteFormData = z.infer<typeof clienteSchema>;

// Exporta o tipo TypeScript inferido
export type EnderecoFormData = z.infer<typeof enderecoSchema>;