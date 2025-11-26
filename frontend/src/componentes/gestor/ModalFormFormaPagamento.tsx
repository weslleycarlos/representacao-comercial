import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Typography
} from '@mui/material';

import { type FormaPagamentoFormData, formaPagamentoSchema } from '../../tipos/validacao';
import type { IFormaPagamento } from '../../tipos/schemas';
import { useCreateFormaPagamento, useUpdateFormaPagamento } from '../../api/servicos/gestorConfigService';

interface Props {
  open: boolean;
  onClose: () => void;
  formaPagamento?: IFormaPagamento;
}

export const ModalFormFormaPagamento: React.FC<Props> = ({ open, onClose, formaPagamento }) => {
  const isEditMode = !!formaPagamento;

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormaPagamentoFormData>({
    resolver: zodResolver(formaPagamentoSchema),
    defaultValues: {
      no_forma_pagamento: '',
      fl_permite_parcelamento: false,
      qt_maximo_parcelas: 1,
      fl_ativa: true,
    }
  });

  const { mutate: create, isPending: isCreating, error: createError } = useCreateFormaPagamento();
  const { mutate: update, isPending: isUpdating, error: updateError } = useUpdateFormaPagamento();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  // Observa se parcelamento está ativo para habilitar/desabilitar o campo de qtd
  const permiteParcelamento = watch('fl_permite_parcelamento');

  useEffect(() => {
    if (open) {
      if (isEditMode && formaPagamento) {
        reset(formaPagamento);
      } else {
        reset({ no_forma_pagamento: '', fl_permite_parcelamento: false, qt_maximo_parcelas: 1, fl_ativa: true });
      }
    }
  }, [open, formaPagamento, isEditMode, reset]);

  const onSubmit = ( data: FormaPagamentoFormData) => {
    if (isEditMode && formaPagamento) {
      update({ id: formaPagamento.id_forma_pagamento, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
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
        <Typography variant="h6" fontWeight={600} component="span">
          {isEditMode ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
        </Typography>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {apiErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                {...register('no_forma_pagamento')}
                label="Nome (ex: Boleto 30 Dias)"
                required
                fullWidth
                autoFocus
                error={!!errors.no_forma_pagamento}
                helperText={errors.no_forma_pagamento?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_permite_parcelamento"
                    control={control}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                }
                label="Permite Parcelamento?"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...register('qt_maximo_parcelas', { valueAsNumber: true })}
                label="Máx. Parcelas"
                type="number"
                fullWidth
                disabled={!permiteParcelamento}
                InputProps={{ inputProps: { min: 1, max: 24 } }}
                error={!!errors.qt_maximo_parcelas}
                helperText={errors.qt_maximo_parcelas?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_ativa"
                    control={control}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                }
                label="Ativa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving} size="large">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSaving} size="large">
            {isSaving ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};