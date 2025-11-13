// /frontend/src/componentes/gestor/ModalFormProduto.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, MenuItem, Divider
} from '@mui/material';

import { type ProdutoFormData, produtoSchema } from '../../tipos/validacao';
import type { IProdutoCompleto, ICategoriaProduto } from '../../tipos/schemas';
import { useCreateProduto, useUpdateProduto } from '../../api/servicos/gestorCatalogoService';

interface ModalFormProdutoProps {
  open: boolean;
  onClose: () => void;
  idEmpresa: number;
  produto?: IProdutoCompleto;
  categorias: ICategoriaProduto[];
  isLoadingCategorias: boolean;
}

export const ModalFormProduto: React.FC<ModalFormProdutoProps> = ({ 
  open, onClose, idEmpresa, produto, categorias, isLoadingCategorias
}) => {
  const isEditMode = !!produto;

  const { 
    register, handleSubmit, formState: { errors }, reset, control, watch
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      fl_ativo: true,
      sg_unidade_medida: 'UN',
      id_empresa: idEmpresa,
    }
  });

  const { mutate: createProduto, isPending: isCreating, error: createError } = useCreateProduto();
  const { mutate: updateProduto, isPending: isUpdating, error: updateError } = useUpdateProduto();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  useEffect(() => {
    if (open) {
      if (isEditMode && produto) {
        reset(produto);
      } else {
        reset({
          cd_produto: '',
          ds_produto: '',
          sg_unidade_medida: 'UN',
          fl_ativo: true,
          id_empresa: idEmpresa,
          id_categoria: undefined,
        });
      }
    }
  }, [produto, isEditMode, reset, open, idEmpresa]);

  const onSubmit = (data: ProdutoFormData) => {
    if (isEditMode && produto) {
      const { id_empresa, ...updateData } = data;
      updateProduto({ idProduto: produto.id_produto, data: updateData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createProduto(data, {
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
        {isEditMode ? 'Editar Produto' : 'Novo Produto'}
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
            
            {/* Linha 1: Código e Unidade */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register("cd_produto")}
                label="Código do Produto"
                required
                fullWidth
                autoFocus
                placeholder="Ex: SKU-001"
                error={!!errors.cd_produto}
                helperText={errors.cd_produto?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                {...register("sg_unidade_medida")}
                label="Unidade"
                fullWidth
                placeholder="Ex: UN, CX, KG"
                error={!!errors.sg_unidade_medida}
                helperText={errors.sg_unidade_medida?.message}
              />
            </Grid>

            {/* Linha 2: Descrição */}
            <Grid size={12}>
              <TextField
                {...register("ds_produto")}
                label="Descrição do Produto"
                required
                fullWidth
                multiline
                rows={3}
                error={!!errors.ds_produto}
                helperText={errors.ds_produto?.message}
              />
            </Grid>
            
            {/* Linha 3: Categoria */}
            <Grid size={12}>
              <TextField
                {...register("id_categoria")}
                label="Categoria"
                select
                fullWidth
                value={watch('id_categoria') || ''}
                disabled={isLoadingCategorias}
                error={!!errors.id_categoria}
                helperText={errors.id_categoria?.message}
                InputProps={{
                  startAdornment: isLoadingCategorias ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : null,
                }}
              >
                <MenuItem value="" disabled>
                  <em>{isLoadingCategorias ? 'Carregando categorias...' : 'Selecione uma categoria...'}</em>
                </MenuItem>
                
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.no_categoria}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Produto ativo"
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