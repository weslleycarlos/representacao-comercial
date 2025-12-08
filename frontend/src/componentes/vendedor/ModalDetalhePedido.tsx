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

  const handlePrint = () => {
    if (!pedido) return;

    // Cria uma janela oculta para impressão
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) {
      alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.');
      return;
    }

    const itensHTML = pedido.itens?.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">
          <strong>${item.produto?.ds_produto || 'Produto Indisponível'}</strong><br>
          Cód: ${item.produto?.cd_produto || '-'}
        </td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qt_quantidade}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.vl_unitario)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.pc_desconto_item > 0 ? `-${item.pc_desconto_item}%` : '-'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(item.vl_total_item)}</td>
      </tr>
    `).join('') || '';

    const dataFormatada = pedido.dt_pedido 
      ? new Date(pedido.dt_pedido).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${pedido.nr_pedido || pedido.id_pedido}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; background-color: white; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          
          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            margin-top: 10px;
          }
          .status-success { background-color: #4caf50; color: white; }
          .status-error { background-color: #f44336; color: white; }
          .status-warning { background-color: #ff9800; color: white; }
          .status-info { background-color: #2196f3; color: white; }
          .status-default { background-color: #9e9e9e; color: white; }
          
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: bold; background-color: #f5f5f5; padding: 10px; border-left: 4px solid #1976d2; margin-bottom: 10px; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .grid-item { padding: 10px 0; }
          .grid-item label { display: block; font-size: 12px; color: #666; margin-bottom: 2px; }
          .grid-item span { display: block; font-size: 13px; font-weight: 500; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }
          td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          
          .totals { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          .total-row { display: flex; justify-content: flex-end; margin-bottom: 10px; gap: 40px; }
          .total-label { font-weight: bold; min-width: 150px; }
          .total-value { text-align: right; min-width: 120px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #1976d2; }
          
          .observations { background-color: #fff9e6; border-left: 4px solid #ff9800; padding: 10px; margin-top: 20px; font-size: 12px; }
          .observations label { display: block; font-weight: bold; margin-bottom: 5px; }
          
          .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 11px; color: #999; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PEDIDO #${pedido.nr_pedido || pedido.id_pedido}</h1>
          <p>Realizado em: ${dataFormatada}</p>
          <span class="status-badge status-${pedido.st_pedido?.toLowerCase() || 'default'}">
            ${(pedido.st_pedido || 'desconhecido').replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <div class="section">
          <div class="section-title">👤 DADOS DO CLIENTE</div>
          <div class="grid-2">
            <div class="grid-item">
              <label>Razão Social</label>
              <span>${pedido.cliente?.no_razao_social || '-'}</span>
              <label style="margin-top: 8px;">Fantasia</label>
              <span>${pedido.cliente?.no_fantasia || '-'}</span>
              <label style="margin-top: 8px;">CNPJ</label>
              <span>${pedido.cliente?.nr_cnpj || '-'}</span>
            </div>
            <div class="grid-item">
              <label>Email</label>
              <span>${pedido.cliente?.ds_email || '-'}</span>
              <label style="margin-top: 8px;">Telefone</label>
              <span>${pedido.cliente?.nr_telefone || '-'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="grid-2">
            <div>
              <div class="section-title">📍 ENDEREÇO DE ENTREGA</div>
              ${pedido.endereco_entrega ? `
                <div class="grid-item">
                  <span>${pedido.endereco_entrega.ds_logradouro}, ${pedido.endereco_entrega.nr_endereco}</span>
                  <span>${pedido.endereco_entrega.no_bairro} - ${pedido.endereco_entrega.no_cidade}/${pedido.endereco_entrega.sg_estado}</span>
                  <span>CEP: ${pedido.endereco_entrega.nr_cep}</span>
                </div>
              ` : '<span style="color: red;">Não informado</span>'}
            </div>
            <div>
              <div class="section-title">📄 ENDEREÇO DE COBRANÇA</div>
              ${pedido.endereco_cobranca ? `
                <div class="grid-item">
                  <span>${pedido.endereco_cobranca.ds_logradouro}, ${pedido.endereco_cobranca.nr_endereco}</span>
                  <span>${pedido.endereco_cobranca.no_bairro} - ${pedido.endereco_cobranca.no_cidade}/${pedido.endereco_cobranca.sg_estado}</span>
                  <span>CEP: ${pedido.endereco_cobranca.nr_cep}</span>
                </div>
              ` : '<span style="color: red;">Não informado</span>'}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🛒 ITENS DO PEDIDO</div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style="width: 80px; text-align: center;">Qtd</th>
                <th style="width: 100px; text-align: right;">Unitário</th>
                <th style="width: 100px; text-align: center;">Desc. (%)</th>
                <th style="width: 120px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensHTML}
            </tbody>
          </table>
        </div>

        <div class="section">
          ${pedido.ds_observacoes ? `
            <div class="observations">
              <label>📝 OBSERVAÇÕES:</label>
              <p>${pedido.ds_observacoes.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
          
          <div class="totals">
            <div class="total-row">
              <span class="total-label">Forma de Pagamento:</span>
              <span class="total-value">${pedido.forma_pagamento?.no_forma_pagamento || 'N/A'}</span>
            </div>
            <div class="total-row" style="border-top: 1px solid #ddd; padding-top: 10px;">
              <span class="total-label grand-total">TOTAL:</span>
              <span class="total-value grand-total">${formatCurrency(pedido.vl_total)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Aguarda o carregamento antes de chamar print
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
          onClick={handlePrint}
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