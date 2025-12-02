// /frontend/src/paginas/gestor/abas/AbaCatalogos.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlaylistAddCheck as ItensIcon,
  CloudUpload as ImportIcon
} from '@mui/icons-material';

import { useGetCatalogosPorEmpresa, useDeleteCatalogo } from '../../../api/servicos/gestorCatalogoService';
import type { ICatalogo } from '../../../tipos/schemas';
import { ModalFormCatalogo } from '../../../componentes/gestor/ModalFormCatalogo';
import { ModalConfirmarExclusao } from '../../../componentes/layout/ModalConfirmarExclusao';
import { ModalGerenciarItensCatalogo } from '../../../componentes/gestor/ModalGerenciarItensCatalogo';
import { ModalImportarCatalogo } from '../../../componentes/gestor/ModalImportarCatalogo';

interface AbaCatalogosProps {
  idEmpresa: number;
}

export const AbaCatalogos: React.FC<AbaCatalogosProps> = ({ idEmpresa }) => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalItensAberto, setModalItensAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [catalogoSelecionado, setCatalogoSelecionado] = useState<ICatalogo | undefined>(undefined);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const {
    data: catalogos,
    isLoading,
    isError,
    error
  } = useGetCatalogosPorEmpresa(idEmpresa);

  const { mutate: deleteCatalogo, isPending: isDeleting } = useDeleteCatalogo();

  const colunas: GridColDef[] = [
    {
      field: 'no_catalogo',
      headerName: 'Nome do Catálogo',
      flex: 2,
      minWidth: 200
    },
    {
      field: 'dt_inicio_vigencia',
      headerName: 'Início',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('pt-BR') : '-'
    },
    {
      field: 'dt_fim_vigencia',
      headerName: 'Fim',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('pt-BR') : '-'
    },
    {
      field: 'fl_ativo',
      headerName: 'Status',
      width: 100,
      headerAlign: 'center',
      align: 'center',
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
            <Tooltip title="Gerenciar Preços">
              <ItensIcon />
            </Tooltip>
          }
          label="Gerenciar Itens (Preços)"
          onClick={() => handleOpenItens(params.row as ICatalogo)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Editar">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Catálogo"
          onClick={() => handleOpenEdit(params.row as ICatalogo)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title={params.row.fl_ativo ? "Desativar" : "Catálogo já inativo"}>
              <DeleteIcon />
            </Tooltip>
          }
          label="Desativar"
          onClick={() => handleOpenDelete(params.id as number)}
          disabled={!params.row.fl_ativo}
          showInMenu={false}
        />,
      ],
    },
  ];

  const handleOpenCreate = () => {
    setCatalogoSelecionado(undefined);
    setModalFormAberto(true);
  };

  const handleOpenItens = (catalogo: ICatalogo) => {
    setCatalogoSelecionado(catalogo);
    setModalItensAberto(true);
  };

  const handleOpenEdit = (catalogo: ICatalogo) => {
    setCatalogoSelecionado(catalogo);
    setModalFormAberto(true);
  };

  const handleCloseModal = () => {
    setModalFormAberto(false);
    setCatalogoSelecionado(undefined);
  };

  const handleCloseItens = () => {
    setModalItensAberto(false);
    setCatalogoSelecionado(undefined);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteCatalogo(
        { idCatalogo: idParaExcluir, idEmpresa: idEmpresa },
        {
          onSuccess: () => {
            setModalExcluirAberto(false);
            setIdParaExcluir(null);
          }
        }
      );
    }
  };

  const handleCloseDelete = () => {
    setModalExcluirAberto(false);
    setIdParaExcluir(null);
  };

  return (
    <Box>
      {/* Header da Aba */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Novo Catálogo
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setModalImportarAberto(true)}
          >
            Importar Excel
          </Button>
        </Box>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar catálogos: {(error as any).message}
        </Alert>
      )}

      {/* Tabela */}
      <Paper
        elevation={0}
        sx={{
          height: 500,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <DataGrid
          rows={catalogos || []}
          columns={colunas}
          getRowId={(row) => row.id_catalogo}
          loading={isLoading}
          slots={{ loadingOverlay: LinearProgress }}
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
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

      {/* Modal de Gerenciar Itens */}
      {catalogoSelecionado && (
        <ModalGerenciarItensCatalogo
          open={modalItensAberto}
          onClose={handleCloseItens}
          catalogo={catalogoSelecionado}
        />
      )}

      {/* Modal de Form */}
      <ModalFormCatalogo
        open={modalFormAberto}
        onClose={handleCloseModal}
        idEmpresa={idEmpresa}
        catalogo={catalogoSelecionado}
      />

      {/* Modal de Importação */}
      <ModalImportarCatalogo
        open={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        idEmpresa={idEmpresa}
      />

      {/* Modal de Exclusão */}
      <ModalConfirmarExclusao
        open={modalExcluirAberto}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        titulo="Desativar Catálogo"
        mensagem="Tem certeza que deseja desativar este catálogo? Vendedores não poderão mais usá-lo para novos pedidos."
        isLoading={isDeleting}
      />
    </Box>
  );
};