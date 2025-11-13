// /frontend/src/componentes/gestor/ModalFormCatalogo.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Divider
} from '@mui/material';

import { type CatalogoFormData, catalogoSchema } from '../../tipos/validacao';
import type { ICatalogo } from '../../tipos/schemas';
import { useCreateCatalogo, useUpdateCatalogo } from '../../api/servicos/gestorCatalogoService';

interface ModalFormCatalogoProps {
  open: boolean;
  onClose: () => void;
  idEmpresa: number;
  catalogo?: ICatalogo;
}

// Helper para converter data ISO para formato do input
const formatDataParaInput = (dateString?: string | null): string => {
  if (!dateString) return "";
  try {
    return dateString.split('T')[0];
  } catch (e) {
    return "";
  }
};

export const ModalFormCatalogo: React.FC<ModalFormCatalogoProps> = ({ 
  open, onClose, idEmpresa, catalogo 
}) => {
  const isEditMode = !!catalogo;

  const { 
    register, handleSubmit, formState: { errors }, reset, control
  } = useForm<CatalogoFormData>({
    resolver: zodResolver(catalogoSchema),
    defaultValues: {
      fl_ativo: true,
      id_empresa: idEmpresa,
    }
  });

  const { mutate: createCatalogo, isPending: isCreating, error: createError } = useCreateCatalogo();
  const { mutate: updateCatalogo, isPending: isUpdating, error: updateError } = useUpdateCatalogo();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  useEffect(() => {
    if (open) {
      if (isEditMode && catalogo) {
        reset({
          ...catalogo,
          dt_inicio_vigencia: formatDataParaInput(catalogo.dt_inicio_vigencia),
          dt_fim_vigencia: formatDataParaInput(catalogo.dt_fim_vigencia),
        });
      } else {
        reset({
          no_catalogo: '',
          ds_descricao: '',
          dt_inicio_vigencia: undefined,
          dt_fim_vigencia: undefined,
          fl_ativo: true,
          id_empresa: idEmpresa,
        });
      }
    }
  }, [catalogo, isEditMode, reset, open, idEmpresa]);

  const onSubmit = (data: CatalogoFormData) => {
    if (isEditMode && catalogo) {
      const updateData: Partial<CatalogoFormData> = {};
      
      (Object.keys(data) as Array<keyof CatalogoFormData>).forEach(key => {
         if (key === 'dt_inicio_vigencia' || key === 'dt_fim_vigencia') {
            const formDate = data[key] ? new Date(data[key]!).toISOString().split('T')[0] : null;
            const originalDate = catalogo[key] ? new Date(catalogo[key]!).toISOString().split('T')[0] : null;
            if(formDate !== originalDate) {
              updateData[key] = data[key];
            }
         } else if (data[key] !== catalogo[key as keyof ICatalogo]) {
            updateData[key] = data[key];
         }
      });
      
      updateCatalogo({ idCatalogo: catalogo.id_catalogo, data: updateData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createCatalogo(data, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = (mutationError as any)?.response?.data?.detail;

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
        {isEditMode ? 'Editar Catálogo' : 'Novo Catálogo'}
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
                {...register("no_catalogo")}
                label="Nome do Catálogo"
                required
                fullWidth
                autoFocus
                placeholder="Ex: Verão 2025"
                error={!!errors.no_catalogo}
                helperText={errors.no_catalogo?.message}
              />
            </Grid>

            {/* Linha 2: Descrição */}
            <Grid size={12}>
              <TextField
                {...register("ds_descricao")}
                label="Descrição"
                fullWidth
                multiline
                rows={3}
                placeholder="Detalhes sobre este catálogo..."
                error={!!errors.ds_descricao}
                helperText={errors.ds_descricao?.message}
              />
            </Grid>
            
            {/* Linha 3: Datas */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register("dt_inicio_vigencia")}
                label="Início da Vigência"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dt_inicio_vigencia}
                helperText={errors.dt_inicio_vigencia?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register("dt_fim_vigencia")}
                label="Fim da Vigência"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dt_fim_vigencia}
                helperText={errors.dt_fim_vigencia?.message}
              />
            </Grid>
            
            {/* Linha 4: Checkbox */}
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
                label="Catálogo ativo"
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