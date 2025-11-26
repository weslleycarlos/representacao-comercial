// /frontend/src/paginas/gestor/Relatorios.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Tabs, Tab, TextField, Stack, Chip } from '@mui/material';
import { DataGrid, type GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
import {
  useRelatorioVendasVendedor,
  useRelatorioVendasEmpresa,
  useRelatorioVendasCidade,
  useRelatorioComissoes,
} from '../../api/servicos/relatorioService';

// --- Componentes de Tabela ---

const TabelaVendedor = ({ start, end }: { start: string; end: string }) => {
  const { data, isLoading } = useRelatorioVendasVendedor(start, end);

  const colunas: GridColDef[] = [
    { field: 'no_vendedor', headerName: 'Vendedor', flex: 1.5, minWidth: 180 },
    {
      field: 'qt_pedidos',
      headerName: 'Pedidos',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'vl_total_vendas',
      headerName: 'Total Vendas',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'vl_ticket_medio',
      headerName: 'Ticket Médio',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
  ];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={data || []}
        columns={colunas}
        loading={isLoading}
        getRowId={(row) => row.id_usuario}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
        }}
      />
    </Box>
  );
};

const TabelaEmpresa = ({ start, end }: { start: string; end: string }) => {
  const { data, isLoading } = useRelatorioVendasEmpresa(start, end);

  const colunas: GridColDef[] = [
    { field: 'no_empresa', headerName: 'Empresa Representada', flex: 1.5, minWidth: 200 },
    {
      field: 'qt_pedidos',
      headerName: 'Pedidos',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'qt_clientes_atendidos',
      headerName: 'Clientes',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'vl_total_vendas',
      headerName: 'Total Vendas',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
  ];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={data || []}
        columns={colunas}
        loading={isLoading}
        getRowId={(row) => row.id_empresa}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
        }}
      />
    </Box>
  );
};

const TabelaCidade = ({ start, end }: { start: string; end: string }) => {
  const { data, isLoading } = useRelatorioVendasCidade(start, end);

  const colunas: GridColDef[] = [
    { field: 'no_cidade', headerName: 'Cidade', flex: 1, minWidth: 150 },
    { field: 'sg_estado', headerName: 'UF', width: 80 },
    {
      field: 'qt_pedidos',
      headerName: 'Pedidos',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'vl_total_vendas',
      headerName: 'Total Vendas',
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
  ];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={data || []}
        columns={colunas}
        loading={isLoading}
        getRowId={(row) => `${row.no_cidade}-${row.sg_estado}`}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
        }}
      />
    </Box>
  );
};

const TabelaComissao = ({ start, end }: { start: string; end: string }) => {
  const { data, isLoading } = useRelatorioComissoes(start, end);

  const colunas: GridColDef[] = [
    {
      field: 'nr_pedido',
      headerName: 'Pedido',
      width: 100,
      valueGetter: (_value, row) => row.nr_pedido || `#${row.id_pedido}`,
    },
    {
      field: 'dt_pedido',
      headerName: 'Data',
      width: 110,
      valueFormatter: (value) => new Date(value).toLocaleDateString('pt-BR'),
    },
    { field: 'no_vendedor', headerName: 'Vendedor', flex: 1, minWidth: 150 },
    { field: 'no_empresa', headerName: 'Empresa', flex: 1, minWidth: 150 },
    {
      field: 'vl_total',
      headerName: 'Valor Pedido',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'pc_comissao_aplicada',
      headerName: '% Com.',
      width: 90,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => `${value}%`,
    },
    {
      field: 'vl_comissao_calculada',
      headerName: 'Comissão',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="success.main">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={data || []}
        columns={colunas}
        loading={isLoading}
        getRowId={(row) => row.id_pedido}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
        }}
      />
    </Box>
  );
};

// --- Página Principal ---

export const PaginaRelatorios: React.FC = () => {
  const [abaAtual, setAbaAtual] = useState(0);

  // Datas padrão (mês atual)
  const [dataInicio, dataFim] = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    return [firstDay, lastDay];
  }, []);

  const [dataInicioState, setDataInicioState] = useState(dataInicio);
  const [dataFimState, setDataFimState] = useState(dataFim);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Relatórios Gerenciais
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analise o desempenho de vendas e comissões
        </Typography>
      </Box>

      {/* Filtro de Período */}
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
            <CalendarIcon color="action" fontSize="small" />
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Período:
            </Typography>
          </Stack>

          <TextField
            label="Data Início"
            type="date"
            size="small"
            value={dataInicioState}
            onChange={(e) => setDataInicioState(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 180 } }}
          />

          <TextField
            label="Data Fim"
            type="date"
            size="small"
            value={dataFimState}
            onChange={(e) => setDataFimState(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 180 } }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Chip
            label={`${new Date(dataInicioState).toLocaleDateString('pt-BR')} - ${new Date(
              dataFimState
            ).toLocaleDateString('pt-BR')}`}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Stack>
      </Paper>

      {/* Abas e Tabelas */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={abaAtual}
            onChange={(_e, newValue) => setAbaAtual(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Por Vendedor" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab label="Por Empresa" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab label="Por Cidade" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab label="Comissões" sx={{ textTransform: 'none', fontWeight: 500 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {abaAtual === 0 && <TabelaVendedor start={dataInicioState} end={dataFimState} />}
          {abaAtual === 1 && <TabelaEmpresa start={dataInicioState} end={dataFimState} />}
          {abaAtual === 2 && <TabelaCidade start={dataInicioState} end={dataFimState} />}
          {abaAtual === 3 && <TabelaComissao start={dataInicioState} end={dataFimState} />}
        </Box>
      </Paper>
    </Box>
  );
};