// /frontend/src/paginas/admin/Organizacoes.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Chip, 
  TextField, 
  InputAdornment,
  Alert,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  DataGrid, 
  type GridColDef, 
  GridActionsCellItem
} from '@mui/x-data-grid';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import { useGetOrganizacoes } from '../../api/servicos/adminService';
import type { IOrganizacao } from '../../tipos/schemas';
import { ModalFormOrganizacao } from '../../componentes/admin/ModalFormOrganizacao';

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string) => {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Componente de Card de Estatísticas
const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactElement;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Paper 
    elevation={0}
    sx={{ 
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      minWidth: 200,
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: color,
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }
    }}
  >
    <Box 
      sx={{ 
        bgcolor: color,
        width: 48,
        height: 48,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
    </Box>
  </Paper>
);

export const PaginaAdminOrganizacoes: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<IOrganizacao | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'suspenso'>('all');
  
  const { data: orgs, isLoading, isError, error } = useGetOrganizacoes();

  const handleEdit = (org: IOrganizacao) => {
    setSelectedOrg(org);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrg(undefined);
    setModalOpen(true);
  };

  // Filtros
  const filteredOrgs = orgs?.filter(org => {
    const matchesSearch = 
      org.no_organizacao.toLowerCase().includes(searchText.toLowerCase()) ||
      org.nr_cnpj?.includes(searchText);
    
    const matchesStatus = 
      statusFilter === 'all' || org.st_assinatura === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: orgs?.length || 0,
    ativas: orgs?.filter(o => o.st_assinatura === 'ativo').length || 0,
    suspensas: orgs?.filter(o => o.st_assinatura === 'suspenso').length || 0,
  };

  const columns: GridColDef[] = [
    { 
      field: 'id_organizacao', 
      headerName: 'ID', 
      width: 80,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'no_organizacao', 
      headerName: 'Organização', 
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'nr_cnpj', 
      headerName: 'CNPJ', 
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {formatCNPJ(params.value)}
        </Typography>
      )
    },
    { 
      field: 'tp_plano', 
      headerName: 'Plano', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value?.toUpperCase() || 'N/A'} 
          size="small" 
          variant="outlined"
          color={params.value === 'premium' ? 'primary' : 'default'}
          sx={{ fontWeight: 600 }}
        />
      )
    },
    { 
      field: 'st_assinatura', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'ativo' ? 'Ativo' : 'Suspenso'} 
          color={params.value === 'ativo' ? 'success' : 'error'} 
          size="small"
          icon={params.value === 'ativo' ? <CheckCircleIcon /> : <BlockIcon />}
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      field: 'qt_limite_usuarios',
      headerName: 'Limite Usuários',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Ilimitado'} 
          size="small" 
          variant="outlined"
        />
      )
    },
    {
      field: 'qt_limite_empresas',
      headerName: 'Limite Empresas',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Ilimitado'} 
          size="small" 
          variant="outlined"
        />
      )
    },
    {
      field: 'actions', 
      type: 'actions', 
      headerName: 'Ações', 
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem 
          icon={
            <Tooltip title="Editar organização">
              <EditIcon />
            </Tooltip>
          }
          label="Editar" 
          onClick={() => handleEdit(params.row)}
          showInMenu={false}
        />
      ]
    }
  ];

  if (isError) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Organizações (Clientes)
        </Typography>
        <Alert severity="error" sx={{ mt: 3 }}>
          Erro ao carregar organizações: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Organizações (Clientes)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie todas as organizações do sistema
        </Typography>
      </Box>

      {/* Cards de Estatísticas */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap'
      }}>
        <StatCard 
          title="Total de Organizações"
          value={stats.total}
          icon={<BusinessIcon />}
          color="primary.main"
        />
        <StatCard 
          title="Organizações Ativas"
          value={stats.ativas}
          icon={<CheckCircleIcon />}
          color="success.main"
        />
        <StatCard 
          title="Organizações Suspensas"
          value={stats.suspensas}
          icon={<BlockIcon />}
          color="error.main"
        />
      </Box>

      {/* Filtros e Ações */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          {/* Busca */}
          <TextField
            placeholder="Buscar por nome ou CNPJ..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filtros de Status */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Chip 
              label="Todas"
              onClick={() => setStatusFilter('all')}
              color={statusFilter === 'all' ? 'primary' : 'default'}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Ativas"
              onClick={() => setStatusFilter('ativo')}
              color={statusFilter === 'ativo' ? 'success' : 'default'}
              variant={statusFilter === 'ativo' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Suspensas"
              onClick={() => setStatusFilter('suspenso')}
              color={statusFilter === 'suspenso' ? 'error' : 'default'}
              variant={statusFilter === 'suspenso' ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>

          {/* Botão Nova Organização */}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreate}
            sx={{ 
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 2
            }}
          >
            Nova Organização
          </Button>
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
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <DataGrid 
          rows={filteredOrgs || []} 
          columns={columns} 
          getRowId={(row) => row.id_organizacao} 
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            }
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'action.hover'
            }
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Modal de Formulário */}
      {modalOpen && (
        <ModalFormOrganizacao 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          organizacao={selectedOrg} 
        />
      )}
    </Box>
  );
};