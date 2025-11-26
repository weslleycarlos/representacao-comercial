// /frontend/src/paginas/gestor/Logs.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, TextField, Stack, MenuItem, Chip, Tooltip } from '@mui/material';
import { DataGrid, type GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useGetLogsGestor } from '../../api/servicos/logService';
import { useGetVendedores } from '../../api/servicos/vendedorService';
import type { ILogAuditoria } from '../../tipos/schemas';

// Cores por tipo de ação
const getActionColor = (action: string): 'success' | 'warning' | 'error' | 'default' => {
  const actionMap: Record<string, 'success' | 'warning' | 'error'> = {
    create: 'success',
    update: 'warning',
    delete: 'error',
  };
  return actionMap[action.toLowerCase()] || 'default';
};

// Opções de entidades
const entidadeOptions = [
  { value: '', label: 'Todas' },
  { value: 'Produto', label: 'Produto' },
  { value: 'Pedido', label: 'Pedido' },
  { value: 'Cliente', label: 'Cliente' },
  { value: 'Empresa', label: 'Empresa' },
  { value: 'Catalogo', label: 'Catálogo' },
];

export const PaginaLogs: React.FC = () => {
  // Datas padrão (últimos 30 dias)
  const [dataInicio, dataFim] = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0];
    return [lastMonth, today];
  }, []);

  const [dataInicioState, setDataInicioState] = useState(dataInicio);
  const [dataFimState, setDataFimState] = useState(dataFim);
  const [filtroUsuario, setFiltroUsuario] = useState<number | ''>('');
  const [filtroEntidade, setFiltroEntidade] = useState('');

  // Buscar dados
  const { data: logs, isLoading } = useGetLogsGestor({
    id_usuario: filtroUsuario === '' ? undefined : filtroUsuario,
    tp_entidade: filtroEntidade === '' ? undefined : filtroEntidade,
    start_date: dataInicioState,
    end_date: dataFimState,
  });

  const { data: usuarios } = useGetVendedores();

  // Colunas
  const colunas: GridColDef<ILogAuditoria>[] = useMemo(
    () => [
      {
        field: 'dt_acao',
        headerName: 'Data/Hora',
        width: 160,
        valueFormatter: (value) => new Date(value).toLocaleString('pt-BR'),
      },
      {
        field: 'usuario',
        headerName: 'Usuário',
        width: 180,
        valueGetter: (_v, row) =>
          row.usuario?.no_completo || row.usuario?.ds_email || 'Sistema',
      },
      {
        field: 'tp_acao',
        headerName: 'Ação',
        width: 100,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip
              label={params.value.toUpperCase()}
              color={getActionColor(params.value)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, minWidth: 80 }}
            />
          </Box>
        ),
      },
      {
        field: 'tp_entidade',
        headerName: 'Entidade',
        width: 120,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip label={params.value} size="small" sx={{ bgcolor: 'action.hover' }} />
          </Box>
        ),
      },
      {
        field: 'id_entidade',
        headerName: 'ID Ref.',
        width: 90,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'detalhes',
        headerName: 'Detalhes (Alterações)',
        flex: 1,
        minWidth: 300,
        renderCell: (params) => {
          const oldVal = params.row.ds_valores_antigos;
          const newVal = params.row.ds_valores_novos;

          if (!oldVal && !newVal) {
            return (
              <Typography variant="caption" color="text.secondary">
                -
              </Typography>
            );
          }

          if (params.row.tp_acao === 'UPDATE') {
            const changedFields = Object.keys(newVal || {});
            return (
              <Tooltip title={JSON.stringify(newVal, null, 2)} arrow>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    cursor: 'help',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {changedFields.length > 0
                    ? `${changedFields.join(', ')} alterado(s)`
                    : 'Ver alterações'}
                </Typography>
              </Tooltip>
            );
          }

          return (
            <Tooltip title={JSON.stringify(newVal || oldVal, null, 2)} arrow>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'help', '&:hover': { color: 'primary.main' } }}
              >
                Ver dados JSON
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    []
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Logs de Auditoria
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Histórico de atividades e segurança da organização
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarIcon color="action" fontSize="small" />
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Filtros:
            </Typography>
          </Stack>

          <TextField
            label="Data Início"
            type="date"
            size="small"
            value={dataInicioState}
            onChange={(e) => setDataInicioState(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />

          <TextField
            label="Data Fim"
            type="date"
            size="small"
            value={dataFimState}
            onChange={(e) => setDataFimState(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />

          <TextField
            select
            label="Usuário"
            size="small"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(usuarios || []).map((u) => (
              <MenuItem key={u.id_usuario} value={u.id_usuario}>
                {u.no_completo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Entidade"
            size="small"
            value={filtroEntidade}
            onChange={(e) => setFiltroEntidade(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {entidadeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Tabela */}
      <Paper
        elevation={0}
        sx={{
          height: 'calc(100vh - 320px)',
          minHeight: 500,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <DataGrid
          rows={logs || []}
          columns={colunas}
          getRowId={(row) => row.id_log}
          loading={isLoading}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              printOptions: { disableToolbarButton: true },
            },
          }}
          initialState={{
            sorting: { sortModel: [{ field: 'dt_acao', sort: 'desc' }] },
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </Paper>
    </Box>
  );
};