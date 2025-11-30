import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import { formatCurrency } from '../../utils/format';
import type { IProdutoCompleto, IVariacaoProduto } from '../../tipos/schemas';

// --- Schema de Validação ---
const variacaoSchema = z.object({
  ds_cor: z.string().min(1, 'Cor é obrigatória'),
  ds_tamanho: z.string().min(1, 'Tamanho é obrigatório'),
  cd_sku: z.string().optional(),
  vl_ajuste_preco: z.coerce.number().default(0),
  qt_estoque: z.coerce.number().min(0, 'Estoque não pode ser negativo').default(0),
});

type VariacaoFormData = z.infer<typeof variacaoSchema>;

interface ModalGerenciarVariacoesProps {
  open: boolean;
  onClose: () => void;
  produto: IProdutoCompleto | null;
}

export const ModalGerenciarVariacoes: React.FC<ModalGerenciarVariacoesProps> = ({
  open,
  onClose,
  produto,
}) => {
  const queryClient = useQueryClient();
  const [erroApi, setErroApi] = useState<string | null>(null);

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariacaoFormData>({
    resolver: zodResolver(variacaoSchema),
    defaultValues: {
      ds_cor: '',
      ds_tamanho: '',
      cd_sku: '',
      vl_ajuste_preco: 0,
      qt_estoque: 0,
    },
  });

  // --- Queries & Mutations ---

  // 1. Listar Variações
  const {
    data: variacoes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['variacoes', produto?.id_produto],
    queryFn: async () => {
      if (!produto) return [];
      const response = await axios.get<IVariacaoProduto[]>(
        `/gestor/catalogo/produtos/${produto.id_produto}/variacoes`
      );
      return response.data;
    },
    enabled: !!produto && open,
  });

  // 2. Criar Variação
  const createMutation = useMutation({
    mutationFn: async (data: VariacaoFormData) => {
      if (!produto) return;
      await axios.post(`/gestor/catalogo/produtos/${produto.id_produto}/variacoes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variacoes', produto?.id_produto] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // Atualiza a lista principal também
      reset(); // Limpa o form
      setErroApi(null);
    },
    onError: (error: any) => {
      setErroApi(error.response?.data?.detail || 'Erro ao criar variação.');
    },
  });

  // 3. Deletar Variação
  const deleteMutation = useMutation({
    mutationFn: async (id_variacao: number) => {
      await axios.delete(`/gestor/catalogo/variacoes/${id_variacao}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variacoes', produto?.id_produto] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: (error: any) => {
      setErroApi(error.response?.data?.detail || 'Erro ao excluir variação.');
    },
  });

  // --- Handlers ---
  const onSubmit = (data: VariacaoFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta variação?')) {
      deleteMutation.mutate(id);
    }
  };

  // Limpar estado ao fechar
  useEffect(() => {
    if (!open) {
      reset();
      setErroApi(null);
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Gerenciar Grade: {produto?.ds_produto}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {erroApi && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erroApi}
          </Alert>
        )}

        {/* Formulário de Adição Rápida */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Adicionar Nova Variação
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid size={{ xs: 6, sm: 2 }}>
                <Controller
                  name="ds_cor"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cor"
                      size="small"
                      fullWidth
                      error={!!errors.ds_cor}
                      helperText={errors.ds_cor?.message}
                      placeholder="Ex: Azul"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Controller
                  name="ds_tamanho"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tamanho"
                      size="small"
                      fullWidth
                      error={!!errors.ds_tamanho}
                      helperText={errors.ds_tamanho?.message}
                      placeholder="Ex: M"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name="cd_sku"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="SKU (Opcional)"
                      size="small"
                      fullWidth
                      error={!!errors.cd_sku}
                      helperText={errors.cd_sku?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Controller
                  name="vl_ajuste_preco"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Ajuste R$"
                      type="number"
                      size="small"
                      fullWidth
                      error={!!errors.vl_ajuste_preco}
                      helperText={errors.vl_ajuste_preco?.message}
                      slotProps={{ htmlInput: { step: '0.01' } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Controller
                  name="qt_estoque"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Estoque"
                      type="number"
                      size="small"
                      fullWidth
                      error={!!errors.qt_estoque}
                      helperText={errors.qt_estoque?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ height: 40, minWidth: 0, p: 0 }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <CircularProgress size={24} /> : <AddIcon />}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Lista de Variações */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Variações Existentes
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">Erro ao carregar variações.</Alert>
        ) : variacoes?.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
            Nenhuma variação cadastrada.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {variacoes?.map((v) => (
              <Paper
                key={v.id_variacao}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Cor/Tamanho
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {v.ds_cor} - {v.ds_tamanho}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      SKU
                    </Typography>
                    <Typography variant="body2">{v.cd_sku || '-'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Ajuste Preço
                    </Typography>
                    <Typography
                      variant="body2"
                      color={v.vl_ajuste_preco > 0 ? 'error.main' : 'text.primary'}
                    >
                      {v.vl_ajuste_preco > 0 ? '+' : ''}
                      {formatCurrency(v.vl_ajuste_preco)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Estoque
                    </Typography>
                    <Typography variant="body2">{v.qt_estoque}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Tooltip title="Excluir Variação">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(v.id_variacao)}
                      disabled={deleteMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
