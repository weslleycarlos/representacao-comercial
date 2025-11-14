// /frontend/src/paginas/vendedor/Clientes.tsx
import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';

// --- 1. IMPORTAÇÕES CORRIGIDAS ---
import { 
  useGetVendedorClientes, 
  useCreateVendedorCliente,
  useGetVendedorEnderecos,
  useAddVendedorEndereco,
  useUpdateVendedorEndereco,
  useDeleteVendedorEndereco
} from '../../api/servicos/vendedorService'; // (Hooks do Vendedor)
import type { IClienteCompleto } from '../../tipos/schemas';
import type { ClienteFormData } from '../../tipos/validacao'; // (Tipo do Zod)
import { ModalFormCliente } from '../../componentes/gestor/ModalFormCliente';
import { ModalGerenciarEnderecos } from '../../componentes/gestor/ModalGerenciarEnderecos';
import { ModalConfirmarExclusao } from '../../componentes/layout/ModalConfirmarExclusao';

export const PaginaVendedorClientes: React.FC = () => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalEnderecosAberto, setModalEnderecosAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | undefined>(undefined);

  // --- 2. HOOK CORRIGIDO ---
  const { 
    data: clientes, 
    isLoading: isLoadingClientes, 
    isError, 
    error 
  } = useGetVendedorClientes(); // <-- USA O HOOK DO VENDEDOR

  // --- 3. HOOK DE CRIAÇÃO DO VENDEDOR ---
  const { 
    mutate: createCliente, 
    isPending: isCreating, 
    error: createError 
  } = useCreateVendedorCliente();

  const getEnderecosHook = useGetVendedorEnderecos(clienteSelecionado?.id_cliente || 0);
  const addEnderecoHook = useAddVendedorEndereco();
  const updateEnderecoHook = useUpdateVendedorEndereco();
  const deleteEnderecoHook = useDeleteVendedorEndereco();

  const colunas: GridColDef[] = [
    // ... (Definições de colunas) ...
    { field: 'no_razao_social', headerName: 'Razão Social', flex: 2 },
    { field: 'no_fantasia', headerName: 'Nome Fantasia', flex: 1 },
    { field: 'nr_cnpj', headerName: 'CNPJ', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<LocationOnIcon />}
          label="Ver Endereços"
          onClick={() => handleOpenEnderecos(params.row as IClienteCompleto)} // <-- ATUALIZE AQUI
        />,
      ],
    },
  ];

  const handleOpenCreate = () => {
    // setClienteSelecionado(undefined);
    setModalFormAberto(true);
  };
  
  const handleCloseModal = () => {
    setModalFormAberto(false);
  };
  
  // 4. Handler 'onSave' para o VENDEDOR
  const handleSaveCliente = (data: ClienteFormData, options: { onSuccess: () => void }) => {
    // Vendedor SÓ PODE CRIAR
    createCliente(data, options);
  };

  const handleOpenEnderecos = (cliente: IClienteCompleto) => {
    setClienteSelecionado(cliente);
    setModalEnderecosAberto(true);
  };

  return (
    <Box>
      {/* ... (Título e Botão) ... */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Novo Cliente (Cadastro Rápido)
        </Button>
      </Box>

      {/* ... (Erro e Tabela) ... */}
      <Paper elevation={0} sx={{ height: '75vh', width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <DataGrid
          rows={clientes || []}
          columns={colunas}
          getRowId={(row) => row.id_cliente}
          loading={isLoadingClientes}
          slots={{ loadingOverlay: LinearProgress }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 0 }}
        />
      </Paper>
      
      {/* --- 5. MODAL CORRIGIDO --- */}
      {modalFormAberto && (
        <ModalFormCliente
          open={modalFormAberto}
          onClose={handleCloseModal}
          cliente={undefined} // Vendedor só cria
          // Passa os hooks corretos do VENDEDOR
          onSave={handleSaveCliente}
          isSaving={isCreating}
          mutationError={createError}
        />
      )}
      {clienteSelecionado && (
        <ModalGerenciarEnderecos
          open={modalEnderecosAberto}
          onClose={() => setModalEnderecosAberto(false)}
          cliente={clienteSelecionado}
          
          // Passa os hooks específicos do VENDEDOR
          getEnderecosHook={getEnderecosHook}
          addEnderecoHook={addEnderecoHook}
          updateEnderecoHook={updateEnderecoHook}
          deleteEnderecoHook={deleteEnderecoHook}
        />
      )}
    </Box>
  );
};