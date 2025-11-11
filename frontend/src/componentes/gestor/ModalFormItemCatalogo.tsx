// /frontend/src/componentes/gestor/ModalFormItemCatalogo.tsx
import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Autocomplete, // Autocomplete para o produto
} from '@mui/material';

import { type ItemCatalogoFormData, itemCatalogoSchema } from '../../tipos/validacao';
import type { IItemCatalogo, IProdutoCompleto } from '../../tipos/schemas';
import { 
  useAddItemCatalogo, 
  useUpdateItemCatalogo,
  useGetProdutosPorEmpresa // Hook para buscar os produtos
} from '../../api/servicos/gestorCatalogoService';

interface ModalFormItemCatalogoProps {
  open: boolean;
  onClose: () => void;
  idCatalogo: number;
  idEmpresa: number; // Para buscar os produtos corretos
  item?: IItemCatalogo; // Para modo de edição
  produtosJaNoCatalogo: number[]; // Lista de IDs para filtrar o dropdown
}

export const ModalFormItemCatalogo: React.FC<ModalFormItemCatalogoProps> = ({ 
  open, onClose, idCatalogo, idEmpresa, item, produtosJaNoCatalogo
}) => {
  const isEditMode = !!item;

  const { 
    register, handleSubmit, formState: { errors }, reset, control, setValue
  } = useForm<ItemCatalogoFormData>({
    resolver: zodResolver(itemCatalogoSchema),
    defaultValues: { fl_ativo_no_catalogo: true }
  });

  // 1. Hooks de API
  const { data: produtosEmpresa, isLoading: isLoadingProdutos } = useGetProdutosPorEmpresa(idEmpresa);
  const { mutate: addItem, isPending: isAdding, error: addError } = useAddItemCatalogo();
  const { mutate: updateItem, isPending: isUpdating, error: updateError } = useUpdateItemCatalogo();

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError;

  // 2. Filtra produtos (só mostra os que NÃO estão no catálogo)
  const produtosDisponiveis = useMemo(() => {
    if (!produtosEmpresa) return [];
    if (isEditMode) return produtosEmpresa; // No modo de edição, não filtre
    
    return produtosEmpresa.filter(
      p => !produtosJaNoCatalogo.includes(p.id_produto) && p.fl_ativo
    );
  }, [produtosEmpresa, produtosJaNoCatalogo, isEditMode]);


  useEffect(() => {
    if (open) {
      if (isEditMode) {
        reset(item); // Preenche
      } else {
        reset({ // Limpa
          id_produto: undefined,
          vl_preco_catalogo: 0.01,
          fl_ativo_no_catalogo: true,
        });
      }
    }
  }, [item, isEditMode, reset, open]);

  const onSubmit = (data: ItemCatalogoFormData) => {
    if (isEditMode && item) {
      updateItem({ idItemCatalogo: item.id_item_catalogo, idCatalogo: idCatalogo, data }, {
        onSuccess: () => onClose(),
      });
    } else {
      addItem({ idCatalogo: idCatalogo, data }, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = (mutationError as any)?.response?.data?.detail;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Preço do Item' : 'Adicionar Item ao Catálogo'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>}

          <Grid container spacing={2}>
            
            <Grid xs={12}>
              <Controller
                name="id_produto"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={produtosDisponiveis}
                    getOptionLabel={(option) => `(${option.cd_produto}) ${option.ds_produto}` || ''}
                    isOptionEqualToValue={(option, value) => option.id_produto === value.id_produto}
                    value={produtosDisponiveis.find(p => p.id_produto === field.value) || null}
                    onChange={(_, newValue) => {
                      setValue('id_produto', newValue?.id_produto || 0);
                    }}
                    loading={isLoadingProdutos}
                    disabled={isEditMode} // Não pode mudar o produto no modo de edição
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Produto"
                        required
                        error={!!errors.id_produto}
                        helperText={errors.id_produto?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid xs={12} sm={6}>
              <TextField
                {...register("vl_preco_catalogo")}
                label="Preço de Venda (R$)"
                type="number"
                required
                fullWidth
                InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                error={!!errors.vl_preco_catalogo}
                helperText={errors.vl_preco_catalogo?.message}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Controller
                    name="fl_ativo_no_catalogo"
                    control={control}
                    render={({ field }) => (
                      <Checkbox {...field} checked={field.value} />
                    )}
                  />
                }
                label="Ativo neste catálogo"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Salvar Item'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};