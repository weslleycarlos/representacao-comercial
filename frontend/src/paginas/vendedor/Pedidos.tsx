// /frontend/src/paginas/vendedor/Pedidos.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip,
  Stack, Card, CardContent, Grid, TextField, InputAdornment,
  Badge, IconButton, Tooltip, Fab
} from '@mui/material';
import { 
  DataGrid, type GridColDef, GridActionsCellItem 
} from '@mui/x-data-grid';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon, 
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

import { useGetMeusPedidos } from '../../api/servicos/vendedorService';
import type { IPedidoCompleto } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';

// Modal de Novo Pedido (será implementado posteriormente)
import { ModalNovoPedido } from '../../componentes/vendedor/ModalNovoPedido';

// Função para dar cor aos status (melhorada com mais variações)nn
const getStatusChipColor = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'entregue':
    case 'confirmado':
    case 'aprovado':
      return "success";
    case 'cancelado':
    case 'recusado':
      return "error";
    case 'pendente':
    case 'em_analise':
      return "warning";
    case 'em_separacao':
    case 'preparando':
      return "secondary";
    case 'enviado':
    case 'transporte':
      return "info";
    default:
      return "default";
  }
};

// Função para ícone do status
const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'entregue': return '✅';
    case 'cancelado': return '❌';
    case 'pendente': return '⏳';
    case 'em_separacao': return '📦';
    case 'enviado': return '🚚';
    default: return '📋';
  }
};

export const PaginaVendedorPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);

  // Hook de Busca (TanStack Query)
  const { 
    data: pedidos, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useGetMeusPedidos();

  // Filtros e busca
  const pedidosFiltrados = React.useMemo(() => {
    if (!pedidos) return [];
    
    return pedidos.filter(pedido => {
      const matchSearch = searchTerm === '' || 
        pedido.nr_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.cliente?.no_razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.empresa?.no_empresa.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'todos' || 
        pedido.st_pedido.toLowerCase() === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [pedidos, searchTerm, statusFilter]);

  // Estatísticas rápidas
  const stats = React.useMemo(() => {
    if (!pedidos) return { total: 0, pendentes: 0, valorTotal: 0 };
    
    const total = pedidos.length;
    const pendentes = pedidos.filter(p => p.st_pedido.toLowerCase() === 'pendente').length;
    const valorTotal = pedidos.reduce((sum, pedido) => sum + (pedido.vl_total || 0), 0);
    
    return { total, pendentes, valorTotal };
  }, [pedidos]);

  // Colunas da tabela (melhoradas visualmente)
  const colunas: GridColDef<IPedidoCompleto>[] = [
    { 
      field: 'nr_pedido', 
      headerName: 'Nº PEDIDO', 
      width: 130,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value, row) => row.nr_pedido || `#${row.id_pedido}`,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="primary">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'cliente', 
      headerName: 'CLIENTE', 
      flex: 2,
      minWidth: 200,
      valueGetter: (value, row) => row.cliente?.no_razao_social || 'Cliente não informado',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          {params.row.empresa?.no_empresa && (
            <Typography variant="caption" color="text.secondary">
              {params.row.empresa.no_empresa}
            </Typography>
          )}
        </Box>
      )
    },
    { 
      field: 'dt_pedido', 
      headerName: 'DATA', 
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueGetter: (value) => new Date(value).toLocaleDateString('pt-BR'),
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'vl_total', 
      headerName: 'VALOR', 
      width: 130,
      headerAlign: 'center',
      align: 'right',
      valueGetter: (value) => formatCurrency(value),
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'st_pedido', 
      headerName: 'STATUS', 
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Chip 
          icon={<span>{getStatusIcon(params.value)}</span>}
          label={params.value.replace(/_/g, ' ').toLowerCase()}
          color={getStatusChipColor(params.value) as any}
          size="small"
          variant="filled"
          sx={{ 
            textTransform: 'capitalize',
            fontWeight: 'medium',
            minWidth: 120
          }}
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'AÇÕES',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Ver detalhes">
              <ViewIcon />
            </Tooltip>
          }
          label="Ver Detalhes"
          onClick={() => { 
            // TODO: Abrir modal de detalhe
            console.log('Ver detalhes do pedido:', params.row.id_pedido);
          }}
          sx={{ color: 'primary.main' }}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Cancelar pedido">
              <CancelIcon />
            </Tooltip>
          }
          label="Cancelar Pedido"
          onClick={() => { 
            // TODO: Abrir modal de cancelamento
            console.log('Cancelar pedido:', params.row.id_pedido);
          }}
          disabled={params.row.st_pedido.toLowerCase() !== 'pendente'}
          sx={{ 
            color: 'error.main',
            '&.Mui-disabled': { opacity: 0.3 }
          }}
        />,
      ],
    },
  ];

  // Status disponíveis para filtro
  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'em_separacao', label: 'Em Separação' },
    { value: 'enviado', label: 'Enviados' },
    { value: 'entregue', label: 'Entregues' },
    { value: 'cancelado', label: 'Cancelados' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* --- HEADER PRINCIPAL --- */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <CartIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Meus Pedidos
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Gerencie todos os seus pedidos em um só lugar
              </Typography>
            </Box>
          </Stack>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalNovoPedidoOpen(true)}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              fontWeight: 'bold',
              px: 3,
              '&:hover': { 
                bgcolor: 'grey.100',
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.2s'
            }}
            size="large"
          >
            Novo Pedido
          </Button>
        </Stack>

        {/* --- CARDS DE ESTATÍSTICAS --- */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold" textAlign="center">
                  {stats.total}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                  Total de Pedidos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold" textAlign="center" color="warning.light">
                  {stats.pendentes}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                  Pendentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h3" fontWeight="bold" textAlign="center" color="success.light">
                  {formatCurrency(stats.valorTotal)}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                  Valor Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* --- BARRA DE FERRAMENTAS --- */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Busca */}
          <TextField
            size="small"
            placeholder="Buscar por cliente, pedido ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, maxWidth: 400 }}
          />

          {/* Filtro de Status */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterIcon color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
              Status:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {statusOptions.map((status) => (
                <Chip
                  key={status.value}
                  label={status.label}
                  variant={statusFilter === status.value ? "filled" : "outlined"}
                  color={statusFilter === status.value ? "primary" : "default"}
                  size="small"
                  onClick={() => setStatusFilter(status.value)}
                  clickable
                />
              ))}
            </Stack>
          </Stack>

          {/* Ações */}
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Recarregar">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Button 
            startIcon={<DownloadIcon />} 
            variant="outlined"
            size="small"
          >
            Exportar
          </Button>
        </Stack>
      </Paper>

      {/* --- ESTADO DE ERRO --- */}
      {isError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Tentar Novamente
            </Button>
          }
        >
          Erro ao carregar pedidos: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      )}

      {/* --- TABELA DE DADOS --- */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: '70vh', 
          width: '100%', 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 3,
          overflow: 'hidden'
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
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={2}>
                <CartIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                <Typography color="text.secondary">
                  {searchTerm || statusFilter !== 'todos' 
                    ? 'Nenhum pedido encontrado com os filtros aplicados' 
                    : 'Nenhum pedido encontrado'
                  }
                </Typography>
                {(searchTerm || statusFilter !== 'todos') && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('todos');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </Stack>
            ),
          }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'dt_pedido', sort: 'desc' }],
            },
          }}
          sx={{ 
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'grey.50',
              borderBottom: '2px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'grey.100',
            },
          }}
        />
      </Paper>

      {/* --- MODAL NOVO PEDIDO --- */}
      <ModalNovoPedido 
        open={modalNovoPedidoOpen}
        onClose={() => setModalNovoPedidoOpen(false)}
        onPedidoCriado={() => {
          setModalNovoPedidoOpen(false);
          refetch(); // Recarrega a lista
        }}
      />

      {/* --- BOTÃO FLUTUANTE PARA MOBILE --- */}
      <Fab
        color="primary"
        aria-label="novo pedido"
        onClick={() => setModalNovoPedidoOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};