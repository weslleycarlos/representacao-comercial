// /frontend/src/componentes/gestor/ModalFormCliente.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box,
  InputAdornment, IconButton, Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { type ClienteFormData, clienteSchema } from '../../tipos/validacao';
import type { IClienteCompleto } from '../../tipos/schemas';
//import { useCreateCliente, useUpdateCliente } from '../../api/servicos/clienteService';
import { useConsultaCNPJ } from '../../api/servicos/utilsService';
import { MaskedInput } from '../utils/MaskedInput';

type MutateClienteFn = (
  data: ClienteFormData, 
  options: { onSuccess: () => void }
) => void;

interface ModalFormClienteProps {
  open: boolean;
  onClose: () => void;
  cliente?: IClienteCompleto;
  onSave: MutateClienteFn; // <-- 1. Recebe a função de salvar
  isSaving: boolean; // <-- 2. Recebe o estado de "salvando"
  mutationError: Error | null; // <-- 3. Recebe o erro
}

export const ModalFormCliente: React.FC<ModalFormClienteProps> = ({ 
  open, 
  onClose, 
  cliente,
  onSave, // <-- 1. Recebe das props
  isSaving, // <-- 2. Recebe das props
  mutationError // <-- 3. Recebe das props
}) => {
  const isEditMode = !!cliente;

  const { 
    register, handleSubmit, formState: { errors }, reset, control,
    setValue, watch
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { /* ... (valores padrão) ... */ }
  });

  const { mutate: buscarCNPJ, isPending: isBuscandoCNPJ, error: erroCNPJ } = useConsultaCNPJ();
  //const { mutate: createCliente, isPending: isCreating, error: createError } = useCreateCliente();
  //const { mutate: updateCliente, isPending: isUpdating, error: updateError } = useUpdateCliente();

  //const isSaving = isCreating || isUpdating;
  //const mutationError = createError || updateError || erroCNPJ;
  
  const cnpjValue = watch('nr_cnpj');
  const telefoneValue = watch('nr_telefone');

  useEffect(() => {
    if (open) {
      if (isEditMode && cliente) { 
        reset(cliente); 
      } else {
        reset({
          no_razao_social: '', 
          nr_cnpj: '', 
          no_fantasia: '',
          nr_inscricao_estadual: '', 
          ds_email: '', 
          nr_telefone: '',
          ds_observacoes: '', 
          fl_ativo: true,
        });
      }
    }
  }, [cliente, isEditMode, reset, open]);

  const onSubmit = (data: ClienteFormData) => {
    // (A lógica de 'editar' vs 'criar' agora é gerenciada pelo 'onSave')
    onSave(data, {
      onSuccess: () => onClose(),
    });
  };

  const apiError = mutationError || erroCNPJ; // Combina erros
  
  const handleBuscaCNPJ = () => {
    const cnpj = watch('nr_cnpj');
    buscarCNPJ(cnpj, {
      onSuccess: (data) => {
        setValue('no_razao_social', data.razao_social || '', { shouldValidate: true });
        setValue('no_fantasia', data.nome_fantasia || '', { shouldValidate: true });
        setValue('ds_email', data.email || '', { shouldValidate: true });
        setValue('nr_telefone', data.ddd_telefone_1 || data.ddd_telefone_2 || '', { shouldValidate: true });
      },
    });
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
        {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
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
            
            {/* Linha 1: CNPJ e IE */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <MaskedInput
                mask="cnpj"
                label="CNPJ"
                required
                fullWidth
                autoFocus
                value={cnpjValue || ""}
                onChange={(value) => setValue('nr_cnpj', value)}
                error={!!errors.nr_cnpj}
                helperText={errors.nr_cnpj?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="buscar dados do cnpj"
                        onClick={handleBuscaCNPJ}
                        disabled={isBuscandoCNPJ || (cnpjValue || "").replace(/\D/g, '').length !== 14}
                        edge="end"
                        size="small"
                        color="primary"
                      >
                        {isBuscandoCNPJ ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register("nr_inscricao_estadual")}
                label="Inscrição Estadual"
                fullWidth
                error={!!errors.nr_inscricao_estadual}
                helperText={errors.nr_inscricao_estadual?.message}
              />
            </Grid>

            {/* Linha 2: Razão Social */}
            <Grid size={12}>
              <TextField
                {...register("no_razao_social")}
                label="Razão Social"
                required
                fullWidth
                error={!!errors.no_razao_social}
                helperText={errors.no_razao_social?.message}
              />
            </Grid>

            {/* Linha 3: Nome Fantasia */}
            <Grid size={12}>
              <TextField
                {...register("no_fantasia")}
                label="Nome Fantasia"
                fullWidth
                error={!!errors.no_fantasia}
                helperText={errors.no_fantasia?.message}
              />
            </Grid>

            {/* Linha 4: Email e Telefone */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register("ds_email")}
                label="E-mail"
                type="email"
                fullWidth
                error={!!errors.ds_email}
                helperText={errors.ds_email?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 5 }}>
              <MaskedInput
                mask="telefone"
                label="Telefone"
                fullWidth
                value={telefoneValue || ""}
                onChange={(value) => setValue('nr_telefone', value)}
                error={!!errors.nr_telefone}
                helperText={errors.nr_telefone?.message}
              />
            </Grid>

            {/* Linha 5: Observações */}
            <Grid size={12}>
              <TextField
                {...register("ds_observacoes")}
                label="Observações"
                multiline
                rows={3}
                fullWidth
                error={!!errors.ds_observacoes}
                helperText={errors.ds_observacoes?.message}
              />
            </Grid>

            {/* Linha 6: Checkbox */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_ativo"
                    control={control}
                    render={({ field }) => (
                      <Checkbox {...field} checked={field.value} />
                    )}
                  />
                }
                label="Cliente Ativo"
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