// /frontend/src/componentes/gestor/ModalFormEndereco.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, InputAdornment, IconButton,
  MenuItem // Para o 'Tipo'
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { type EnderecoFormData, enderecoSchema } from '../../tipos/validacao';
import type { IEndereco } from '../../tipos/schemas';
import { useAddEndereco, useUpdateEndereco } from '../../api/servicos/clienteService';
import { useConsultaCEP } from '../../api/servicos/utilsService';
import { MaskedInput } from '../utils/MaskedInput';

interface ModalFormEnderecoProps {
  open: boolean;
  onClose: () => void;
  idCliente: number;
  endereco?: IEndereco; // Para modo de edição
}

export const ModalFormEndereco: React.FC<ModalFormEnderecoProps> = ({ open, onClose, idCliente, endereco }) => {
  const isEditMode = !!endereco;

  const { 
    register, handleSubmit, formState: { errors }, reset, control,
    setValue, watch
  } = useForm<EnderecoFormData>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      tp_endereco: 'entrega',
      fl_principal: false,
    }
  });

  // Hooks de Mutação
  const { mutate: buscarCEP, isPending: isBuscandoCEP, error: erroCEP } = useConsultaCEP();
  const { mutate: addEndereco, isPending: isAdding, error: addError } = useAddEndereco();
  const { mutate: updateEndereco, isPending: isUpdating, error: updateError } = useUpdateEndereco();

  const isSaving = isAdding || isUpdating;
  const mutationError = addError || updateError || erroCEP;
  
  const cepValue = watch('nr_cep');

  // Preenche o formulário para edição ou limpa para criação
  useEffect(() => {
    if (open) {
      if (isEditMode) {
        reset(endereco); // Preenche
      } else {
        reset({ // Limpa
          tp_endereco: 'entrega',
          ds_logradouro: '',
          nr_endereco: '',
          ds_complemento: '',
          no_bairro: '',
          no_cidade: '',
          sg_estado: '',
          nr_cep: '',
          fl_principal: false,
        });
      }
    }
  }, [endereco, isEditMode, reset, open]);

  // Handler da busca por CEP
  const handleBuscaCEP = () => {
    const cep = watch('nr_cep');
    buscarCEP(cep, {
      onSuccess: (data) => {
        // A BrasilAPI retorna 'street', 'neighborhood', 'city', 'state'
        setValue('ds_logradouro', data.street || '', { shouldValidate: true });
        setValue('no_bairro', data.neighborhood || '', { shouldValidate: true });
        setValue('no_cidade', data.city || '', { shouldValidate: true });
        setValue('sg_estado', data.state || '', { shouldValidate: true });
      },
    });
  };

  const onSubmit = (data: EnderecoFormData) => {
    if (isEditMode && endereco) {
      updateEndereco({ idEndereco: endereco.id_endereco, idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    } else {
      addEndereco({ idCliente: idCliente, data }, {
        onSuccess: () => onClose(),
      });
    }
  };
  
  const apiErrorMessage = (mutationError as any)?.response?.data?.detail;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Endereço' : 'Adicionar Novo Endereço'}</DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          {apiErrorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
          )}

          <Grid container spacing={2}>
            
            {/* Linha 1: CEP (com Lupa) e Tipo */}
            <Grid xs={12} sm={6}>
              <MaskedInput
                mask="cep"
                label="CEP"
                required
                fullWidth
                autoFocus
                value={cepValue || ""}
                onChange={(value) => setValue('nr_cep', value)}
                error={!!errors.nr_cep}
                helperText={errors.nr_cep?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="buscar cep"
                        onClick={handleBuscaCEP}
                        disabled={isBuscandoCEP || (cepValue || "").replace(/\D/g, '').length !== 8}
                        edge="end"
                        color="primary"
                      >
                        {isBuscandoCEP ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                {...register("tp_endereco")}
                label="Tipo"
                required
                fullWidth
                select
                defaultValue="entrega"
                error={!!errors.tp_endereco}
                helperText={errors.tp_endereco?.message}
              >
                <MenuItem value="entrega">Entrega</MenuItem>
                <MenuItem value="cobranca">Cobrança</MenuItem>
                <MenuItem value="comercial">Comercial</MenuItem>
              </TextField>
            </Grid>

            {/* Linha 2: Logradouro e Número */}
            <Grid xs={12} sm={9}>
              <TextField
                {...register("ds_logradouro")}
                label="Logradouro (Rua, Av.)"
                required
                fullWidth
                InputLabelProps={{ shrink: true }} // Para o auto-complete
                error={!!errors.ds_logradouro}
                helperText={errors.ds_logradouro?.message}
              />
            </Grid>
            <Grid xs={12} sm={3}>
              <TextField
                {...register("nr_endereco")}
                label="Número"
                fullWidth
              />
            </Grid>

            {/* Linha 3: Complemento e Bairro */}
            <Grid xs={12} sm={6}>
              <TextField
                {...register("ds_complemento")}
                label="Complemento"
                fullWidth
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                {...register("no_bairro")}
                label="Bairro"
                fullWidth
                InputLabelProps={{ shrink: true }} // Para o auto-complete
              />
            </Grid>

            {/* Linha 4: Cidade e Estado */}
            <Grid xs={12} sm={8}>
              <TextField
                {...register("no_cidade")}
                label="Cidade"
                required
                fullWidth
                InputLabelProps={{ shrink: true }} // Para o auto-complete
                error={!!errors.no_cidade}
                helperText={errors.no_cidade?.message}
              />
            </Grid>
            <Grid xs={12} sm={4}>
              <TextField
                {...register("sg_estado")}
                label="Estado (UF)"
                required
                fullWidth
                InputLabelProps={{ shrink: true }} // Para o auto-complete
                error={!!errors.sg_estado}
                helperText={errors.sg_estado?.message}
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
                label="Definir como endereço principal"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Salvar Endereço'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};