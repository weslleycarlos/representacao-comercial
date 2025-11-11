// /frontend/src/componentes/gestor/ModalFormEmpresa.tsx
// Versão ajustada - UX e Layout melhorados

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
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Box,
  Grid,
  Divider
} from '@mui/material';

import { type EmpresaFormData, empresaSchema } from '../../tipos/validacao';
import type { IEmpresaCompleta } from '../../tipos/schemas';
import { useCreateEmpresa, useUpdateEmpresa } from '../../api/servicos/empresaService';
import { MaskedInput } from '../utils/MaskedInput';

interface ModalFormEmpresaProps {
  open: boolean;
  onClose: () => void;
  empresa?: IEmpresaCompleta;
}

export const ModalFormEmpresa: React.FC<ModalFormEmpresaProps> = ({ open, onClose, empresa }) => {
  const isEditMode = !!empresa;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      no_empresa: '',
      nr_cnpj: '',
      nr_inscricao_estadual: '',
      ds_email_contato: '',
      nr_telefone_contato: '',
      ds_site: '',
      pc_comissao_padrao: 0.0,
      fl_ativa: true
    }
  });

  const { mutate: createEmpresa, isPending: isCreating, error: createError } = useCreateEmpresa();
  const { mutate: updateEmpresa, isPending: isUpdating, error: updateError } = useUpdateEmpresa();

  const isSaving = isCreating || isUpdating;
  const mutationError = (createError || updateError) as any;
  
  const cnpjValue = watch('nr_cnpj');
  const telefoneValue = watch('nr_telefone_contato');

  useEffect(() => {
    if (open) {
      if (isEditMode && empresa) {
        reset(empresa);
      } else {
        reset({
          no_empresa: '',
          nr_cnpj: '',
          nr_inscricao_estadual: '',
          ds_email_contato: '',
          nr_telefone_contato: '',
          ds_site: '',
          pc_comissao_padrao: 0.0,
          fl_ativa: true
        });
      }
    }
  }, [open, empresa, isEditMode, reset]);

  const onSubmit = (data: EmpresaFormData) => {
    if (isEditMode && empresa) {
      updateEmpresa({ id: empresa.id_empresa, data }, { onSuccess: () => onClose() });
    } else {
      createEmpresa(data, { onSuccess: () => onClose() });
    }
  };

 let apiErrorMessage: string | null = null;
  if (mutationError) {
    const errorDetail = (mutationError as any)?.response?.data?.detail;
    if (typeof errorDetail === 'string') {
      // Erro simples (ex: "CNPJ já existe")
      apiErrorMessage = errorDetail;
    } else if (Array.isArray(errorDetail)) {
      // Erro de validação 422 (Pydantic)
      // Pega a primeira mensagem de erro do array
      apiErrorMessage = errorDetail[0]?.msg || "Erro de validação.";
    } else if ((mutationError as any).message) {
      // Erro de rede ou outro (ex: "Network Error")
      apiErrorMessage = (mutationError as any).message;
    } else {
      apiErrorMessage = "Ocorreu um erro desconhecido.";
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isEditMode ? 'Editar Empresa' : 'Nova Empresa'}
      </DialogTitle>

      <Divider />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiErrorMessage}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Linha 1: Nome da Empresa */}
            <Grid size={12}>
              <TextField
                {...register('no_empresa')}
                label="Nome da Empresa"
                required
                fullWidth
                autoFocus
                error={!!errors.no_empresa}
                helperText={errors.no_empresa?.message}
              />
            </Grid>

            {/* Linha 2: CNPJ e IE */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <MaskedInput
                mask="cnpj"
                label="CNPJ"
                required
                fullWidth
                value={cnpjValue || ""}
                onChange={(value) => setValue('nr_cnpj', value)}
                error={!!errors.nr_cnpj}
                helperText={errors.nr_cnpj?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                {...register('nr_inscricao_estadual')}
                label="Inscrição Estadual"
                fullWidth
                error={!!errors.nr_inscricao_estadual}
                helperText={errors.nr_inscricao_estadual?.message}
              />
            </Grid>

            {/* Linha 3: Email e Telefone */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register('ds_email_contato')}
                label="E-mail"
                type="email"
                fullWidth
                error={!!errors.ds_email_contato}
                helperText={errors.ds_email_contato?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 5 }}>
              <MaskedInput
                mask="telefone"
                label="Telefone"
                fullWidth
                value={telefoneValue || ""}
                onChange={(value) => setValue('nr_telefone_contato', value)}
                error={!!errors.nr_telefone_contato}
                helperText={errors.nr_telefone_contato?.message}
              />
            </Grid>

            {/* Linha 4: Website */}
            <Grid size={12}>
              <TextField
                {...register('ds_site')}
                label="Website"
                fullWidth
                placeholder="https://www.exemplo.com.br"
                error={!!errors.ds_site}
                helperText={errors.ds_site?.message}
              />
            </Grid>

            {/* Linha 5: Comissão e Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('pc_comissao_padrao', { valueAsNumber: true })}
                label="Comissão Padrão (%)"
                type="number"
                fullWidth
                InputProps={{ 
                  inputProps: { 
                    min: 0, 
                    max: 100, 
                    step: 0.1 
                  } 
                }}
                error={!!errors.pc_comissao_padrao}
                helperText={errors.pc_comissao_padrao?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_ativa"
                    control={control}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                }
                label="Empresa Ativa"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={onClose} 
            color="inherit" 
            disabled={isSaving}
            size="large"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSaving}
            size="large"
          >
            {isSaving ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};