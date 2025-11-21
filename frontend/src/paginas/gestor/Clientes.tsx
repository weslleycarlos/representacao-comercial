// /frontend/src/paginas/gestor/Clientes.tsx
import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Tooltip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  LocationOn as LocationOnIcon, 
  Contacts as ContactsIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';

import { 
  useGetClientes, 
  useDeleteCliente, 
  useCreateCliente, 
  useUpdateCliente, 
  useGetEnderecosPorCliente, 
  useAddEndereco, 
  useUpdateEndereco, 
  useDeleteEndereco 
} from '../../api/servicos/clienteService';
import type { IClienteCompleto } from '../../tipos/schemas';
import type { ClienteFormData } from '../../tipos/validacao'; // IMPORT ADICIONADO
import { ModalFormCliente } from '../../componentes/gestor/ModalFormCliente';
import { ModalConfirmarExclusao } from '../../componentes/layout/ModalConfirmarExclusao';
import { ModalGerenciarEnderecos } from '../../componentes/gestor/ModalGerenciarEnderecos';
import { ModalGerenciarContatos } from '../../componentes/gestor/ModalGerenciarContatos';

export const PaginaClientes: React.FC = () => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalEnderecosAberto, setModalEnderecosAberto] = useState(false);
  const [modalContatosAberto, setModalContatosAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | undefined>(undefined);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getEnderecosHook = useGetEnderecosPorCliente(clienteSelecionado?.id_cliente || 0);
  const addEnderecoHook = useAddEndereco();
  const updateEnderecoHook = useUpdateEndereco();
  const deleteEnderecoHook = useDeleteEndereco();
  
  const { 
    data: clientes, 
    isLoading: isLoadingClientes, 
    isError, 
    error 
  } = useGetClientes();

  const { mutate: deleteCliente, isPending: isDeleting } = useDeleteCliente();
  const { mutate: createCliente, isPending: isCreating, error: createError } = useCreateCliente();
  const { mutate: updateCliente, isPending: isUpdating, error: updateError } = useUpdateCliente();

  const handleSaveCliente = (data: ClienteFormData, options: { onSuccess: () => void }) => {
    if (clienteSelecionado) {
      // Modo Edição (Gestor)
      updateCliente({ id: clienteSelecionado.id_cliente, data }, options);
    } else {
      // Modo Criação (Gestor)
      createCliente(data, options);
    }
  };

  // Definição das Colunas
  const colunas: GridColDef[] = [
    { 
      field: 'no_razao_social', 
      headerName: 'Razão Social', 
      flex: 2,
      minWidth: 200,
    },
    { 
      field: 'no_fantasia', 
      headerName: 'Nome Fantasia', 
      flex: 1.5,
      minWidth: 150,
    },
    { 
      field: 'nr_cnpj', 
      headerName: 'CNPJ', 
      flex: 1.2,
      minWidth: 140,
      // SEM formatação - valor já vem formatado do banco
    },
    { 
      field: 'ds_email', 
      headerName: 'E-mail', 
      flex: 1.5,
      minWidth: 180,
    },
    { 
      field: 'nr_telefone', 
      headerName: 'Telefone', 
      flex: 1,
      minWidth: 130,
      // SEM formatação - valor já vem formatado do banco
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
      width: 160,
      align: 'center',
      headerAlign: 'center',
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={
            <Tooltip title="Editar cliente">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Cliente"
          onClick={() => handleOpenEdit(params.row as IClienteCompleto)}
          showInMenu={false}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
        <GridActionsCellItem
          key="enderecos"
          icon={
            <Tooltip title="Gerenciar endereços">
              <LocationOnIcon />
            </Tooltip>
          }
          label="Gerenciar Endereços"
          onClick={() => handleOpenEnderecos(params.row as IClienteCompleto)}
          showInMenu={false}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
        <GridActionsCellItem
          key="contatos"
          icon={
            <Tooltip title="Gerenciar contatos">
              <ContactsIcon />
            </Tooltip>
          }
          label="Gerenciar Contatos"
          onClick={() => handleOpenContatos(params.row as IClienteCompleto)}
          showInMenu={false}
          sx={{
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' }
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <Tooltip title={params.row.fl_ativo ? "Desativar cliente" : "Cliente já inativo"}>
              <DeleteIcon />
            </Tooltip>
          }
          label="Desativar Cliente"
          onClick={() => handleOpenDelete(params.id as number)}
          disabled={!params.row.fl_ativo}
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
  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const handleOpenContatos = (cliente: IClienteCompleto) => {
    setClienteSelecionado(cliente);
    setModalContatosAberto(true);
  };

  const handleOpenEnderecos = (cliente: IClienteCompleto) => {
    setClienteSelecionado(cliente);
    setModalEnderecosAberto(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteCliente(idParaExcluir, {
        onSuccess: () => {
          setModalExcluirAberto(false);
          setIdParaExcluir(null);
        }
      });
    }
  };

  const handleOpenCreate = () => {
    setClienteSelecionado(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (cliente: IClienteCompleto) => {
    setClienteSelecionado(cliente);
    setModalFormAberto(true);
  };

  const handleCloseModal = () => {
    setModalFormAberto(false);
    setClienteSelecionado(undefined);
  };

  const handleCloseModalExcluir = () => {
    setModalExcluirAberto(false);
    setIdParaExcluir(null);
  };

  const handleCloseEnderecos = () => {
    setModalEnderecosAberto(false);
    setClienteSelecionado(undefined);
  };

  const handleCloseContatos = () => {
    setModalContatosAberto(false);
    setClienteSelecionado(undefined);
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
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os clientes da sua organização
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
          Novo Cliente
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Erro ao carregar clientes: {(error as any)?.message || 'Erro desconhecido'}
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
          rows={clientes || []}
          columns={colunas}
          getRowId={(row) => row.id_cliente}
          loading={isLoadingClientes}
          slots={{
            loadingOverlay: LinearProgress,
            noRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center" spacing={1} p={3}>
                <Box sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}>
                  👥
                </Box>
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  Nenhum cliente cadastrado
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Clique em "Novo Cliente" para adicionar o primeiro
                </Typography>
              </Stack>
            ),
          }}
          initialState={{
            pagination: { 
              paginationModel: { pageSize: 25 } 
            },
            sorting: {
              sortModel: [{ field: 'no_razao_social', sort: 'asc' }]
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
      {modalFormAberto && (
        <ModalFormCliente
          open={modalFormAberto}
          onClose={handleCloseModal}
          cliente={clienteSelecionado}
          onSave={handleSaveCliente}
          isSaving={isCreating || isUpdating}
          mutationError={createError || updateError}
        />
      )}
      
      {/* Modal de Confirmação de Exclusão */}
      <ModalConfirmarExclusao
        open={modalExcluirAberto}
        onClose={handleCloseModalExcluir}
        onConfirm={handleConfirmDelete}
        titulo="Desativar Cliente"
        mensagem="Tem certeza que deseja desativar este cliente? Esta ação pode ser revertida posteriormente."
        isLoading={isDeleting}
      />

      {/* Modal de Gerenciar Endereços */}
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

      {/* Modal de Gerenciar Contatos */}
      {clienteSelecionado && (
        <ModalGerenciarContatos
          open={modalContatosAberto}
          onClose={handleCloseContatos}
          cliente={clienteSelecionado}
        />
      )}
    </Box>
  );
};