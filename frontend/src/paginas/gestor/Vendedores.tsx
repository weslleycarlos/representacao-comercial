// /frontend/src/paginas/gestor/Vendedores.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, IconButton, Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Link as LinkIcon } from '@mui/icons-material';

import { useGetVendedores } from '../../api/servicos/vendedorService';
import type { VendedorSchema } from '../../tipos/schemas';
import { ModalFormVendedor } from '../../componentes/gestor/ModalFormVendedor';
import { ModalVincularEmpresa } from '../../componentes/gestor/ModalVincularEmpresa';
// (O modal de vincular empresa será o próximo passo)

export const PaginaVendedores: React.FC = () => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<VendedorSchema | undefined>(undefined);
  const [modalVincularAberto, setModalVincularAberto] = useState(false);

  // 1. Hook de Busca (TanStack Query)
  const { 
    data: vendedores, 
    isLoading: isLoadingVendedores, 
    isError, 
    error 
  } = useGetVendedores();


  // Este hook sincroniza o 'vendedorSelecionado' (no modal) 
  // com a lista 'vendedores' (do cache).
  useEffect(() => {
    if (vendedorSelecionado && vendedores) {
      // Encontra a versão mais recente do vendedor selecionado na lista atualizada
      const vendedorAtualizado = vendedores.find(
        (v) => v.id_usuario === vendedorSelecionado.id_usuario
      );
      if (vendedorAtualizado) {
        // Atualiza o state, o que força o modal a re-renderizar com os dados corretos
        setVendedorSelecionado(vendedorAtualizado);
      }
    }
  }, [vendedores, vendedorSelecionado]); // Roda sempre que a lista de vendedores mudar
  // --- FIM DO BLOCO ---
  
  // 2. Definição das Colunas da Tabela
  const colunas: GridColDef[] = [
    { 
      field: 'no_completo', 
      headerName: 'Nome do Vendedor', 
      flex: 2,
    },
    { 
      field: 'ds_email', 
      headerName: 'Email', 
      flex: 2,
    },
    { 
      field: 'nr_telefone', 
      headerName: 'Telefone', 
      flex: 1,
    },
    { 
      field: 'empresas_vinculadas', 
      headerName: 'Empresas', 
      flex: 1,
      renderCell: (params) => params.row.empresas_vinculadas.length || 0
    },
    { 
      field: 'fl_ativo', 
      headerName: 'Status', 
      flex: 1,
      renderCell: (params) => (
        params.value ? 
          <Chip label="Ativo" color="success" size="small" /> : 
          <Chip label="Inativo" color="error" size="small" />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      flex: 1,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar Vendedor"
          onClick={() => handleOpenEdit(params.row as VendedorSchema)}
        />,
        <GridActionsCellItem
          icon={<LinkIcon />}
          label="Vincular Empresas"
          onClick={() => handleOpenVincular(params.row as VendedorSchema)}
        />,
      ],
    },
  ];

  // 4. Funções de Manipulação de Modal
  const handleOpenCreate = () => {
    setVendedorSelecionado(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (vendedor: VendedorSchema) => {
    setVendedorSelecionado(vendedor);
    setModalFormAberto(true);
  };
  
const handleOpenVincular = (vendedor: VendedorSchema) => {
    setVendedorSelecionado(vendedor);
    setModalVincularAberto(true);
  };
  
  const handleCloseVincularModal = () => {
    setModalVincularAberto(false);
  };

  const handleCloseModal = () => {
    setModalFormAberto(false);
  };

  return (
    <Box>
      {/* --- TÍTULO E BOTÃO --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestão de Vendedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Adicionar Vendedor
        </Button>
      </Box>

      {/* --- ESTADO DE ERRO --- */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar vendedores: {(error as any).message}
        </Alert>
      )}

      {/* --- TABELA DE DADOS --- */}
      <Paper elevation={3} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={vendedores || []}
          columns={colunas}
          getRowId={(row) => row.id_usuario} // Diz ao DataGrid qual é o ID
          loading={isLoadingVendedores}
          slots={{
            loadingOverlay: LinearProgress,
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          autoHeight={false}
        />
      </Paper>
      
      {/* --- MODAL DE ADICIONAR/EDITAR --- */}
      {modalFormAberto && (
        <ModalFormVendedor
          open={modalFormAberto}
          onClose={handleCloseModal}
          vendedor={vendedorSelecionado}
        />
      )}
      
      {/* Renderiza apenas se um vendedor estiver selecionado */}
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