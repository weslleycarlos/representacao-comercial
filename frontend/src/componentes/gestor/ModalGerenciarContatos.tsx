// /frontend/src/componentes/gestor/ModalGerenciarContatos.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Paper, LinearProgress, Alert, Chip, Divider, Tooltip
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
    { 
      field: 'no_contato', 
      headerName: 'Nome', 
      flex: 2,
      minWidth: 150
    },
    { 
      field: 'ds_cargo', 
      headerName: 'Cargo', 
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'ds_email', 
      headerName: 'E-mail', 
      flex: 2,
      minWidth: 180
    },
    { 
      field: 'nr_telefone', 
      headerName: 'Telefone', 
      flex: 1,
      minWidth: 130
    },
    { 
      field: 'fl_principal', 
      headerName: 'Principal', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Sim' : 'Não'}
          color={params.value ? 'primary' : 'default'}
          size="small"
          sx={{ fontWeight: 500 }}
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
          icon={
            <Tooltip title="Editar">
              <EditIcon />
            </Tooltip>
          }
          label="Editar"
          onClick={() => handleOpenEdit(params.row as IContato)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Excluir">
              <DeleteIcon />
            </Tooltip>
          }
          label="Excluir"
          onClick={() => handleOpenDelete(params.id as number)}
          showInMenu={false}
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
        { 
          onSuccess: () => {
            setDeleteOpen(false);
            setIdParaExcluir(null);
          }
        }
      );
    }
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setIdParaExcluir(null);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setContatoSelecionado(undefined);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Gerenciar Contatos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {cliente.no_razao_social}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              size="large"
            >
              Novo Contato
            </Button>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 2 }}>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao carregar contatos: {(error as any).message}
            </Alert>
          )}
          
          <Paper 
            elevation={0} 
            sx={{ 
              height: 450,
              width: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <DataGrid
              rows={contatos || []}
              columns={colunas}
              getRowId={(row) => row.id_contato}
              loading={isLoading}
              slots={{ loadingOverlay: LinearProgress }}
              disableRowSelectionOnClick
              initialState={{
                pagination: { 
                  paginationModel: { pageSize: 10 } 
                },
              }}
              pageSizeOptions={[5, 10, 25]}
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
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={onClose}
            variant="contained"
            size="large"
            fullWidth
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Filho (Formulário) */}
      <ModalFormContato
        open={formOpen}
        onClose={handleCloseForm}
        idCliente={cliente.id_cliente}
        contato={contatoSelecionado}
      />
      
      {/* Modal Filho (Exclusão) */}
      <ModalConfirmarExclusao
        open={deleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        titulo="Excluir Contato"
        mensagem="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </>
  );
};