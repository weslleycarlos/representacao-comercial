// /frontend/src/componentes/gestor/ModalGerenciarItensCatalogo.tsx
import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Paper, LinearProgress, Alert, Chip
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import type { ICatalogo, IItemCatalogo, IProdutoCompleto } from '../../tipos/schemas';
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

  // 1. Hook de Busca
  const { 
    data: itens, 
    isLoading, 
    isError, 
    error 
  } = useGetItensCatalogo(catalogo.id_catalogo);

  // 2. Hook de Mutação (Delete)
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItemCatalogo();

  // 3. Otimização: Lista de IDs de produtos já no catálogo (para o modal filho)
  const produtosNoCatalogoIds = useMemo(() => {
    return (itens || []).map(item => item.id_produto);
  }, [itens]);

  const colunas: GridColDef[] = [
    // ...
    { field: 'produto', headerName: 'Produto (Descrição)', flex: 2,
      valueGetter: (params) => {
        // --- CORREÇÃO AQUI ---
        // Verifica se 'params.row' E 'params.row.produto' existem
        if (params.row && params.row.produto) {
          return `(${params.row.produto.cd_produto}) ${params.row.produto.ds_produto}`;
        }
        // Fallback seguro se o produto não for carregado
        return 'Carregando produto...';
        // --- FIM DA CORREÇÃO ---
      }
    },
    { field: 'vl_preco_catalogo', headerName: 'Preço (R$)', width: 120,
      renderCell: (params) => formatCurrency(params.value)
    },
    { field: 'fl_ativo_no_catalogo', headerName: 'Status', width: 100,
      renderCell: (params) => (
        params.value ? 
          <Chip label="Ativo" color="success" size="small" /> : 
          <Chip label="Inativo" color="error" size="small" />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar Preço"
          onClick={() => handleOpenEdit(params.row as IItemCatalogo)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Remover do Catálogo"
          onClick={() => handleOpenDelete(params.id as number)}
        />,
      ],
    },
  ];

  // 4. Handlers dos Modais
  const handleOpenCreate = () => {
    setItemSelecionado(undefined);
    setFormOpen(true);
  };
  const handleOpenEdit = (item: IItemCatalogo) => {
    setItemSelecionado(item);
    setFormOpen(true);
  };
  const handleOpenDelete = (id: number) => {
    setIdParaExcluir(id);
    setDeleteOpen(true);
  };
  const handleConfirmDelete = () => {
    if (idParaExcluir) {
      deleteItem(
        { idItemCatalogo: idParaExcluir, idCatalogo: catalogo.id_catalogo },
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
              Gerenciar Itens do Catálogo
              <Typography variant="body2" color="text.secondary">
                Catálogo: {catalogo.no_catalogo}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Adicionar Item/Preço
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ minHeight: '400px' }}>
          {isError && <Alert severity="error">Erro: {(error as any).message}</Alert>}
          
          <Paper elevation={0} sx={{ height: 400, width: '100%', mt: 2 }}>
            <DataGrid
              rows={itens || []}
              columns={colunas}
              getRowId={(row) => row.id_item_catalogo}
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
        <ModalFormItemCatalogo
          open={formOpen}
          onClose={() => setFormOpen(false)}
          idCatalogo={catalogo.id_catalogo}
          idEmpresa={catalogo.id_empresa}
          item={itemSelecionado}
          produtosJaNoCatalogo={produtosNoCatalogoIds}
        />
      )}
      
      {/* Modal Filho (Exclusão) */}
      <ModalConfirmarExclusao
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        titulo="Confirmar Exclusão"
        mensagem="Tem certeza que deseja remover este produto deste catálogo?"
        isLoading={isDeleting}
      />
    </>
  );
};