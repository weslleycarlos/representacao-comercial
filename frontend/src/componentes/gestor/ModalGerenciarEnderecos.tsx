// /frontend/src/componentes/gestor/ModalGerenciarEnderecos.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { IClienteCompleto, IEndereco } from '../../tipos/schemas';
import { useGetEnderecosPorCliente, useDeleteEndereco } from '../../api/servicos/clienteService';
import { ModalFormEndereco } from './ModalFormEndereco';
import { ModalConfirmarExclusao } from '../layout/ModalConfirmarExclusao';
import { formatCurrency } from '../../utils/format';

// Tipos para os hooks que serão passados via Props
type GetEnderecosHook = UseQueryResult<IEndereco[], Error>;
type AddEnderecoHook = UseMutationResult<IEndereco, Error, { idCliente: number; data: EnderecoFormData; }, unknown>;
type UpdateEnderecoHook = UseMutationResult<IEndereco, Error, { idEndereco: number; idCliente: number; data: Partial<EnderecoFormData>; }, unknown>;
type DeleteEnderecoHook = UseMutationResult<void, Error, { idEndereco: number; idCliente: number; }, unknown>;


interface ModalGerenciarEnderecosProps {
  open: boolean;
  onClose: () => void;
  cliente: IClienteCompleto;
  
  // Hooks passados como props
  getEnderecosHook: GetEnderecosHook;
  addEnderecoHook: AddEnderecoHook;
  updateEnderecoHook: UpdateEnderecoHook;
  deleteEnderecoHook: DeleteEnderecoHook;
}

export const ModalGerenciarEnderecos: React.FC<ModalGerenciarEnderecosProps> = ({ 
  open, onClose, cliente,
  getEnderecosHook, addEnderecoHook, updateEnderecoHook, deleteEnderecoHook
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<IEndereco | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  // 1. Hooks de API (agora vêm das props)
  const { data: enderecos, isLoading, isError, error } = getEnderecosHook;
  const { mutate: deleteEndereco, isPending: isDeleting } = deleteEnderecoHook;

  // 3. Colunas da Tabela
  const colunas: GridColDef[] = [
    {
      field: 'tp_endereco',
      headerName: 'Tipo',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    { field: 'ds_logradouro', headerName: 'Logradouro', flex: 2 },
    { field: 'no_cidade', headerName: 'Cidade', flex: 1 },
    { field: 'sg_estado', headerName: 'UF', width: 60 },
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
      ),
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
          onClick={() => handleOpenEdit(params.row as IEndereco)}
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
        {
          onSuccess: () => {
            setDeleteOpen(false);
            setIdParaExcluir(null);
          },
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
    setEnderecoSelecionado(undefined);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Gerenciar Endereços
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
              Adicionar Endereço
            </Button>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao carregar endereços: {(error as any).message}
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
              rows={enderecos || []}
              columns={colunas}
              getRowId={(row) => row.id_endereco}
              loading={isLoading}
              slots={{ loadingOverlay: LinearProgress }}
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
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
          <Button onClick={onClose} variant="contained" size="large" fullWidth>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {formOpen && (
        <ModalFormEndereco
          open={formOpen}
          onClose={() => setFormOpen(false)}
          idCliente={cliente.id_cliente}
          endereco={enderecoSelecionado}
          
          // Passando os hooks corretos (seja do Gestor ou Vendedor)
          addHook={addEnderecoHook}
          updateHook={updateEnderecoHook}
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