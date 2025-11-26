import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress, Alert, Typography, Box
} from '@mui/material';

import { type PedidoStatusFormData, pedidoStatusSchema } from '../../tipos/validacao';
import type { IPedidoCompleto } from '../../tipos/schemas';
import { useUpdateStatusPedido } from '../../api/servicos/gestorPedidoService';

interface ModalMudarStatusProps {
  open: boolean;
  onClose: () => void;
  pedido: IPedidoCompleto;
}

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado (Aprovado)' },
  { value: 'em_separacao', label: 'Em Separação' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const ModalMudarStatus: React.FC<ModalMudarStatusProps> = ({ open, onClose, pedido }) => {
  const {
    register, handleSubmit, formState: { errors }
  } = useForm<PedidoStatusFormData>({
    resolver: zodResolver(pedidoStatusSchema),
    defaultValues: {
      novo_status: pedido.st_pedido, // Começa com o status atual
    }
  });

  const { mutate: updateStatus, isPending, error } = useUpdateStatusPedido();

  // --- CORREÇÃO AQUI: O argumento DEVE se chamar 'data' ---
  const onSubmit = (data: PedidoStatusFormData) => {
    // Verifica se houve mudança real
    if (data.novo_status === pedido.st_pedido) {
      onClose();
      return;
    }

    // Agora 'data' existe e pode ser usada aqui
    updateStatus({ idPedido: pedido.id_pedido, data }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600} component="span">
          Alterar Status do Pedido #{pedido.nr_pedido || pedido.id_pedido}
        </Typography>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Status Atual: <strong>{pedido.st_pedido.toUpperCase()}</strong>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(error as any)?.response?.data?.detail || "Erro ao atualizar status."}
            </Alert>
          )}

          <TextField
            {...register("novo_status")}
            select
            label="Novo Status"
            fullWidth
            defaultValue={pedido.st_pedido}
            error={!!errors.novo_status}
            helperText={errors.novo_status?.message}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={isPending} size="large">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending} size="large">
            {isPending ? <CircularProgress size={24} /> : 'Salvar Alteração'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};