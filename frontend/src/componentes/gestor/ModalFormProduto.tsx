// /frontend/src/componentes/gestor/ModalFormProduto.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, MenuItem
} from '@mui/material';

import { type ProdutoFormData, produtoSchema } from '../../tipos/validacao';
import type { IProdutoCompleto, ICategoriaProduto } from '../../tipos/schemas';
import { useCreateProduto, useUpdateProduto } from '../../api/servicos/gestorCatalogoService';
// (Precisaremos do hook useGetCategorias quando o criarmos)

interface ModalFormProdutoProps {
  open: boolean;
  onClose: () => void;
  idEmpresa: number; // A qual empresa este produto pertence
  produto?: IProdutoCompleto; // Para modo de edição
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
      id_empresa: idEmpresa, // Pré-define o ID da empresa
    }
  });

  const { mutate: createProduto, isPending: isCreating, error: createError } = useCreateProduto();
  const { mutate: updateProduto, isPending: isUpdating, error: updateError } = useUpdateProduto();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        reset(produto); // Preenche
      } else {
        reset({ // Limpa
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
      // (Omitimos id_empresa pois não deve ser alterado na edição)
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto (Definição)'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            
            <Grid xs={12} sm={6}>
              <TextField
                {...register("cd_produto")}
                label="Código (SKU)"
                required
                fullWidth
                autoFocus
                error={!!errors.cd_produto}
                helperText={errors.cd_produto?.message}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                {...register("sg_unidade_medida")}
                label="Unidade (UN, CX, KG)"
                fullWidth
              />
            </Grid>

            <Grid xs={12}>
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
            
            <Grid xs={12}>
              <TextField
                {...register("id_categoria")}
                label="Categoria"
                select
                fullWidth
                // Converte null/undefined para string vazia para o TextField
                value={watch('id_categoria') || ''}
                disabled={isLoadingCategorias} // Desabilita enquanto carrega
              >
                {/* Remove o comentário e adiciona o map */}
                <MenuItem value="" disabled>
                  {isLoadingCategorias ? 'Carregando...' : 'Selecione...'}
                </MenuItem>
                
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.no_categoria}
                  </MenuItem>
                ))}
              </TextField>
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
                label="Produto Ativo (pode ser vendido)"
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