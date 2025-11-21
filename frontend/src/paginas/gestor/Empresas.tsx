// /frontend/src/paginas/gestor/Empresas.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { useDeleteEmpresa, useGetEmpresas } from '../../api/servicos/empresaService';
import type { IEmpresaCompleta } from '../../tipos/schemas';
import { ModalFormEmpresa } from '../../componentes/gestor/ModalFormEmpresa';
import { ModalConfirmarExclusao } from '../../componentes/layout/ModalConfirmarExclusao';

export const PaginaEmpresas: React.FC = () => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<IEmpresaCompleta | undefined>(undefined);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { 
    data: empresas, 
    isLoading: isLoadingEmpresas, 
    isError, 
    error 
  } = useGetEmpresas();

  const { mutate: deleteEmpresa, isPending: isDeleting } = useDeleteEmpresa();
  
  // Definição das Colunas
 // /frontend/src/paginas/gestor/Empresas.tsx

// /frontend/src/paginas/gestor/Empresas.tsx

// Definição das Colunas CORRIGIDA - SEM valueFormatter:
const colunas: GridColDef[] = [
  { 
    field: 'no_empresa', 
    headerName: 'Nome da Empresa', 
    flex: 2,
    minWidth: 200,
  },
  { 
    field: 'nr_cnpj', 
    headerName: 'CNPJ', 
    flex: 1.2,
    minWidth: 140,
    // REMOVIDO valueFormatter - o valor já vem formatado do banco
  },
  { 
    field: 'ds_email_contato', 
    headerName: 'E-mail', 
    flex: 1.5,
    minWidth: 180,

  },
  { 
    field: 'nr_telefone_contato', 
    headerName: 'Telefone', 
    flex: 1,
    minWidth: 130,
    // REMOVIDO valueFormatter - o valor já vem formatado do banco
  },
  { 
    field: 'pc_comissao_padrao', 
    headerName: 'Comissão', 
    width: 110,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <Chip 
        label={`${params.value || 0}%`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    )
  },
  { 
    field: 'fl_ativa', 
    headerName: 'Status', 
    width: 100,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <Chip 
        label={params.value ? "Ativa" : "Inativa"} 
        color={params.value ? "success" : "default"} 
        size="small"
        sx={{ 
          fontWeight: 600,
          minWidth: 80
        }}
      />
    )
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Ações',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    getActions: (params) => [
      <GridActionsCellItem
        key="edit"
        icon={
          <Tooltip title="Editar empresa">
            <EditIcon />
          </Tooltip>
        }
        label="Editar"
        onClick={() => handleOpenEdit(params.row as IEmpresaCompleta)}
        showInMenu={false}
        sx={{
          '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
        }}
      />,
      <GridActionsCellItem
        key="delete"
        icon={
          <Tooltip title={params.row.fl_ativa ? "Desativar empresa" : "Empresa já inativa"}>
            <DeleteIcon />
          </Tooltip>
        }
        label="Desativar"
        onClick={() => handleOpenDelete(params.id as number)}
        disabled={!params.row.fl_ativa}
        showInMenu={false}
        sx={{
          '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
          '&.Mui-disabled': {
            opacity: 0.3
          }
        }}
      />,
    ],
  },
];

  // Funções de Manipulação
  const handleOpenCreate = () => {
    setEmpresaSelecionada(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (empresa: IEmpresaCompleta) => {
    setEmpresaSelecionada(empresa);
    setModalFormAberto(true);
  };
  
  const handleCloseModal = () => {
    setModalFormAberto(false);
    setEmpresaSelecionada(undefined);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteEmpresa(idParaExcluir, {
        onSuccess: () => {
          setModalExcluirAberto(false);
          setIdParaExcluir(null);
        }
      });
    }
  };

  const handleCloseModalExcluir = () => {
    setModalExcluirAberto(false);
    setIdParaExcluir(null);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Header Responsivo */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as empresas representadas pela organização
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="large"
          fullWidth={isMobile}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          Nova Empresa
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Erro ao carregar empresas: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      )}

      {/* Tabela de Dados */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: { xs: '60vh', md: 'calc(100vh - 240px)' },
          minHeight: 400,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={empresas || []}
          columns={colunas}
          getRowId={(row) => row.id_empresa}
          loading={isLoadingEmpresas}
          slots={{
            loadingOverlay: LinearProgress,
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} p={3}>
                <Box sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}>
                  🏢
                </Box>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  Nenhuma empresa cadastrada
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Clique em "Nova Empresa" para adicionar a primeira
                </Typography>
              </Stack>
            ),
          }}
          initialState={{
            pagination: { 
              paginationModel: { pageSize: 25 } 
            },
            sorting: {
              sortModel: [{ field: 'no_empresa', sort: 'asc' }]
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
              borderBottom: '2px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: 'background.paper'
            }
          }}
        />
      </Paper>
      
      {/* Modal de Adicionar/Editar */}
      <ModalFormEmpresa
        open={modalFormAberto}
        onClose={handleCloseModal}
        empresa={empresaSelecionada}
      />
      
      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmarExclusao
        open={modalExcluirAberto}
        onClose={handleCloseModalExcluir}
        onConfirm={handleConfirmDelete}
        titulo="Desativar Empresa"
        mensagem="Tem certeza que deseja desativar esta empresa? Esta ação pode ser revertida posteriormente."
        isLoading={isDeleting}
      />
    </Box>
  );
};