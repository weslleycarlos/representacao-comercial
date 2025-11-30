// /frontend/src/componentes/vendedor/ModalDetalhePedido.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Grid, Paper, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Stack, IconButton, Skeleton
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon, Email as EmailIcon } from '@mui/icons-material';

import type { IPedidoCompleto } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';
import { useResendEmail } from '../../api/servicos/vendedorService';

interface ModalDetalhePedidoProps {
  open: boolean;
  onClose: () => void;
  pedido?: IPedidoCompleto;
  onResendEmail?: (id: number) => void;
  isResending?: boolean;
}

// Helper para cor do status
const getStatusColor = (status: string) => {
  const safeStatus = (status || '').toLowerCase();
  switch (safeStatus) {
    case 'entregue': case 'confirmado': return "success";
    case 'cancelado': return "error";
    case 'pendente': return "warning";
    case 'em_separacao': return "info";
    default: return "default";
  }
};

export const ModalDetalhePedido: React.FC<ModalDetalhePedidoProps> = ({
  open,
  onClose,
  pedido,
  onResendEmail,
  isResending: externalIsResending
}) => {
  const { mutate: internalResendEmail, isPending: internalIsResending } = useResendEmail();

  const handleResendEmail = (id: number) => {
    if (onResendEmail) {
      onResendEmail(id);
    } else {
      internalResendEmail(id, {
        onSuccess: () => alert("Email reenviado com sucesso!"),
        onError: () => alert("Erro ao reenviar email.")
      });
    }
  };

  const isResending = externalIsResending !== undefined ? externalIsResending : internalIsResending;

  // Loading state
  if (!pedido) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Skeleton variant="text" height={40} width="40%" />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  const statusLabel = (pedido.st_pedido || 'desconhecido').replace(/_/g, " ").toUpperCase();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: { xs: '90vh', md: 'auto' },
          margin: { xs: 1, md: 2 }
        }
      }}
    >
      {/* --- HEADER --- */}
      <DialogTitle sx={{ pb: 1, pt: { xs: 2, md: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pedido #{pedido.nr_pedido || pedido.id_pedido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Realizado em: {pedido.dt_pedido ? new Date(pedido.dt_pedido).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={statusLabel}
              color={getStatusColor(pedido.st_pedido)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>

          {/* --- 1. DADOS DO CLIENTE --- */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                👤 DADOS DO CLIENTE
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {pedido.cliente?.no_razao_social}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Fantasia: {pedido.cliente?.no_fantasia || '-'}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    CNPJ: {pedido.cliente?.nr_cnpj}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    <strong>Contato:</strong> {pedido.cliente?.ds_email || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tel:</strong> {pedido.cliente?.nr_telefone || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* --- 2. ENDEREÇOS --- */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📍 ENDEREÇO DE ENTREGA
              </Typography>
              {pedido.endereco_entrega ? (
                <>
                  <Typography variant="body2">
                    {pedido.endereco_entrega.ds_logradouro}, {pedido.endereco_entrega.nr_endereco}
                  </Typography>
                  <Typography variant="body2">
                    {pedido.endereco_entrega.no_bairro} - {pedido.endereco_entrega.no_cidade}/{pedido.endereco_entrega.sg_estado}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    CEP: {pedido.endereco_entrega.nr_cep}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="error">Não informado</Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📄 ENDEREÇO DE COBRANÇA
              </Typography>
              {pedido.endereco_cobranca ? (
                <>
                  <Typography variant="body2">
                    {pedido.endereco_cobranca.ds_logradouro}, {pedido.endereco_cobranca.nr_endereco}
                  </Typography>
                  <Typography variant="body2">
                    {pedido.endereco_cobranca.no_bairro} - {pedido.endereco_cobranca.no_cidade}/{pedido.endereco_cobranca.sg_estado}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    CEP: {pedido.endereco_cobranca.nr_cep}
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="error">Não informado</Typography>
              )}
            </Paper>
          </Grid>

          {/* --- 3. ITENS DO PEDIDO --- */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              🛒 ITENS DO PEDIDO
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                maxHeight: { xs: 300, md: 400 },
                overflow: 'auto'
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ minWidth: 200 }}>Produto</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Qtd</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>Unitário</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Desc. (%)</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido.itens && pedido.itens.map((item) => (
                    <TableRow key={item.id_item_pedido}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {item.produto ? item.produto.ds_produto : 'Produto Indisponível'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cód: {item.produto ? item.produto.cd_produto : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{item.qt_quantidade}</TableCell>
                      <TableCell align="right">{formatCurrency(item.vl_unitario)}</TableCell>
                      <TableCell align="center">
                        {item.pc_desconto_item > 0 ? (
                          <Chip
                            label={`-${item.pc_desconto_item}%`}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              minWidth: 50
                            }}
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.vl_total_item)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* --- 4. OBSERVAÇÕES E TOTAIS --- */}
          <Grid size={{ xs: 12, md: 7 }}>
            {pedido.ds_observacoes && (
              <Box sx={{
                p: 2,
                bgcolor: 'warning.50',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'warning.main',
                height: '100%'
              }}>
                <Typography variant="caption" fontWeight="bold" color="warning.dark">
                  📝 OBSERVAÇÕES:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {pedido.ds_observacoes}
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Forma de Pagamento:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {pedido.forma_pagamento?.no_forma_pagamento || 'N/A'}
                  </Typography>
                </Stack>

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(pedido.vl_total)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<PrintIcon />}
          color="inherit"
          variant="outlined"
          size="large"
        >
          Imprimir
        </Button>
        <Button
          startIcon={<EmailIcon />}
          color="inherit"
          disabled={isResending}
          onClick={() => {
            if (pedido) {
              handleResendEmail(pedido.id_pedido);
            }
          }}
        >
          {isResending ? "Enviando..." : "Reenviar Email"}
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{ minWidth: 100 }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};