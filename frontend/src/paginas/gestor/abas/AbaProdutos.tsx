// /frontend/src/paginas/gestor/abas/AbaProdutos.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState } from 'react';
import {
  Box, Button, Paper, Alert, LinearProgress, Chip, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ViewWeek as GradeIcon } from '@mui/icons-material';

import { useGetProdutosPorEmpresa, useDeleteProduto, useGetCategorias } from '../../../api/servicos/gestorCatalogoService';
import type { IProdutoCompleto } from '../../../tipos/schemas';
import { ModalFormProduto } from '../../../componentes/gestor/ModalFormProduto';
import { ModalConfirmarExclusao } from '../../../componentes/layout/ModalConfirmarExclusao';
import { ModalGerenciarVariacoes } from '../../../componentes/gestor/ModalGerenciarVariacoes';

interface AbaProdutosProps {
  idEmpresa: number;
}

export const AbaProdutos: React.FC<AbaProdutosProps> = ({ idEmpresa }) => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [prodSelecionado, setProdSelecionado] = useState<IProdutoCompleto | undefined>(undefined);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  const [modalVariacoesAberto, setModalVariacoesAberto] = useState(false);

  const {
    data: produtos,
    isLoading,
    isError,
    error
  } = useGetProdutosPorEmpresa(idEmpresa);

  const {
    data: categorias,
    isLoading: isLoadingCategorias
  } = useGetCategorias();

  const { mutate: deleteProduto, isPending: isDeleting } = useDeleteProduto();

  const colunas: GridColDef[] = [
    {
      field: 'cd_produto',
      headerName: 'Código',
      width: 120,
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'ds_produto',
      headerName: 'Descrição',
      flex: 2,
      minWidth: 250
    },
    {
      field: 'sg_unidade_medida',
      headerName: 'UN',
      width: 80,
      headerAlign: 'center',
      align: 'center'
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
            <Tooltip title="Editar">
              <EditIcon />
            </Tooltip>
          }
          label="Editar"
          onClick={() => handleOpenEdit(params.row as IProdutoCompleto)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Gerenciar Grade (Cores/Tamanhos)">
              <GradeIcon />
            </Tooltip>
          }
          label="Grade"
          onClick={() => handleOpenVariacoes(params.row as IProdutoCompleto)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title={params.row.fl_ativo ? "Desativar" : "Produto já inativo"}>
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
    setProdSelecionado(undefined);
    setModalFormAberto(true);
  };

  const handleOpenEdit = (produto: IProdutoCompleto) => {
    setProdSelecionado(produto);
    setModalFormAberto(true);
  };

  const handleCloseModal = () => {
    setModalFormAberto(false);
    setProdSelecionado(undefined);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteProduto(idParaExcluir, {
        onSuccess: () => {
          setModalExcluirAberto(false);
          setIdParaExcluir(null);
        }
      });
    }
  };

  const handleCloseDelete = () => {
    setModalExcluirAberto(false);
    setIdParaExcluir(null);
  };

  const handleOpenVariacoes = (produto: IProdutoCompleto) => {
    setProdSelecionado(produto);
    setModalVariacoesAberto(true);
  };

  const handleCloseVariacoes = () => {
    setModalVariacoesAberto(false);
    setProdSelecionado(undefined);
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Novo Produto
        </Button>
      </Box>

      {/* Estado de Erro */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar produtos: {(error as any).message}
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
          rows={produtos || []}
          columns={colunas}
          getRowId={(row) => row.id_produto}
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

      {/* Modal de Form */}
      <ModalFormProduto
        open={modalFormAberto}
        onClose={handleCloseModal}
        idEmpresa={idEmpresa}
        produto={prodSelecionado}
        categorias={categorias || []}
        isLoadingCategorias={isLoadingCategorias}
      />

      {/* Modal de Exclusão */}
      <ModalConfirmarExclusao
        open={modalExcluirAberto}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        titulo="Desativar Produto"
        mensagem="Tem certeza que deseja desativar este produto? Ele será removido dos catálogos ativos, mas permanecerá no histórico de pedidos."
        isLoading={isDeleting}
      />

      {/* Modal de Variações (Grade) */}
      <ModalGerenciarVariacoes
        open={modalVariacoesAberto}
        onClose={handleCloseVariacoes}
        produto={prodSelecionado || null}
      />
    </Box>
  );
};