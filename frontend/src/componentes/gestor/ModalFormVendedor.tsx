/* eslint-disable @typescript-eslint/no-unused-vars */
// /frontend/src/componentes/gestor/ModalFormVendedor.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Divider
} from '@mui/material';

import { type VendedorFormData, vendedorSchema } from '../../tipos/validacao';
import type { IVendedor } from '../../tipos/schemas';
import { useCreateVendedor, useUpdateVendedor } from '../../api/servicos/vendedorService';
import { MaskedInput } from '../utils/MaskedInput';

interface ModalFormVendedorProps {
  open: boolean;
  onClose: () => void;
  vendedor?: IVendedor;
}

export const ModalFormVendedor: React.FC<ModalFormVendedorProps> = ({ open, onClose, vendedor }) => {
  const isEditMode = !!vendedor;

  const { 
    register, handleSubmit, formState: { errors }, reset, control, setValue, watch
  } = useForm<VendedorFormData>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      ds_email: '',
      password: '',
      no_completo: '',
      nr_telefone: '',
      fl_ativo: true,
    }
  });

  const { mutate: createVendedor, isPending: isCreating, error: createError } = useCreateVendedor();
  const { mutate: updateVendedor, isPending: isUpdating, error: updateError } = useUpdateVendedor();

  const isSaving = isCreating || isUpdating;
  const mutationError = (createError || updateError) as any;
  
  const telefoneValue = watch('nr_telefone');

  useEffect(() => {
    if (open) {
      if (isEditMode && vendedor) {
        reset({
          ds_email: vendedor.ds_email,
          no_completo: vendedor.no_completo,
          nr_telefone: vendedor.nr_telefone || '',
          fl_ativo: vendedor.fl_ativo,
          password: '',
        });
      } else {
        reset({
          ds_email: '',
          password: '',
          no_completo: '',
          nr_telefone: '',
          fl_ativo: true,
        });
      }
    }
  }, [vendedor, isEditMode, reset, open]);

  const onSubmit = (data: VendedorFormData) => {
    if (isEditMode && vendedor) {
      const { password, ...updateData } = data;
      const payload: Omit<VendedorFormData, 'password'> = updateData;
      updateVendedor({ id: vendedor.id_usuario, data: payload }, {
        onSuccess: () => onClose(),
      });
    } else {
      if (!data.password) return; 
      createVendedor(data, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = mutationError?.response?.data?.detail;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {isEditMode ? 'Editar Vendedor' : 'Novo Vendedor'}
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
            {/* Linha 1: Nome */}
            <Grid size={12}>
              <TextField
                {...register("no_completo")}
                label="Nome Completo"
                required
                fullWidth
                autoFocus
                error={!!errors.no_completo}
                helperText={errors.no_completo?.message}
              />
            </Grid>

            {/* Linha 2: E-mail e Telefone */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register("ds_email")}
                label="E-mail"
                type="email"
                required
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
            
            {/* Linha 3: Senha (somente no modo criação) */}
            {!isEditMode && (
              <Grid size={12}>
                <TextField
                  {...register("password")}
                  label="Senha Provisória"
                  type="password"
                  required
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>
            )}

            {/* Linha 4: Checkbox Ativo */}
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
                label="Vendedor Ativo"
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