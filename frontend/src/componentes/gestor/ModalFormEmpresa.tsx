// /frontend/src/componentes/gestor/ModalFormEmpresa.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Box
} from '@mui/material';

import { type EmpresaFormData, empresaSchema } from '../../tipos/validacao';
import type { EmpresaCompletaSchema } from '../../tipos/schemas';
import { useCreateEmpresa, useUpdateEmpresa } from '../../api/servicos/empresaService';

// Props que o modal receberá
interface ModalFormEmpresaProps {
  open: boolean;
  onClose: () => void;
  // Se 'empresa' for fornecido, estamos editando. Se for null/undefined, estamos criando.
  empresa?: EmpresaCompletaSchema;
}

export const ModalFormEmpresa: React.FC<ModalFormEmpresaProps> = ({ open, onClose, empresa }) => {
  const isEditMode = !!empresa; // Estamos em modo de edição?

  // 1. Configuração do Formulário (React Hook Form + Zod)
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset, // Para limpar o formulário ou preenchê-lo
    control // Para o Checkbox
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { // Valores padrão (para criação)
      no_empresa: '',
      nr_cnpj: '',
      nr_inscricao_estadual: '',
      ds_email_contato: '',
      nr_telefone_contato: '',
      ds_site: '',
      pc_comissao_padrao: 0.00,
      fl_ativa: true,
    }
  });

  // 2. Hooks de Mutação (TanStack Query)
  const { mutate: createEmpresa, isPending: isCreating, error: createError } = useCreateEmpresa();
  const { mutate: updateEmpresa, isPending: isUpdating, error: updateError } = useUpdateEmpresa();

  const isSaving = isCreating || isUpdating;
  const mutationError = (createError || updateError) as any;

  // 3. Efeito para preencher o formulário quando estiver em modo de edição
  useEffect(() => {
    if (isEditMode) {
      // Preenche o formulário com os dados da empresa para edição
      reset(empresa);
    } else {
      // Limpa o formulário para criação
      reset();
    }
  }, [empresa, isEditMode, reset, open]); // 'open' garante o reset ao reabrir

  // 4. Função de Submit
  const onSubmit = (data: EmpresaFormData) => {
    if (isEditMode) {
      // Atualiza
      updateEmpresa({ id: empresa.id_empresa, data }, {
        onSuccess: () => onClose(), // Fecha o modal em caso de sucesso
      });
    } else {
      // Cria
      createEmpresa(data, {
        onSuccess: () => onClose(), // Fecha o modal em caso de sucesso
      });
    }
  };
  
  const apiErrorMessage = mutationError?.response?.data?.detail;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Empresa' : 'Adicionar Nova Empresa'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                {...register("no_empresa")}
                label="Nome da Empresa (Representada)"
                required
                fullWidth
                error={!!errors.no_empresa}
                helperText={errors.no_empresa?.message}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("nr_cnpj")}
                label="CNPJ"
                required
                fullWidth
                // TODO: Adicionar máscara de CNPJ (ex: 12.345.678/0001-99)
                error={!!errors.nr_cnpj}
                helperText={errors.nr_cnpj?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("nr_inscricao_estadual")}
                label="Inscrição Estadual"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("ds_email_contato")}
                label="Email de Contato"
                type="email"
                fullWidth
                error={!!errors.ds_email_contato}
                helperText={errors.ds_email_contato?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("nr_telefone_contato")}
                label="Telefone de Contato"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register("ds_site")}
                label="Website (ex: https://site.com)"
                fullWidth
                error={!!errors.ds_site}
                helperText={errors.ds_site?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("pc_comissao_padrao")}
                label="Comissão Padrão (%)"
                type="number"
                fullWidth
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                error={!!errors.pc_comissao_padrao}
                helperText={errors.pc_comissao_padrao?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_ativa"
                    control={control}
                    render={({ field }) => (
                      <Checkbox {...field} checked={field.value} />
                    )}
                  />
                }
                label="Empresa Ativa"
              />
            </Grid>
          </Grid>

        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar Alterações' : 'Criar Empresa')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};