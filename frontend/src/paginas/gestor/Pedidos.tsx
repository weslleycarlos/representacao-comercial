// /frontend/src/paginas/gestor/Pedidos.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useGetPedidosGestor } from '../../api/servicos/gestorPedidoService';
import { useGetVendedores } from '../../api/servicos/vendedorService';
import type { IPedidoCompleto } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';
import { ModalDetalhePedido } from '../../componentes/vendedor/ModalDetalhePedido';
import { ModalMudarStatus } from '../../componentes/gestor/ModalMudarStatus';

// Mapeamento de status
const getStatusChipProps = (status: string) => {
  const s = status.toLowerCase();
  const map: Record<
    string,
    { color: 'success' | 'error' | 'warning' | 'info' | 'default'; label: string }
  > = {
    entregue: { color: 'success', label: 'Entregue' },
    confirmado: { color: 'success', label: 'Confirmado' },
    cancelado: { color: 'error', label: 'Cancelado' },
    pendente: { color: 'warning', label: 'Pendente' },
    em_separacao: { color: 'info', label: 'Em Separação' },
    enviado: { color: 'info', label: 'Enviado' },
  };
  return map[s] || { color: 'default', label: status.replace(/_/g, ' ') };
};

// Opções de status
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_separacao', label: 'Em Separação' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const PaginaGestorPedidos: React.FC = () => {
  const [filtroVendedor, setFiltroVendedor] = useState<number | ''>('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalDetalheOpen, setModalDetalheOpen] = useState(false);
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<IPedidoCompleto | undefined>();

  // Buscar dados
  const { data: pedidos, isLoading, isError, error } = useGetPedidosGestor({
    id_vendedor: filtroVendedor === '' ? undefined : filtroVendedor,
    st_pedido: filtroStatus === '' ? undefined : filtroStatus,
  });

  const { data: listaVendedores } = useGetVendedores();

  // Colunas
  const colunas: GridColDef<IPedidoCompleto>[] = useMemo(
    () => [
      {
        field: 'nr_pedido',
        headerName: 'Nº Pedido',
        width: 110,
        valueGetter: (_v, row) => row.nr_pedido || `#${row.id_pedido}`,
        renderCell: ({ value }) => (
          <Typography variant="body2" fontWeight={600} color="primary">
            {value}
          </Typography>
        ),
      },
      {
        field: 'dt_pedido',
        headerName: 'Data',
        width: 110,
        valueFormatter: (value) => new Date(value).toLocaleDateString('pt-BR'),
      },
      {
        field: 'vendedor',
        headerName: 'Vendedor',
        flex: 1,
        minWidth: 150,
        valueGetter: (_v, row) => row.vendedor?.no_completo || 'N/A',
      },
      {
        field: 'cliente',
        headerName: 'Cliente',
        flex: 1.5,
        minWidth: 180,
        valueGetter: (_v, row) => row.cliente?.no_razao_social || 'N/A',
      },
      {
        field: 'empresa',
        headerName: 'Empresa',
        flex: 1,
        minWidth: 150,
        valueGetter: (_v, row) => row.empresa?.no_empresa,
      },
      {
        field: 'vl_total',
        headerName: 'Total',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => formatCurrency(value),
      },
      {
        field: 'st_pedido',
        headerName: 'Status',
        width: 140,
        renderCell: ({ value }) => {
          const props = getStatusChipProps(value);
          return <Chip label={props.label} color={props.color} size="small" sx={{ fontWeight: 500 }} />;
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
              setPedidoSelecionado(params.row);
              setModalDetalheOpen(true);
            }}
          />,
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Alterar status"
            onClick={() => {
              setPedidoSelecionado(params.row);
              setModalStatusOpen(true);
            }}
          />,
        ],
      },
    ],
    []
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Gestão de Pedidos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize e gerencie todos os pedidos
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterIcon color="action" fontSize="small" />
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Filtros:
            </Typography>
          </Stack>

          <TextField
            select
            label="Status"
            size="small"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {statusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Vendedor"
            size="small"
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(listaVendedores || []).map((v) => (
              <MenuItem key={v.id_usuario} value={v.id_usuario}>
                {v.no_completo}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Erro ao carregar pedidos: {(error as Error)?.message}
        </Alert>
      )}

      {/* Tabela */}
      <Paper
        elevation={0}
        sx={{
          height: 'calc(100vh - 320px)',
          minHeight: 400,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <DataGrid
          rows={pedidos || []}
          columns={colunas}
          getRowId={(row) => row.id_pedido}
          loading={isLoading}
          slots={{ loadingOverlay: LinearProgress }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'dt_pedido', sort: 'desc' }] },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Modais */}
      {modalDetalheOpen && pedidoSelecionado && (
        <ModalDetalhePedido
          open={modalDetalheOpen}
          onClose={() => setModalDetalheOpen(false)}
          pedido={pedidoSelecionado}
        />
      )}

      {modalStatusOpen && pedidoSelecionado && (
        <ModalMudarStatus
          open={modalStatusOpen}
          onClose={() => setModalStatusOpen(false)}
          pedido={pedidoSelecionado}
        />
      )}
    </Box>
  );
};