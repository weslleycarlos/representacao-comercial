// /frontend/src/componentes/gestor/ModalFormContato.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box
} from '@mui/material';
import { MaskedInput } from '../utils/MaskedInput';
import { type ContatoFormData, contatoSchema } from '../../tipos/validacao';
import type { IContato } from '../../tipos/schemas';
import { useAddContato, useUpdateContato } from '../../api/servicos/clienteService';

interface ModalFormContatoProps {
  open: boolean;
  onClose: () => void;
  idCliente: number;
  contato?: IContato; // Para modo de edição
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

  // Hooks de Mutação
  const { mutate: addContato, isPending: isAdding, error: addError } = useAddContato();
  const { mutate: updateContato, isPending: isUpdating, error: updateError } = useUpdateContato();

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError;
  const telefoneValue = watch('nr_telefone'); // Observa o valor do telefone
  // Preenche o formulário para edição ou limpa para criação
  useEffect(() => {
    if (open) {
      if (isEditMode) {
        reset(contato); // Preenche
      } else {
        reset({ // Limpa
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Contato' : 'Adicionar Novo Contato'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            
            <Grid xs={12} sm={7}>
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
            <Grid xs={12} sm={5}>
              <TextField
                {...register("ds_cargo")}
                label="Cargo (Ex: Comprador)"
                fullWidth
              />
            </Grid>
            
            <Grid xs={12} sm={7}>
              <TextField
                {...register("ds_email")}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.ds_email}
                helperText={errors.ds_email?.message}
              />
            </Grid>
            <Grid xs={12} sm={5}>
              <MaskedInput
                mask="telefone"
                label="Telefone"
                fullWidth
                // --- ADICIONE ESTAS DUAS PROPS ---
                value={telefoneValue || ""}
                onChange={(value) => setValue('nr_telefone', value)}
              />
            </Grid>
            
            <Grid xs={12}>
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

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Salvar Contato'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};