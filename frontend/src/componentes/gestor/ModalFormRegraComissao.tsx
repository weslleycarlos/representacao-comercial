import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  Checkbox, FormControlLabel, Box, MenuItem, Typography
} from '@mui/material';

import { type RegraComissaoFormData, regraComissaoSchema } from '../../tipos/validacao';
import type { IRegraComissao } from '../../tipos/schemas';
import { useCreateRegraComissao, useUpdateRegraComissao } from '../../api/servicos/gestorConfigService';
import { useGetEmpresas } from '../../api/servicos/empresaService';
import { useGetVendedores } from '../../api/servicos/vendedorService';

interface Props {
  open: boolean;
  onClose: () => void;
  regra?: IRegraComissao;
}

export const ModalFormRegraComissao: React.FC<Props> = ({ open, onClose, regra }) => {
  const isEditMode = !!regra;

  // Busca listas para os dropdowns
  const {  data: empresas, isLoading: loadingEmpresas } = useGetEmpresas();
  const {  data: vendedores, isLoading: loadingVendedores } = useGetVendedores();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RegraComissaoFormData>({
    resolver: zodResolver(regraComissaoSchema),
    defaultValues: {
      pc_comissao: 0, nr_prioridade: 0, fl_ativa: true,
      id_empresa: null, id_usuario: null
    }
  });

  const { mutate: create, isPending: isCreating, error: createError } = useCreateRegraComissao();
  const { mutate: update, isPending: isUpdating, error: updateError } = useUpdateRegraComissao();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  useEffect(() => {
    if (open) {
      if (isEditMode && regra) {
        // Formata datas para o input type="date"
        const inicio = regra.dt_inicio_vigencia ? regra.dt_inicio_vigencia.split('T')[0] : '';
        const fim = regra.dt_fim_vigencia ? regra.dt_fim_vigencia.split('T')[0] : '';

        reset({
          ...regra,
          dt_inicio_vigencia: inicio as any,
          dt_fim_vigencia: fim as any,
          // Se vier nulo do banco, garante que o form receba null (para o seletor "Todos")
          id_empresa: regra.id_empresa || null,
          id_usuario: regra.id_usuario || null
        });
      } else {
        reset({
          pc_comissao: 0, nr_prioridade: 0, fl_ativa: true,
          id_empresa: null, id_usuario: null,
          dt_inicio_vigencia: null, dt_fim_vigencia: null
        });
      }
    }
  }, [open, regra, isEditMode, reset]);

  const onSubmit = ( RegraComissaoFormData) => {
    // Tratamento de datas vazias para null
    const payload = { ...data };
    if (!payload.dt_inicio_vigencia) payload.dt_inicio_vigencia = null;
    if (!payload.dt_fim_vigencia) payload.dt_fim_vigencia = null;

    if (isEditMode && regra) {
      update({ id: regra.id_regra_comissao, data: payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
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
        <Typography variant="h6" fontWeight={600} component="span">
          {isEditMode ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
        </Typography>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          {apiErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Defina exceções de comissão. Se os campos "Empresa" e "Vendedor" ficarem como "Todos",
            a regra será aplicada globalmente na organização. Use a "Prioridade" para resolver conflitos.
          </Typography>

          <Grid container spacing={2}>
            {/* Percentual e Prioridade */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('pc_comissao', { valueAsNumber: true })}
                label="Percentual de Comissão (%)"
                type="number"
                required
                fullWidth
                autoFocus
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                error={!!errors.pc_comissao}
                helperText={errors.pc_comissao?.message}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('nr_prioridade', { valueAsNumber: true })}
                label="Prioridade (0 = Baixa, 100 = Alta)"
                type="number"
                fullWidth
                helperText="Regras com maior prioridade sobrescrevem outras."
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>

            {/* Seletores (Empresa e Vendedor) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="id_empresa"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Empresa Representada"
                    fullWidth
                    value={field.value ?? 0} // 0 = Todos
                    onChange={(e) => field.onChange(Number(e.target.value) === 0 ? null : Number(e.target.value))}
                    disabled={loadingEmpresas}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  >
                    <MenuItem value={0}><em>Todas as Empresas</em></MenuItem>
                    {(empresas || []).map(emp => (
                      <MenuItem key={emp.id_empresa} value={emp.id_empresa}>{emp.no_empresa}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="id_usuario"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Vendedor"
                    fullWidth
                    value={field.value ?? 0} // 0 = Todos
                    onChange={(e) => field.onChange(Number(e.target.value) === 0 ? null : Number(e.target.value))}
                    disabled={loadingVendedores}
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  >
                    <MenuItem value={0}><em>Todos os Vendedores</em></MenuItem>
                    {(vendedores || []).map(vend => (
                      <MenuItem key={vend.id_usuario} value={vend.id_usuario}>{vend.no_completo}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Vigência */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('dt_inicio_vigencia')}
                label="Início da Vigência"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Opcional (Válido a partir de hoje se vazio)"
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('dt_fim_vigencia')}
                label="Fim da Vigência"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dt_fim_vigencia}
                helperText={errors.dt_fim_vigencia?.message || "Opcional (Sem data fim)"}
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
                label="Regra Ativa"
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