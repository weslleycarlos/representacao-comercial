// /frontend/src/componentes/gestor/ModalFormContato.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Divider
} from '@mui/material';

import { MaskedInput } from '../utils/MaskedInput';
import { type ContatoFormData, contatoSchema } from '../../tipos/validacao';
import type { IContato } from '../../tipos/schemas';
import { useAddContato, useUpdateContato } from '../../api/servicos/clienteService';

interface ModalFormContatoProps {
  open: boolean;
  onClose: () => void;
  idCliente: number;
  contato?: IContato;
}

export const ModalFormContato: React.FC<ModalFormContatoProps> = ({ open, onClose, idCliente, contato }) => {
  const isEditMode = !!contato;

  const { 
    register, handleSubmit, formState: { errors }, reset, control,
    setValue, watch 
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
    defaultValues: { fl_principal: false }
  });

  const { mutate: addContato, isPending: isAdding, error: addError } = useAddContato();
  const { mutate: updateContato, isPending: isUpdating, error: updateError } = useUpdateContato();

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError;
  const telefoneValue = watch('nr_telefone');

  useEffect(() => {
    if (open) {
      if (isEditMode && contato) {
        reset(contato);
      } else {
        reset({
          no_contato: '',
          ds_cargo: '',
          ds_email: '',
          nr_telefone: '',
          fl_principal: false,
        });
      }
    }
  }, [contato, isEditMode, reset, open]);

  const onSubmit = (data: ContatoFormData) => {
    if (isEditMode && contato) {
      updateContato({ idContato: contato.id_contato, idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    } else {
      addContato({ idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = (mutationError as any)?.response?.data?.detail;

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
        {isEditMode ? 'Editar Contato' : 'Novo Contato'}
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
            {/* Linha 1: Nome e Cargo */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register("no_contato")}
                label="Nome do Contato"
                required
                fullWidth
                autoFocus
                error={!!errors.no_contato}
                helperText={errors.no_contato?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                {...register("ds_cargo")}
                label="Cargo"
                fullWidth
                placeholder="Ex: Comprador"
                error={!!errors.ds_cargo}
                helperText={errors.ds_cargo?.message}
              />
            </Grid>
            
            {/* Linha 2: E-mail e Telefone */}
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
            
            {/* Linha 3: Checkbox */}
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
                label="Definir como contato principal"
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