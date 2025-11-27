// /frontend/src/paginas/admin/Logs.tsx
import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  InputAdornment,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { 
  DataGrid, 
  GridToolbar,
  type GridColDef,
  GridActionsCellItem
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useGetLogsAdmin } from '../../api/servicos/adminService';

// Tipos de ação e suas configurações
const ACOES_CONFIG: Record<string, { label: string; color: any; icon: React.ReactElement }> = {
  CREATE: { label: 'Criar', color: 'success', icon: <AddIcon fontSize="small" /> },
  UPDATE: { label: 'Atualizar', color: 'info', icon: <EditIcon fontSize="small" /> },
  UPDATE_STATUS: { label: 'Status', color: 'warning', icon: <EditIcon fontSize="small" /> },
  DELETE: { label: 'Excluir', color: 'error', icon: <DeleteIcon fontSize="small" /> },
  LOGIN: { label: 'Login', color: 'primary', icon: <SecurityIcon fontSize="small" /> },
  LOGOUT: { label: 'Logout', color: 'default', icon: <SecurityIcon fontSize="small" /> },
  VIEW: { label: 'Visualizar', color: 'default', icon: <VisibilityIcon fontSize="small" /> },
};

// Componente para exibir detalhes do log
const LogDetailsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  log: any;
}> = ({ open, onClose, log }) => {
  if (!log) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Detalhes do Log #{log.id_log}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Informações Principais */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Ação Realizada
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {ACOES_CONFIG[log.tp_acao]?.icon}
                  <Chip 
                    label={ACOES_CONFIG[log.tp_acao]?.label || log.tp_acao}
                    color={ACOES_CONFIG[log.tp_acao]?.color || 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Entidade
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {log.tp_entidade}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID de Referência
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {log.id_entidade || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Informações de Contexto */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Data/Hora
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {new Date(log.dt_acao).toLocaleString('pt-BR')}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Usuário
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {log.usuario?.no_completo || 'Sistema'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  E-mail
                </Typography>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {log.usuario?.ds_email || 'N/A'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Organização
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  ID: {log.id_organizacao || 'Global'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Valores Alterados */}
          {(log.ds_valores_antigos || log.ds_valores_novos) && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    <CodeIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Dados da Alteração
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  
                  {log.ds_valores_antigos && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="error.main" fontWeight={600}>
                        VALORES ANTIGOS:
                      </Typography>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          mt: 0.5,
                          bgcolor: 'background.paper',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          overflow: 'auto'
                        }}
                      >
                        <pre style={{ margin: 0 }}>
                          {JSON.stringify(JSON.parse(log.ds_valores_antigos), null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}

                  {log.ds_valores_novos && (
                    <Box>
                      <Typography variant="caption" color="success.main" fontWeight={600}>
                        VALORES NOVOS:
                      </Typography>
                      <Paper 
                        sx={{ 
                          p: 1.5, 
                          mt: 0.5,
                          bgcolor: 'background.paper',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          overflow: 'auto'
                        }}
                      >
                        <pre style={{ margin: 0 }}>
                          {JSON.stringify(JSON.parse(log.ds_valores_novos), null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export const PaginaAdminLogs: React.FC = () => {
  const { data: logs, isLoading, isError, error } = useGetLogsAdmin();
  const [searchText, setSearchText] = useState('');
  const [tipoAcaoFilter, setTipoAcaoFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filtros
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter(log => {
      const matchesSearch = 
        log.tp_entidade?.toLowerCase().includes(searchText.toLowerCase()) ||
        log.usuario?.ds_email?.toLowerCase().includes(searchText.toLowerCase()) ||
        log.usuario?.no_completo?.toLowerCase().includes(searchText.toLowerCase()) ||
        log.id_organizacao?.toString().includes(searchText);
      
      const matchesAction = 
        tipoAcaoFilter === 'all' || log.tp_acao === tipoAcaoFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchText, tipoAcaoFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!logs) return { total: 0, creates: 0, updates: 0, deletes: 0 };

    return {
      total: logs.length,
      creates: logs.filter(l => l.tp_acao === 'CREATE').length,
      updates: logs.filter(l => l.tp_acao === 'UPDATE' || l.tp_acao === 'UPDATE_STATUS').length,
      deletes: logs.filter(l => l.tp_acao === 'DELETE').length,
    };
  }, [logs]);

  // Tipos de ação únicos para filtros
  const uniqueActions = useMemo(() => {
    if (!logs) return [];
    return Array.from(new Set(logs.map(l => l.tp_acao))).sort();
  }, [logs]);

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const columns: GridColDef[] = [
    { 
      field: 'id_log', 
      headerName: 'ID', 
      width: 80,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'dt_acao', 
      headerName: 'Data/Hora', 
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">
            {new Date(params.value).toLocaleString('pt-BR')}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'id_organizacao', 
      headerName: 'Org.', 
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title={`Organização ID: ${params.value || 'Global'}`}>
          <Chip 
            label={params.value || 'GLB'} 
            size="small" 
            variant="outlined"
            icon={<BusinessIcon />}
          />
        </Tooltip>
      )
    },
    { 
      field: 'tp_acao', 
      headerName: 'Ação', 
      width: 140,
      renderCell: (params) => {
        const config = ACOES_CONFIG[params.value] || { label: params.value, color: 'default', icon: <InfoIcon /> };
        return (
          <Chip 
            label={config.label}
            color={config.color}
            size="small"
            icon={config.icon}
            sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    { 
      field: 'tp_entidade', 
      headerName: 'Entidade', 
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'id_entidade', 
      headerName: 'ID Ref.', 
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {params.value || '-'}
        </Typography>
      )
    },
    { 
      field: 'usuario', 
      headerName: 'Usuário', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const usuario = params.row.usuario;
        return (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {usuario?.no_completo || 'Sistema'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {usuario?.ds_email || 'Ação automática'}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Detalhes',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Ver detalhes">
              <InfoIcon />
            </Tooltip>
          }
          label="Detalhes"
          onClick={() => handleViewDetails(params.row)}
        />
      ]
    }
  ];

  if (isError) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Logs Globais do Sistema
        </Typography>
        <Alert severity="error" sx={{ mt: 3 }}>
          Erro ao carregar logs: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Logs Globais do Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Auditoria completa de todas as ações realizadas no sistema
        </Typography>
      </Box>

      {/* Estatísticas */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3
      }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">Total de Logs</Typography>
          <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'success.main', bgcolor: 'success.50' }}>
          <Typography variant="caption" color="success.dark">Criações</Typography>
          <Typography variant="h5" fontWeight={700} color="success.dark">{stats.creates}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'info.main', bgcolor: 'info.50' }}>
          <Typography variant="caption" color="info.dark">Atualizações</Typography>
          <Typography variant="h5" fontWeight={700} color="info.dark">{stats.updates}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'error.main', bgcolor: 'error.50' }}>
          <Typography variant="caption" color="error.dark">Exclusões</Typography>
          <Typography variant="h5" fontWeight={700} color="error.dark">{stats.deletes}</Typography>
        </Paper>
      </Box>

      {/* Filtros */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Busca */}
          <TextField
            placeholder="Buscar por usuário, entidade ou organização..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 300, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filtro de Ações */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Chip 
              label="Todas"
              onClick={() => setTipoAcaoFilter('all')}
              color={tipoAcaoFilter === 'all' ? 'primary' : 'default'}
              variant={tipoAcaoFilter === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            {uniqueActions.map(action => (
              <Chip 
                key={action}
                label={ACOES_CONFIG[action]?.label || action}
                onClick={() => setTipoAcaoFilter(action)}
                color={tipoAcaoFilter === action ? (ACOES_CONFIG[action]?.color || 'primary') : 'default'}
                variant={tipoAcaoFilter === action ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* DataGrid */}
      <Paper 
        elevation={0}
        sx={{ 
          height: 600, 
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <DataGrid 
          rows={filteredLogs} 
          columns={columns} 
          getRowId={(r) => r.id_log} 
          loading={isLoading}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
            sorting: {
              sortModel: [{ field: 'dt_acao', sort: 'desc' }]
            }
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de Detalhes */}
      <LogDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        log={selectedLog}
      />
    </Box>
  );
};