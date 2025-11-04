// /frontend/src/componentes/gestor/ModalFormVendedor.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel,
  Box
} from '@mui/material';

import { type VendedorFormData, vendedorSchema } from '../../tipos/validacao';
import type { VendedorSchema } from '../../tipos/schemas';
import { useCreateVendedor, useUpdateVendedor } from '../../api/servicos/vendedorService';

interface ModalFormVendedorProps {
  open: boolean;
  onClose: () => void;
  vendedor?: VendedorSchema; // Para modo de edição
}

export const ModalFormVendedor: React.FC<ModalFormVendedorProps> = ({ open, onClose, vendedor }) => {
  const isEditMode = !!vendedor;

  const { 
    register, handleSubmit, formState: { errors }, reset, control
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

  // Preenche o formulário para edição ou limpa para criação
  useEffect(() => {
    if (open) {
      if (isEditMode) {
        // Modo Edição: preenche com dados do vendedor (sem a senha)
        reset({
          ds_email: vendedor.ds_email,
          no_completo: vendedor.no_completo,
          nr_telefone: vendedor.nr_telefone || '',
          fl_ativo: vendedor.fl_ativo,
          password: '', // Senha fica em branco na edição
        });
      } else {
        // Modo Criação: limpa o formulário
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
    if (isEditMode) {
      // Edição: Remove a senha se estiver vazia (não queremos atualizar)
      const { password, ...updateData } = data;
      
      const payload: Omit<VendedorFormData, 'password'> = updateData;
      // (Se a senha foi digitada, faríamos uma chamada a uma rota /reset-password)
      // Por enquanto, o PUT não altera a senha.

      updateVendedor({ id: vendedor.id_usuario, data: payload }, {
        onSuccess: () => onClose(),
      });
    } else {
      // Criação: Senha é obrigatória
      if (!data.password) {
        // (O Zod já deve pegar isso, mas é uma garantia)
        return; 
      }
      createVendedor(data, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = mutationError?.response?.data?.detail;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
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
            <Grid item xs={12} sm={8}>
              <TextField
                {...register("ds_email")}
                label="Email"
                type="email"
                required
                fullWidth
                error={!!errors.ds_email}
                helperText={errors.ds_email?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register("nr_telefone")}
                label="Telefone"
                fullWidth
              />
            </Grid>
            
            {!isEditMode && ( // Só mostra o campo Senha no modo CREATE
              <Grid item xs={12}>
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

            <Grid item xs={12}>
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

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};