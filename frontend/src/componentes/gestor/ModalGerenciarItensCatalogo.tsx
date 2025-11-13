// /frontend/src/componentes/gestor/ModalGerenciarItensCatalogo.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Paper, LinearProgress, Alert, Chip, Divider, Tooltip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import type { ICatalogo, IItemCatalogo } from '../../tipos/schemas';
import { 
  useGetItensCatalogo, 
  useDeleteItemCatalogo 
} from '../../api/servicos/gestorCatalogoService';
import { ModalFormItemCatalogo } from './ModalFormItemCatalogo';
import { ModalConfirmarExclusao } from '../layout/ModalConfirmarExclusao';
import { formatCurrency } from '../../utils/format';

interface ModalGerenciarItensProps {
  open: boolean;
  onClose: () => void;
  catalogo: ICatalogo;
}

export const ModalGerenciarItensCatalogo: React.FC<ModalGerenciarItensProps> = ({ open, onClose, catalogo }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<IItemCatalogo | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const { 
    data: itens, 
    isLoading, 
    isError, 
    error 
  } = useGetItensCatalogo(catalogo.id_catalogo);

  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItemCatalogo();

  // Lista de IDs de produtos já no catálogo
  const produtosNoCatalogoIds = useMemo(() => {
    return (itens || []).map(item => item.id_produto);
  }, [itens]);

  const colunas: GridColDef[] = [
    { 
      field: 'produto', 
      headerName: 'Produto', 
      flex: 2,
      minWidth: 250,
      valueGetter: (value, row) => {
        // ✅ CORREÇÃO: DataGrid v7 mudou a assinatura do valueGetter
        // Agora é (value, row) em vez de (params)
        if (row?.produto) {
          return `${row.produto.cd_produto} - ${row.produto.ds_produto}`;
        }
        return 'Carregando...';
      }
    },
    { 
      field: 'vl_preco_catalogo', 
      headerName: 'Preço', 
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" fontWeight={600} color="success.main">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'fl_ativo_no_catalogo', 
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
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Editar Preço">
              <EditIcon />
            </Tooltip>
          }
          label="Editar Preço"
          onClick={() => handleOpenEdit(params.row as IItemCatalogo)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Remover do Catálogo">
              <DeleteIcon />
            </Tooltip>
          }
          label="Remover do Catálogo"
          onClick={() => handleOpenDelete(params.id as number)}
          showInMenu={false}
        />,
      ],
    },
  ];

  const handleOpenCreate = () => {
    setItemSelecionado(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: IItemCatalogo) => {
    setItemSelecionado(item);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setItemSelecionado(undefined);
  };

  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteItem(
        { idItemCatalogo: idParaExcluir, idCatalogo: catalogo.id_catalogo },
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
                Gerenciar Preços
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {catalogo.no_catalogo}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              size="large"
            >
              Adicionar Produto
            </Button>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 2 }}>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro ao carregar itens: {(error as any).message}
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
              rows={itens || []}
              columns={colunas}
              getRowId={(row) => row.id_item_catalogo}
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
      <ModalFormItemCatalogo
        open={formOpen}
        onClose={handleCloseForm}
        idCatalogo={catalogo.id_catalogo}
        idEmpresa={catalogo.id_empresa}
        item={itemSelecionado}
        produtosJaNoCatalogo={produtosNoCatalogoIds}
      />
      
      {/* Modal Filho (Exclusão) */}
      <ModalConfirmarExclusao
        open={deleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        titulo="Remover Produto"
        mensagem="Tem certeza que deseja remover este produto do catálogo? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </>
  );
};