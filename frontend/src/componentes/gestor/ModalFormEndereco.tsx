// /frontend/src/componentes/gestor/ModalFormEndereco.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, InputAdornment, IconButton,
  MenuItem, Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { UseMutationResult } from '@tanstack/react-query';

import { type EnderecoFormData, enderecoSchema } from '../../tipos/validacao';
import type { IEndereco } from '../../tipos/schemas';
import { useConsultaCEP } from '../../api/servicos/utilsService';
import { MaskedInput } from '../utils/MaskedInput';

// Tipos para as mutações que serão passadas via Props
type AddMutateFn = UseMutationResult<IEndereco, Error, { idCliente: number; data: EnderecoFormData; }, unknown>;
type UpdateMutateFn = UseMutationResult<IEndereco, Error, { idEndereco: number; idCliente: number; data: Partial<EnderecoFormData>; }, unknown>;

interface ModalFormEnderecoProps {
  open: boolean;
  onClose: () => void;
  idCliente: number;
  endereco?: IEndereco;
  
  // Hooks são passados como props
  addHook: AddMutateFn;
  updateHook: UpdateMutateFn;
}

export const ModalFormEndereco: React.FC<ModalFormEnderecoProps> = ({ 
  open, onClose, idCliente, endereco, 
  addHook, updateHook // <-- Recebe aqui
}) => {
  const isEditMode = !!endereco;

  const { 
    register, handleSubmit, formState: { errors }, reset, control,
    setValue, watch
  } = useForm<EnderecoFormData>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      tp_endereco: 'entrega',
      fl_principal: false,
    }
  });

  const { mutate: buscarCEP, isPending: isBuscandoCEP, error: erroCEP } = useConsultaCEP();
  const { mutate: addEndereco, isPending: isAdding, error: addError } = addHook;
  const { mutate: updateEndereco, isPending: isUpdating, error: updateError } = updateHook;

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError || erroCEP;
  
  const cepValue = watch('nr_cep');

  useEffect(() => {
    if (open) {
      if (isEditMode && endereco) {
        reset(endereco);
      } else {
        reset({
          tp_endereco: 'entrega',
          ds_logradouro: '',
          nr_endereco: '',
          ds_complemento: '',
          no_bairro: '',
          no_cidade: '',
          sg_estado: '',
          nr_cep: '',
          fl_principal: false,
        });
      }
    }
  }, [endereco, isEditMode, reset, open]);

  const handleBuscaCEP = () => {
    const cep = watch('nr_cep');
    buscarCEP(cep, {
      onSuccess: (data) => {
        setValue('ds_logradouro', data.street || '', { shouldValidate: true });
        setValue('no_bairro', data.neighborhood || '', { shouldValidate: true });
        setValue('no_cidade', data.city || '', { shouldValidate: true });
        setValue('sg_estado', data.state || '', { shouldValidate: true });
      },
    });
  };

  const onSubmit = (data: EnderecoFormData) => {
    if (isEditMode && endereco) {
      updateEndereco({ idEndereco: endereco.id_endereco, idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    } else {
      addEndereco({ idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  // Processa mensagem de erro
  let apiErrorMessage: string | null = null;
  if (mutationError) {
     const errorData = (mutationError as any)?.response?.data;
     const errorDetail = errorData?.detail;
     
     if (typeof errorDetail === 'string') {
       apiErrorMessage = errorDetail;
     } else if (Array.isArray(errorDetail)) {
       apiErrorMessage = errorDetail[0]?.msg || "Erro de validação.";
     } else {
       apiErrorMessage = (mutationError as any).message || "Ocorreu um erro.";
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
        {isEditMode ? 'Editar Endereço' : 'Novo Endereço'}
      </DialogTitle>
      
      <Divider />
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2.5}>
            
            {/* Linha 1: CEP e Tipo */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <MaskedInput
                mask="cep"
                label="CEP"
                required
                fullWidth
                autoFocus
                value={cepValue || ""}
                onChange={(value) => setValue('nr_cep', value)}
                error={!!errors.nr_cep}
                helperText={errors.nr_cep?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="buscar dados do cep"
                        onClick={handleBuscaCEP}
                        disabled={isBuscandoCEP || (cepValue || "").replace(/\D/g, '').length !== 8}
                        edge="end"
                        size="small"
                        color="primary"
                      >
                        {isBuscandoCEP ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register("tp_endereco")}
                label="Tipo de Endereço"
                required
                fullWidth
                select
                defaultValue="entrega"
                error={!!errors.tp_endereco}
                helperText={errors.tp_endereco?.message}
              >
                <MenuItem value="entrega">Entrega</MenuItem>
                <MenuItem value="cobranca">Cobrança</MenuItem>
                <MenuItem value="comercial">Comercial</MenuItem>
              </TextField>
            </Grid>

            {/* Linha 2: Logradouro e Número */}
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField
                {...register("ds_logradouro")}
                label="Logradouro"
                required
                fullWidth
                placeholder="Rua, Avenida, etc."
                InputLabelProps={{ shrink: true }}
                error={!!errors.ds_logradouro}
                helperText={errors.ds_logradouro?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                {...register("nr_endereco")}
                label="Número"
                fullWidth
                error={!!errors.nr_endereco}
                helperText={errors.nr_endereco?.message}
              />
            </Grid>

            {/* Linha 3: Complemento e Bairro */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register("ds_complemento")}
                label="Complemento"
                fullWidth
                placeholder="Apto, Bloco, Sala, etc."
                error={!!errors.ds_complemento}
                helperText={errors.ds_complemento?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register("no_bairro")}
                label="Bairro"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.no_bairro}
                helperText={errors.no_bairro?.message}
              />
            </Grid>

            {/* Linha 4: Cidade e Estado */}
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                {...register("no_cidade")}
                label="Cidade"
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.no_cidade}
                helperText={errors.no_cidade?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register("sg_estado")}
                label="UF"
                required
                fullWidth
                placeholder="SP"
                InputLabelProps={{ shrink: true }}
                error={!!errors.sg_estado}
                helperText={errors.sg_estado?.message}
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            
            {/* Linha 5: Checkbox */}
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_principal"
                    control={control}
                    render={({ field }) => (
                      <Checkbox {...field} checked={field.value} />
                    )}
                  />
                }
                label="Definir como endereço principal"
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