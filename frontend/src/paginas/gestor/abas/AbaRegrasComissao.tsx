import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Stack
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { useGetRegrasComissao, useDeleteRegraComissao } from '../../../api/servicos/gestorConfigService';
import type { IRegraComissao } from '../../../tipos/schemas';
import { ModalFormRegraComissao } from '../../../componentes/gestor/ModalFormRegraComissao';
import { ModalConfirmarExclusao } from '../../../componentes/layout/ModalConfirmarExclusao';

export const AbaRegrasComissao: React.FC = () => {
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<IRegraComissao | undefined>(undefined);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const { data: regras, isLoading, isError, error } = useGetRegrasComissao();
  const { mutate: deleteRegra, isPending: isDeleting } = useDeleteRegraComissao();

  const handleOpenCreate = () => {
    setItemSelecionado(undefined);
    setModalFormOpen(true);
  };
  const handleOpenEdit = (item: IRegraComissao) => {
    setItemSelecionado(item);
    setModalFormOpen(true);
  };
  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteRegra(idParaExcluir, {
        onSuccess: () => {
          setModalDeleteOpen(false);
          setIdParaExcluir(null);
        }
      });
    }
  };

  const colunas: GridColDef[] = [
    { field: 'pc_comissao', headerName: '% Comissão', width: 100, align: 'right', headerAlign: 'right',
      valueFormatter: (value) => `${value}%`
    },
    { field: 'nr_prioridade', headerName: 'Prioridade', width: 100, align: 'center', headerAlign: 'center' },
    { field: 'empresa', headerName: 'Empresa Alvo', flex: 1.5,
      valueGetter: (value, row) => row.empresa?.no_empresa || 'Todas'
    },
    { field: 'usuario', headerName: 'Vendedor Alvo', flex: 1.5,
      valueGetter: (value, row) => row.usuario?.no_completo || 'Todos'
    },
    { field: 'dt_inicio_vigencia', headerName: 'Início', width: 110,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
    },
    { field: 'dt_fim_vigencia', headerName: 'Fim', width: 110,
      valueGetter: (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
    },
    {
      field: 'fl_ativa',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Ativa" : "Inativa"}
          color={params.value ? "success" : "default"}
          size="small"
          variant="outlined"
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
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenEdit(params.row as IRegraComissao)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleOpenDelete(params.id as number)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nova Regra de Comissão
        </Button>
      </Stack>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Erro: {(error as any).message}</Alert>}

      <Paper
        elevation={0}
        sx={{
          height: 500,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <DataGrid
          rows={regras || []}
          columns={colunas}
          getRowId={(row) => row.id_regra_comissao}
          loading={isLoading}
          slots={{ loadingOverlay: LinearProgress }}
          disableRowSelectionOnClick
          initialState={{
            sorting: { sortModel: [{ field: 'nr_prioridade', sort: 'desc' }] },
          }}
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

      <ModalFormRegraComissao
        open={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        regra={itemSelecionado}
      />

      <ModalConfirmarExclusao
        open={modalDeleteOpen}
        onClose={() => setModalDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="Excluir Regra"
        mensagem="Tem certeza que deseja excluir esta regra de comissão?"
        isLoading={isDeleting}
      />
    </Box>
  );
};