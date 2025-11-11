// /frontend/src/paginas/gestor/Vendedores.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Tooltip, Badge
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
    },
    { 
      field: 'empresas_vinculadas', 
      headerName: 'Empresas', 
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row.empresas_vinculadas.length || 0;
        return (
          <Badge 
            badgeContent={count} 
            color={count > 0 ? "primary" : "default"}
            max={99}
          >
            <Chip 
              label={count === 0 ? "Nenhuma" : `${count}`}
              size="small"
              color={count > 0 ? "primary" : "default"}
              variant={count > 0 ? "filled" : "outlined"}
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
          sx={{ fontWeight: 500 }}
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
            <Tooltip title="Editar">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Vendedor"
          onClick={() => handleOpenEdit(params.row as IVendedor)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Vincular Empresas">
              <LinkIcon />
            </Tooltip>
          }
          label="Vincular Empresas"
          onClick={() => handleOpenVincular(params.row as IVendedor)}
          showInMenu={false}
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
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
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
        >
          Novo Vendedor
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar vendedores: {(error as any).message}
        </Alert>
      )}

      {/* Tabela de Dados */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 'calc(100vh - 240px)',
          minHeight: 500,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <DataGrid
          rows={vendedores || []}
          columns={colunas}
          getRowId={(row) => row.id_usuario}
          loading={isLoadingVendedores}
          slots={{
            loadingOverlay: LinearProgress,
          }}
          initialState={{
            pagination: { 
              paginationModel: { pageSize: 25 } 
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.default',
              borderRadius: 0,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
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