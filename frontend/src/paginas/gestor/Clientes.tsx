// /frontend/src/paginas/gestor/Clientes.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  LocationOn as LocationOnIcon, 
  Contacts as ContactsIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';

import { useGetClientes, useDeleteCliente, useCreateCliente, useUpdateCliente, useGetEnderecosPorCliente, useAddEndereco, useUpdateEndereco, useDeleteEndereco } from '../../api/servicos/clienteService';
import type { IClienteCompleto } from '../../tipos/schemas';
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
      width: 140,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Editar">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Cliente"
          onClick={() => handleOpenEdit(params.row as IClienteCompleto)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Endereços">
              <LocationOnIcon />
            </Tooltip>
          }
          label="Gerenciar Endereços"
          onClick={() => handleOpenEnderecos(params.row as IClienteCompleto)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Contatos">
              <ContactsIcon />
            </Tooltip>
          }
          label="Gerenciar Contatos"
          onClick={() => handleOpenContatos(params.row as IClienteCompleto)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title={params.row.fl_ativo ? "Desativar" : "Cliente já inativo"}>
              <DeleteIcon />
            </Tooltip>
          }
          label="Desativar Cliente"
          onClick={() => handleOpenDelete(params.id as number)}
          disabled={!params.row.fl_ativo}
          showInMenu={false}
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
        >
          Novo Cliente
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar clientes: {(error as any).message}
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
          rows={clientes || []}
          columns={colunas}
          getRowId={(row) => row.id_cliente}
          loading={isLoadingClientes}
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
      {modalFormAberto && (
        <ModalFormCliente
          open={modalFormAberto}
          onClose={handleCloseModal}
          cliente={clienteSelecionado}
          // Passa os hooks corretos do GESTOR
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
      {clienteSelecionado && (
        <ModalGerenciarEnderecos
          open={modalEnderecosAberto}
          onClose={() => setModalEnderecosAberto(false)}
          cliente={clienteSelecionado}
          
          // Passa os hooks específicos do GESTOR
          getEnderecosHook={getEnderecosHook}
          addEnderecoHook={addEnderecoHook}
          updateEnderecoHook={updateEnderecoHook}
          deleteEnderecoHook={deleteEnderecoHook}
        />
      )}
      {clienteSelecionado && (
        <ModalGerenciarContatos
          open={modalContatosAberto}
          onClose={() => setModalContatosAberto(false)}
          cliente={clienteSelecionado}
        />
      )}
    </Box>
  );
};