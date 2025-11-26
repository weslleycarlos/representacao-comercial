import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, Alert, LinearProgress, Chip, Stack
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { useGetFormasPagamentoGestor, useDeleteFormaPagamento } from '../../../api/servicos/gestorConfigService';
import type { IFormaPagamento } from '../../../tipos/schemas';
import { ModalFormFormaPagamento } from '../../../componentes/gestor/ModalFormFormaPagamento';
import { ModalConfirmarExclusao } from '../../../componentes/layout/ModalConfirmarExclusao';

export const AbaFormasPagamento: React.FC = () => {
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<IFormaPagamento | undefined>(undefined);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const {
    data: formas,
    isLoading,
    isError,
    error
  } = useGetFormasPagamentoGestor();
  const { mutate: deleteForma, isPending: isDeleting } = useDeleteFormaPagamento();

  const handleOpenCreate = () => {
    setItemSelecionado(undefined);
    setModalFormOpen(true);
  };
  const handleOpenEdit = (item: IFormaPagamento) => {
    setItemSelecionado(item);
    setModalFormOpen(true);
  };
  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setModalDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteForma(idParaExcluir, {
        onSuccess: () => {
          setModalDeleteOpen(false);
          setIdParaExcluir(null);
        }
      });
    }
  };

  const colunas: GridColDef[] = [
    { field: 'no_forma_pagamento', headerName: 'Nome', flex: 1.5 },
    {
      field: 'fl_permite_parcelamento',
      headerName: 'Parcelamento',
      width: 120,
      type: 'boolean',
      renderCell: (params) => (
        <Chip
          label={params.value ? "Sim" : "Não"}
          color={params.value ? "success" : "default"}
          size="small"
          variant="outlined"
        />
      )
    },
    { field: 'qt_maximo_parcelas', headerName: 'Máx. Parcelas', width: 120, align: 'center', headerAlign: 'center' },
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
      field: 'origem',
      headerName: 'Origem',
      width: 120,
      valueGetter: (value, row) => row.id_organizacao ? 'Personalizada' : 'Global'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      getActions: (params) => {
        const isGlobal = !params.row.id_organizacao;
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Editar"
            onClick={() => handleOpenEdit(params.row as IFormaPagamento)}
            disabled={isGlobal} // Não pode editar globais
            showInMenu={false}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Excluir"
            onClick={() => handleOpenDelete(params.id as number)}
            disabled={isGlobal} // Não pode excluir globais
            showInMenu={false}
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nova Forma de Pagamento
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
          rows={formas || []}
          columns={colunas}
          getRowId={(row) => row.id_forma_pagamento}
          loading={isLoading}
          slots={{ loadingOverlay: LinearProgress }}
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

      <ModalFormFormaPagamento
        open={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        formaPagamento={itemSelecionado}
      />

      <ModalConfirmarExclusao
        open={modalDeleteOpen}
        onClose={() => setModalDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="Excluir Forma de Pagamento"
        mensagem="Tem certeza? Esta ação não pode ser desfeita se a forma já tiver sido usada em pedidos."
        isLoading={isDeleting}
      />
    </Box>
  );
};