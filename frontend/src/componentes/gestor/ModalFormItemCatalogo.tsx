// /frontend/src/componentes/gestor/ModalFormItemCatalogo.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, Autocomplete, Divider
} from '@mui/material';

import { type ItemCatalogoFormData, itemCatalogoSchema } from '../../tipos/validacao';
import type { IItemCatalogo, IProdutoCompleto } from '../../tipos/schemas';
import { 
  useAddItemCatalogo, 
  useUpdateItemCatalogo,
  useGetProdutosPorEmpresa
} from '../../api/servicos/gestorCatalogoService';

interface ModalFormItemCatalogoProps {
  open: boolean;
  onClose: () => void;
  idCatalogo: number;
  idEmpresa: number;
  item?: IItemCatalogo;
  produtosJaNoCatalogo: number[];
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

  const { data: produtosEmpresa, isLoading: isLoadingProdutos } = useGetProdutosPorEmpresa(idEmpresa);
  const { mutate: addItem, isPending: isAdding, error: addError } = useAddItemCatalogo();
  const { mutate: updateItem, isPending: isUpdating, error: updateError } = useUpdateItemCatalogo();

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError;

  // Filtra produtos disponíveis
  const produtosDisponiveis = useMemo(() => {
    if (!produtosEmpresa) return [];
    if (isEditMode) return produtosEmpresa;
    
    return produtosEmpresa.filter(
      p => !produtosJaNoCatalogo.includes(p.id_produto) && p.fl_ativo
    );
  }, [produtosEmpresa, produtosJaNoCatalogo, isEditMode]);

  useEffect(() => {
    if (open) {
      if (isEditMode && item) {
        reset(item);
      } else {
        reset({
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
        {isEditMode ? 'Editar Preço' : 'Adicionar Produto ao Catálogo'}
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
            
            {/* Linha 1: Autocomplete de Produto */}
            <Grid size={12}>
              <Controller
                name="id_produto"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={produtosDisponiveis}
                    getOptionLabel={(option) => `${option.cd_produto} - ${option.ds_produto}` || ''}
                    isOptionEqualToValue={(option, value) => option.id_produto === value.id_produto}
                    value={produtosDisponiveis.find(p => p.id_produto === field.value) || null}
                    onChange={(_, newValue) => {
                      setValue('id_produto', newValue?.id_produto || 0);
                    }}
                    loading={isLoadingProdutos}
                    disabled={isEditMode}
                    noOptionsText={isEditMode ? "Carregando..." : "Nenhum produto disponível"}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Produto"
                        required
                        autoFocus
                        placeholder={isEditMode ? "" : "Digite para buscar..."}
                        error={!!errors.id_produto}
                        helperText={
                          errors.id_produto?.message || 
                          (isEditMode ? "Não é possível alterar o produto" : "Selecione o produto para adicionar ao catálogo")
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingProdutos ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Linha 2: Preço e Checkbox */}
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                {...register("vl_preco_catalogo", { valueAsNumber: true })}
                label="Preço de Venda"
                type="number"
                required
                fullWidth
                placeholder="0,00"
                InputProps={{ 
                  inputProps: { 
                    min: 0.01, 
                    step: 0.01 
                  },
                  startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>R$</Box>
                }}
                error={!!errors.vl_preco_catalogo}
                helperText={errors.vl_preco_catalogo?.message}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 5 }} sx={{ display: 'flex', alignItems: 'center' }}>
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
                label="Ativo no catálogo"
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