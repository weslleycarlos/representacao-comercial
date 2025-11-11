// /frontend/src/componentes/gestor/ModalGerenciarContatos.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Paper, LinearProgress, Alert, Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import type { IClienteCompleto, IContato } from '../../tipos/schemas';
import { useGetContatosPorCliente, useDeleteContato } from '../../api/servicos/clienteService';
import { ModalFormContato } from './ModalFormContato';
import { ModalConfirmarExclusao } from '../layout/ModalConfirmarExclusao';

interface ModalGerenciarContatosProps {
  open: boolean;
  onClose: () => void;
  cliente: IClienteCompleto;
}

export const ModalGerenciarContatos: React.FC<ModalGerenciarContatosProps> = ({ open, onClose, cliente }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<IContato | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const { 
    data: contatos, 
    isLoading, 
    isError, 
    error 
  } = useGetContatosPorCliente(cliente.id_cliente);

  const { mutate: deleteContato, isPending: isDeleting } = useDeleteContato();

  const colunas: GridColDef[] = [
    { field: 'no_contato', headerName: 'Nome', flex: 2 },
    { field: 'ds_cargo', headerName: 'Cargo', flex: 1 },
    { field: 'ds_email', headerName: 'Email', flex: 2 },
    { field: 'nr_telefone', headerName: 'Telefone', flex: 1 },
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
          onClick={() => handleOpenEdit(params.row as IContato)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Excluir"
          onClick={() => handleOpenDelete(params.id as number)}
        />,
      ],
    },
  ];

  const handleOpenCreate = () => {
    setContatoSelecionado(undefined);
    setFormOpen(true);
  };
  
  const handleOpenEdit = (contato: IContato) => {
    setContatoSelecionado(contato);
    setFormOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteContato(
        { idContato: idParaExcluir, idCliente: cliente.id_cliente },
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
              Gerenciar Contatos
              <Typography variant="body2" color="text.secondary">
                Cliente: {cliente.no_razao_social}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Adicionar Contato
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ minHeight: '400px' }}>
          {isError && <Alert severity="error">Erro: {(error as any).message}</Alert>}
          
          <Paper elevation={0} sx={{ height: 400, width: '100%', mt: 2 }}>
            <DataGrid
              rows={contatos || []}
              columns={colunas}
              getRowId={(row) => row.id_contato}
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
        <ModalFormContato
          open={formOpen}
          onClose={() => setFormOpen(false)}
          idCliente={cliente.id_cliente}
          contato={contatoSelecionado}
        />
      )}
      
      {/* Modal Filho (Exclusão) */}
      <ModalConfirmarExclusao
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="Confirmar Exclusão"
        mensagem="Tem certeza que deseja excluir este contato?"
        isLoading={isDeleting}
      />
    </>
  );
};