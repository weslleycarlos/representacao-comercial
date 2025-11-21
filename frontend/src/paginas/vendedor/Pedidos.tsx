// /frontend/src/paginas/vendedor/Pedidos.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Fab,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem, type GridLoadingOverlayProps } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Schedule as PendingIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useGetMeusPedidos, useGetMeuPedidoDetalhe } from '../../api/servicos/vendedorService';
import { useAuth } from '../../contextos/AuthContext';
import type { IPedidoCompleto } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';
import { ModalNovoPedido } from '../../componentes/vendedor/ModalNovoPedido';
import { ModalDetalhePedido } from '../../componentes/vendedor/ModalDetalhePedido';
import { useNavigate } from 'react-router-dom';

// Mapeamento de cores por status
const getStatusChipProps = (status: string) => {
  const s = status.toLowerCase();
  const map: Record<string, { color: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }> = {
    entregue: { color: 'success', label: 'Entregue' },
    confirmado: { color: 'success', label: 'Confirmado' },
    aprovado: { color: 'success', label: 'Aprovado' },
    cancelado: { color: 'error', label: 'Cancelado' },
    recusado: { color: 'error', label: 'Recusado' },
    pendente: { color: 'warning', label: 'Pendente' },
    em_analise: { color: 'warning', label: 'Em Análise' },
    em_separacao: { color: 'info', label: 'Em Separação' },
    preparando: { color: 'info', label: 'Preparando' },
    enviado: { color: 'info', label: 'Enviado' },
    transporte: { color: 'info', label: 'Em Transporte' },
  };
  return map[s] || { color: 'default', label: status.replace(/_/g, ' ') };
};

// Opções de filtro
const statusOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'em_separacao', label: 'Em Separação' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'entregue', label: 'Entregues' },
  { value: 'cancelado', label: 'Cancelados' },
];

export const PaginaVendedorPedidos: React.FC = () => {
  const navigate = useNavigate();
  const { empresaAtiva } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [idPedidoSelecionado, setIdPedidoSelecionado] = useState<number | null>(null);

  const { data: pedidos, isLoading, isError, error, refetch } = useGetMeusPedidos(
    empresaAtiva?.id_empresa
  );

  // Só busca quando tivermos um ID selecionado
  const { 
    data: pedidoDetalhado, 
    isLoading: isLoadingDetalhe 
  } = useGetMeuPedidoDetalhe(idPedidoSelecionado || 0);

  const handleCloseDetalhe = () => {
    setModalDetalheAberto(false);
    setIdPedidoSelecionado(null); // Limpa a seleção para o hook parar de buscar
  };

  // Filtros
  const pedidosFiltrados = useMemo(() => {
    if (!pedidos) return [];
    return pedidos.filter((pedido) => {
      const matchSearch =
        !searchTerm ||
        pedido.nr_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.cliente?.no_razao_social.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'todos' || pedido.st_pedido.toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pedidos, searchTerm, statusFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!pedidos) return { total: 0, pendentes: 0, valorTotal: 0 };
    return {
      total: pedidos.length,
      pendentes: pedidos.filter((p) => p.st_pedido.toLowerCase() === 'pendente').length,
      valorTotal: pedidos.reduce((sum, p) => sum + (Number(p.vl_total) || 0), 0),
    };
  }, [pedidos]);

  // Colunas
  const colunas: GridColDef<IPedidoCompleto>[] = [
    {
      field: 'nr_pedido',
      headerName: 'Nº Pedido',
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      cellClassName: 'center-cell', // Classe CSS adicional se necessário
      valueGetter: (_v, row) => row.nr_pedido || `#${row.id_pedido}`,
      renderCell: ({ value }) => (
        <Typography 
          variant="body2" 
          fontWeight={600} 
          color="primary"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 2,
      minWidth: 200,
      valueGetter: (_v, row) => row.cliente?.no_razao_social || 'Não informado',
    },
    {
      field: 'dt_pedido',
      headerName: 'Data',
      width: 110,
      valueFormatter: (value) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      field: 'vl_total',
      headerName: 'Valor',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(Number(value) || 0),
    },
    {
      field: 'st_pedido',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => {
        const props = getStatusChipProps(value);
        return (
          <Chip
            label={props.label}
            color={props.color}
            size="small"
            sx={{ fontWeight: 500, minWidth: 100 }}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<ViewIcon />}
          label="Ver detalhes"
          onClick={() => {
            setIdPedidoSelecionado(params.row.id_pedido);
            setModalDetalheAberto(true);
          }}
        />,
        <Box
          key="cancel"
          sx={{ '&.Mui-disabled': { opacity: 0.3 } }}
        >
          <GridActionsCellItem
            icon={<CancelIcon />}
            label="Cancelar"
            onClick={() => console.log('Cancelar:', params.row.id_pedido)}
            disabled={params.row.st_pedido.toLowerCase() !== 'pendente'}
          />
        </Box>,
      ],
    },
  ];
  
  const GridLoadingOverlayCustom: React.FC<GridLoadingOverlayProps> = () => (
    <Box sx={{ width: '100%' }}>
      <LinearProgress />
    </Box>
  );
  
  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Meus Pedidos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie e acompanhe seus pedidos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalNovoPedidoOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          Novo Pedido
        </Button>
      </Stack>

      {/* Cards de Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de pedidos
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'warning.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PendingIcon color="warning" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {stats.pendentes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aguardando
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'success.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoneyIcon color="success" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(stats.valorTotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valor total
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Barra de Filtros */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            size="small"
            placeholder="Buscar por pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: { md: 300 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
            {statusOptions.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                variant={statusFilter === opt.value ? 'filled' : 'outlined'}
                color={statusFilter === opt.value ? 'primary' : 'default'}
                size="small"
                onClick={() => setStatusFilter(opt.value)}
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Atualizar">
              <IconButton onClick={() => refetch()} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
              Exportar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Erro */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Erro ao carregar pedidos: {(error as Error)?.message}
        </Alert>
      )}

      {/* Tabela */}
      <Paper
        elevation={0}
        sx={{
          height: 'calc(100vh - 420px)',
          minHeight: 400,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <DataGrid
          rows={pedidosFiltrados}
          columns={colunas}
          getRowId={(row) => row.id_pedido}
          loading={isLoading}
          slots={{
            loadingOverlay: LinearProgress,
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} p={3}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="subtitle1" color="text.secondary">
                  {searchTerm || statusFilter !== 'todos'
                    ? 'Nenhum pedido encontrado'
                    : 'Você ainda não tem pedidos'}
                </Typography>
                {(searchTerm || statusFilter !== 'todos') && (
                  <Button
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('todos');
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </Stack>
            ),
          }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'dt_pedido', sort: 'desc' }] },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
          }}
        />
      </Paper>

      {/* Modal */}
      <ModalNovoPedido
        open={modalNovoPedidoOpen}
        onClose={() => setModalNovoPedidoOpen(false)}
        onPedidoCriado={() => {
          setModalNovoPedidoOpen(false);
          refetch();
        }}
      />

      {/* FAB Mobile */}
      <Fab
        color="primary"
        onClick={() => setModalNovoPedidoOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24, display: { xs: 'flex', md: 'none' } }}
      >
        <AddIcon />
      </Fab>
      {/* --- ADICIONE O MODAL DE DETALHE --- */}
      {modalDetalheAberto && (
        <ModalDetalhePedido
          open={modalDetalheAberto}
          onClose={handleCloseDetalhe}
          // Passa o pedidoDetalhado que veio do hook (ou undefined enquanto carrega)
          pedido={pedidoDetalhado}
        />
      )}
      
      {/* (ModalNovoPedido...) */}
    </Box>
  );
};