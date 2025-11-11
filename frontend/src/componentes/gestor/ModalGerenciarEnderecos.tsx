// /frontend/src/componentes/gestor/ModalGerenciarEnderecos.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, IconButton, Paper, LinearProgress, Alert, Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import type { IClienteCompleto, IEndereco } from '../../tipos/schemas';
import { useGetEnderecosPorCliente, useDeleteEndereco } from '../../api/servicos/clienteService';
import { ModalFormEndereco } from './ModalFormEndereco';
import { ModalConfirmarExclusao } from '../layout/ModalConfirmarExclusao';

interface ModalGerenciarEnderecosProps {
  open: boolean;
  onClose: () => void;
  cliente: IClienteCompleto;
}

export const ModalGerenciarEnderecos: React.FC<ModalGerenciarEnderecosProps> = ({ open, onClose, cliente }) => {
  // Estado para o modal filho (formulário)
  const [formOpen, setFormOpen] = useState(false);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<IEndereco | undefined>(undefined);
  
  // Estado para o modal de exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  // 1. Hook de Busca (TanStack Query)
  const { 
    data: enderecos, 
    isLoading, 
    isError, 
    error 
  } = useGetEnderecosPorCliente(cliente.id_cliente);

  // 2. Hook de Mutação (Delete)
  const { mutate: deleteEndereco, isPending: isDeleting } = useDeleteEndereco();

  // 3. Colunas da Tabela
  const colunas: GridColDef[] = [
    { field: 'tp_endereco', headerName: 'Tipo', width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      )
    },
    { field: 'ds_logradouro', headerName: 'Logradouro', flex: 2 },
    { field: 'no_cidade', headerName: 'Cidade', flex: 1 },
    { field: 'sg_estado', headerName: 'UF', width: 60 },
    { field: 'fl_principal', headerName: 'Principal', width: 100,
      renderCell: (params) => (params.value ? 'Sim' : 'Não')
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenEdit(params.row as IEndereco)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleOpenDelete(params.id as number)}
        />,
      ],
    },
  ];

  // 4. Handlers dos Modais
  const handleOpenCreate = () => {
    setEnderecoSelecionado(undefined);
    setFormOpen(true);
  };
  
  const handleOpenEdit = (endereco: IEndereco) => {
    setEnderecoSelecionado(endereco);
    setFormOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteEndereco(
        { idEndereco: idParaExcluir, idCliente: cliente.id_cliente },
        { onSuccess: () => setDeleteOpen(false) }
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              Gerenciar Endereços
              <Typography variant="body2" color="text.secondary">
                Cliente: {cliente.no_razao_social}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Adicionar Endereço
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ minHeight: '400px' }}>
          {isError && <Alert severity="error">Erro: {(error as any).message}</Alert>}
          
          <Paper elevation={0} sx={{ height: 400, width: '100%', mt: 2 }}>
            <DataGrid
              rows={enderecos || []}
              columns={colunas}
              getRowId={(row) => row.id_endereco}
              loading={isLoading}
              slots={{ loadingOverlay: LinearProgress }}
              density="compact"
            />
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Filho (Formulário) */}
      {formOpen && (
        <ModalFormEndereco
          open={formOpen}
          onClose={() => setFormOpen(false)}
          idCliente={cliente.id_cliente}
          endereco={enderecoSelecionado}
        />
      )}
      
      {/* Modal Filho (Exclusão) */}
      <ModalConfirmarExclusao
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="Confirmar Exclusão"
        mensagem="Tem certeza que deseja excluir este endereço?"
        isLoading={isDeleting}
      />
    </>
  );
};