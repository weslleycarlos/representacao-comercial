// /frontend/src/paginas/gestor/Vendedores.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Tooltip, Badge,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Link as LinkIcon } from '@mui/icons-material';

import { useGetVendedores } from '../../api/servicos/vendedorService';
import type { IVendedor } from '../../tipos/schemas';
import { ModalFormVendedor } from '../../componentes/gestor/ModalFormVendedor';
import { ModalVincularEmpresa } from '../../componentes/gestor/ModalVincularEmpresa';

export const PaginaVendedores: React.FC = () => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<IVendedor | undefined>(undefined);
  const [modalVincularAberto, setModalVincularAberto] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { 
    data: vendedores, 
    isLoading: isLoadingVendedores, 
    isError, 
    error 
  } = useGetVendedores();

  // Sincroniza vendedor selecionado com cache atualizado
  useEffect(() => {
    if (vendedorSelecionado && vendedores) {
      const vendedorAtualizado = vendedores.find(
        (v) => v.id_usuario === vendedorSelecionado.id_usuario
      );
      if (vendedorAtualizado) {
        setVendedorSelecionado(vendedorAtualizado);
      }
    }
  }, [vendedores, vendedorSelecionado]);
  
  // Definição das Colunas
  const colunas: GridColDef[] = [
    { 
      field: 'no_completo', 
      headerName: 'Nome', 
      flex: 2,
      minWidth: 180,
    },
    { 
      field: 'ds_email', 
      headerName: 'E-mail', 
      flex: 2,
      minWidth: 200,
    },
    { 
      field: 'nr_telefone', 
      headerName: 'Telefone', 
      flex: 1,
      minWidth: 130,
      // SEM formatação - valor já vem formatado do banco
    },
    { 
      field: 'empresas_vinculadas', 
      headerName: 'Empresas', 
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row.empresas_vinculadas?.length || 0;
        return (
          <Badge 
            badgeContent={count} 
            color={count > 0 ? "primary" : "default"}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: '18px',
                minWidth: '18px',
              }
            }}
          >
            <Chip 
              label={count === 0 ? "Nenhuma" : `${count}`}
              size="small"
              color={count > 0 ? "primary" : "default"}
              variant={count > 0 ? "filled" : "outlined"}
              sx={{ 
                fontWeight: 600,
                minWidth: 60
              }}
            />
          </Badge>
        );
      }
    },
    { 
      field: 'fl_ativo', 
      headerName: 'Status', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value ? "Ativo" : "Inativo"} 
          color={params.value ? "success" : "default"} 
          size="small"
          sx={{ 
            fontWeight: 600,
            minWidth: 70
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
            <Tooltip title="Editar vendedor">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Vendedor"
          onClick={() => handleOpenEdit(params.row as IVendedor)}
          showInMenu={false}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
        <GridActionsCellItem
          key="link"
          icon={
            <Tooltip title="Vincular empresas">
              <LinkIcon />
            </Tooltip>
          }
          label="Vincular Empresas"
          onClick={() => handleOpenVincular(params.row as IVendedor)}
          showInMenu={false}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
      ],
    },
  ];

  // Funções de Manipulação
  const handleOpenCreate = () => {
    setVendedorSelecionado(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (vendedor: IVendedor) => {
    setVendedorSelecionado(vendedor);
    setModalFormAberto(true);
  };
  
  const handleOpenVincular = (vendedor: IVendedor) => {
    setVendedorSelecionado(vendedor);
    setModalVincularAberto(true);
  };
  
  const handleCloseVincularModal = () => {
    setModalVincularAberto(false);
    setVendedorSelecionado(undefined);
  };

  const handleCloseModal = () => {
    setModalFormAberto(false);
    setVendedorSelecionado(undefined);
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
            Vendedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os vendedores e seus vínculos com empresas
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
          Novo Vendedor
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Erro ao carregar vendedores: {(error as any)?.message || 'Erro desconhecido'}
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
          rows={vendedores || []}
          columns={colunas}
          getRowId={(row) => row.id_usuario}
          loading={isLoadingVendedores}
          slots={{
            loadingOverlay: LinearProgress,
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} p={3}>
                <Box sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}>
                  👨‍💼
                </Box>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  Nenhum vendedor cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Clique em "Novo Vendedor" para adicionar o primeiro
                </Typography>
              </Stack>
            ),
          }}
          initialState={{
            pagination: { 
              paginationModel: { pageSize: 25 } 
            },
            sorting: {
              sortModel: [{ field: 'no_completo', sort: 'asc' }]
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
      <ModalFormVendedor
        open={modalFormAberto}
        onClose={handleCloseModal}
        vendedor={vendedorSelecionado}
      />
      
      {/* Modal de Vincular Empresas */}
      {vendedorSelecionado && (
        <ModalVincularEmpresa
          open={modalVincularAberto}
          onClose={handleCloseVincularModal}
          vendedor={vendedorSelecionado}
        />
      )}
    </Box>
  );
};