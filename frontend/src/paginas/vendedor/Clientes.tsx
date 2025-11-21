// /frontend/src/paginas/vendedor/Clientes.tsx
import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';

import { 
  useGetVendedorClientes, 
  useCreateVendedorCliente,
  useGetVendedorEnderecos,
  useAddVendedorEndereco,
  useUpdateVendedorEndereco,
  useDeleteVendedorEndereco
} from '../../api/servicos/vendedorService';
import type { IClienteCompleto } from '../../tipos/schemas';
import type { ClienteFormData } from '../../tipos/validacao';
import { ModalFormCliente } from '../../componentes/gestor/ModalFormCliente';
import { ModalGerenciarEnderecos } from '../../componentes/gestor/ModalGerenciarEnderecos';
import { useAuth } from '../../contextos/AuthContext';

export const PaginaVendedorClientes: React.FC = () => {
  const { empresaAtiva } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalEnderecosAberto, setModalEnderecosAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | undefined>(undefined);

  const { 
    data: clientes, 
    isLoading: isLoadingClientes, 
    isError, 
    error 
  } = useGetVendedorClientes(empresaAtiva?.id_empresa);

  const { 
    mutate: createCliente, 
    isPending: isCreating, 
    error: createError 
  } = useCreateVendedorCliente();

  const getEnderecosHook = useGetVendedorEnderecos(clienteSelecionado?.id_cliente || 0);
  const addEnderecoHook = useAddVendedorEndereco();
  const updateEnderecoHook = useUpdateVendedorEndereco();
  const deleteEnderecoHook = useDeleteVendedorEndereco();

  // --- COLUNAS CORRIGIDAS (SEM FORMATAÇÃO DUPLICADA DO CNPJ) ---
  const colunas: GridColDef[] = [
    { 
      field: 'no_razao_social', 
      headerName: 'Razão Social', 
      flex: 2,
      minWidth: 200
    },
    { 
      field: 'no_fantasia', 
      headerName: 'Nome Fantasia', 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'nr_cnpj', 
      headerName: 'CNPJ', 
      flex: 1,
      minWidth: 150,
      // REMOVI o valueFormatter - o backend já deve enviar formatado
      // Se precisar formatar, verifique como estava antes
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 120,
      cellClassName: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<LocationOnIcon />}
          label="Gerenciar Endereços"
          onClick={() => handleOpenEnderecos(params.row as IClienteCompleto)}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
      ],
    },
  ];

  const handleOpenCreate = () => {
    setModalFormAberto(true);
  };
  
  const handleCloseModal = () => {
    setModalFormAberto(false);
  };
  
  const handleSaveCliente = (data: ClienteFormData, options: { onSuccess: () => void }) => {
    createCliente(data, {
      onSuccess: () => {
        options.onSuccess();
        handleCloseModal();
      }
    });
  };

  const handleOpenEnderecos = (cliente: IClienteCompleto) => {
    setClienteSelecionado(cliente);
    setModalEnderecosAberto(true);
  };

  const handleCloseEnderecos = () => {
    setModalEnderecosAberto(false);
    setClienteSelecionado(undefined);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* HEADER RESPONSIVO */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom={isMobile}>
            Meus Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os clientes da sua carteira
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size={isMobile ? "medium" : "large"}
          fullWidth={isMobile}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            whiteSpace: 'nowrap'
          }}
        >
          Novo Cliente
        </Button>
      </Box>

      {/* ALERTAS DE ERRO */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar clientes: {(error as any)?.message || 'Erro desconhecido'}
        </Alert>
      )}

      {createError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao criar cliente: {(createError as any)?.message || 'Erro desconhecido'}
        </Alert>
      )}

      {/* DATA GRID */}
      <Paper elevation={0} sx={{ 
        height: { xs: '60vh', md: '70vh' }, 
        width: '100%', 
        border: '1px solid', 
        borderColor: 'divider', 
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={clientes || []}
          columns={colunas}
          getRowId={(row) => row.id_cliente}
          loading={isLoadingClientes}
          slots={{ loadingOverlay: LinearProgress }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ 
            pagination: { paginationModel: { pageSize: 10 } } 
          }}
          sx={{ 
            border: 0,
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
              borderBottom: '2px solid',
              borderColor: 'divider',
            }
          }}
          disableRowSelectionOnClick
        />
      </Paper>
      
      {/* MODAIS */}
      <ModalFormCliente
        open={modalFormAberto}
        onClose={handleCloseModal}
        cliente={undefined}
        onSave={handleSaveCliente}
        isSaving={isCreating}
        mutationError={createError}
      />
      
      {clienteSelecionado && (
        <ModalGerenciarEnderecos
          open={modalEnderecosAberto}
          onClose={handleCloseEnderecos}
          cliente={clienteSelecionado}
          getEnderecosHook={getEnderecosHook}
          addEnderecoHook={addEnderecoHook}
          updateEnderecoHook={updateEnderecoHook}
          deleteEnderecoHook={deleteEnderecoHook}
        />
      )}
    </Box>
  );
};