// /frontend/src/tipos/validacao.ts
import { z } from 'zod';

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
    .min(18, { message: 'O CNPJ deve ter 18 caracteres (com máscara).' })
    .max(18, { message: 'O CNPJ deve ter 18 caracteres (com máscara).' }),
    // (Podemos adicionar uma validação de CNPJ real aqui depois)
  
  // Opcionais (baseado no EmpresaUpdate)
  nr_inscricao_estadual: z.string().optional(),
  ds_email_contato: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  nr_telefone_contato: z.string().optional(),
  ds_site: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
  pc_comissao_padrao: z.coerce.number({ invalid_type_error: "Deve ser um número." })
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
  nr_telefone: z.string().optional(),
  fl_ativo: z.boolean().default(true),
});

// Exporta o tipo TypeScript inferido
export type VendedorFormData = z.infer<typeof vendedorSchema>;