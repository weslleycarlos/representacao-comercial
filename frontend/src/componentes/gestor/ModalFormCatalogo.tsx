// /frontend/src/componentes/gestor/ModalFormCatalogo.tsx
// (VERSÃO CORRIGIDA)

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box
} from '@mui/material';

import { type CatalogoFormData, catalogoSchema } from '../../tipos/validacao';
import type { ICatalogo } from '../../tipos/schemas';
// --- 1. IMPORTAR O NOVO HOOK ---
import { useCreateCatalogo, useUpdateCatalogo } from '../../api/servicos/gestorCatalogoService';

interface ModalFormCatalogoProps {
  open: boolean;
  onClose: () => void;
  idEmpresa: number;
  catalogo?: ICatalogo;
}

// Helper para converter string de data (YYYY-MM-DD) para <input type="date">
const formatDataParaInput = (dateString?: string | null): string => {
  if (!dateString) return "";
  try {
    // Tenta extrair apenas a data (ignorando fuso horário)
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

  // --- 2. USAR O NOVO HOOK ---
  const { mutate: createCatalogo, isPending: isCreating, error: createError } = useCreateCatalogo();
  const { mutate: updateCatalogo, isPending: isUpdating, error: updateError } = useUpdateCatalogo();


  const isSaving = isCreating || isUpdating; // <-- ATUALIZADO
  const mutationError = createError || updateError; // <-- ATUALIZADO

  useEffect(() => {
    if (open) {
      if (isEditMode && catalogo) {
        // --- 3. CORREÇÃO DO RESET (Bug da Data) ---
        // Converte as datas (string ISO) para o formato "YYYY-MM-DD" que o input type="date" espera
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
    // --- 4. CORREÇÃO DO SUBMIT (Bug da Edição) ---
    if (isEditMode && catalogo) {
      // (Filtra os dados que não mudaram para otimizar o PUT)
      const updateData: Partial<CatalogoFormData> = {};
      
      // Compara o formulário com o objeto 'catalogo' original
      (Object.keys(data) as Array<keyof CatalogoFormData>).forEach(key => {
         // Converte as datas para o formato ISO (se mudaram)
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Catálogo' : 'Adicionar Novo Catálogo'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            
            <Grid xs={12}>
              <TextField
                {...register("no_catalogo")}
                label="Nome do Catálogo (Ex: Verão 2025)"
                required
                fullWidth
                autoFocus
                error={!!errors.no_catalogo}
                helperText={errors.no_catalogo?.message}
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                {...register("ds_descricao")}
                label="Descrição"
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid xs={12} sm={6}>
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
            <Grid xs={12} sm={6}>
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
            
            <Grid xs={12}>
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
                label="Catálogo Ativo (Vendedores podem usar)"
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