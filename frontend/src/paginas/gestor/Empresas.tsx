// /frontend/src/paginas/gestor/Empresas.tsx
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  IconButton,
  Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ModalConfirmarExclusao } from '../../componentes/layout/ModalConfirmarExclusao';
import { useDeleteEmpresa, useGetEmpresas } from '../../api/servicos/empresaService';
import type { EmpresaCompletaSchema } from '../../tipos/schemas';
import { ModalFormEmpresa } from '../../componentes/gestor/ModalFormEmpresa';
import { useState } from 'react';
// (Vamos criar o ModalConfirmarExclusao no próximo passo)
// import { ModalConfirmarExclusao } from '../../componentes/layout/ModalConfirmarExclusao';

export const PaginaEmpresas: React.FC = () => {
  // Estado para controlar o modal de Adicionar/Editar
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaCompletaSchema | undefined>(undefined);
  
  // Estado para o modal de confirmação de exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  // 1. Hook de Busca (TanStack Query)
  const { 
    data: empresas, 
    isLoading: isLoadingEmpresas, 
    isError, 
    error 
  } = useGetEmpresas();

  // 2. Hook de Mutação (Delete)
  const { mutate: deleteEmpresa, isPending: isDeleting } = useDeleteEmpresa();
  
  // 3. Definição das Colunas da Tabela
  const colunas: GridColDef[] = [
    { 
      field: 'no_empresa', 
      headerName: 'Nome da Empresa', 
      flex: 2,
    },
    { 
      field: 'nr_cnpj', 
      headerName: 'CNPJ', 
      flex: 1,
    },
    { 
      field: 'pc_comissao_padrao', 
      headerName: 'Comissão Padrão', 
      flex: 1,
      renderCell: (params) => `${params.value}%`
    },
    { 
      field: 'fl_ativa', 
      headerName: 'Status', 
      flex: 1,
      renderCell: (params) => (
        params.value ? 
          <Chip label="Ativa" color="success" size="small" /> : 
          <Chip label="Inativa" color="error" size="small" />
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
          label="Editar"
          onClick={() => handleOpenEdit(params.row as EmpresaCompletaSchema)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Desativar"
          onClick={() => handleOpenDelete(params.id as number)}
          disabled={!params.row.fl_ativa} // Desabilita se já estiver inativa
        />,
      ],
    },
  ];

  // 4. Funções de Manipulação de Modal
  const handleOpenCreate = () => {
    setEmpresaSelecionada(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (empresa: EmpresaCompletaSchema) => {
    setEmpresaSelecionada(empresa);
    setModalFormAberto(true);
  };
  
  const handleCloseModal = () => {
    setModalFormAberto(false);
    // (Não limpamos a 'empresaSelecionada' até o modal fechar completamente)
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteEmpresa(idParaExcluir, {
        onSuccess: () => setModalExcluirAberto(false)
      });
    }
  };

  return (
    <Box>
      {/* --- TÍTULO E BOTÃO --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestão de Empresas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Adicionar Empresa
        </Button>
      </Box>

      {/* --- ESTADO DE ERRO --- */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar empresas: {(error as any).message}
        </Alert>
      )}

      {/* --- TABELA DE DADOS --- */}
      <Paper elevation={3} sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={empresas || []}
          columns={colunas}
          getRowId={(row) => row.id_empresa} // Diz ao DataGrid qual é o ID
          loading={isLoadingEmpresas}
          slots={{
            loadingOverlay: LinearProgress, // Barra de loading
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          autoHeight={false} // Faz a tabela ocupar a altura do Paper
        />
      </Paper>
      
      {/* --- MODAL DE ADICIONAR/EDITAR --- */}
      {modalFormAberto && (
        <ModalFormEmpresa
          open={modalFormAberto}
          onClose={handleCloseModal}
          empresa={empresaSelecionada}
        />
      )}
      
      {/* --- MODAL DE CONFIRMAR EXCLUSÃO --- */}
      {/* (Vamos criar este componente genérico no próximo passo, 
           mas a lógica está pronta) */}
      { <ModalConfirmarExclusao
        open={modalExcluirAberto}
        onClose={() => setModalExcluirAberto(false)}
        onConfirm={handleConfirmDelete}
        titulo="Confirmar Desativação"
        mensagem="Tem certeza que deseja desativar esta empresa? Esta ação é reversível."
        isLoading={isDeleting}
      />
      }
    </Box>
  );
};