// /frontend/src/paginas/vendedor/Catalogo.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart as AddCartIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { useGetCatalogoVenda, useGetCategoriasVenda } from '../../api/servicos/vendedorService';
import { formatCurrency } from '../../utils/format';
import type { IItemCatalogoVenda, IProdutoSimples } from '../../tipos/schemas';

// --- Componente Card do Produto (CORRIGIDO) ---
const CardProdutoCatalogo: React.FC<{ item: IItemCatalogoVenda }> = ({ item }) => {
  const produto = item.produto as IProdutoSimples;

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s',
          width: '260px',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-4px)',
            boxShadow: (theme) => `0 8px 16px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
          }
        }}
      >
        {/* Imagem (Box 1) */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9
            bgcolor: 'divider',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="caption">Sem imagem</Typography>
          </Box>
          <Chip
            label={produto.cd_produto}
            size="small"
            sx={{
              position: 'absolute', top: 8, left: 8,
              bgcolor: 'background.paper',
              fontWeight: 600, fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Conteúdo (Box 2) */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
            title={produto.ds_produto} // Dica (Tooltip) nativa
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              lineHeight: 1.4,
              minHeight: '2.8em', // Garante altura mínima (2 linhas)
              mb: 0.5,
              wordBreak: 'break-word', // Força quebra de palavras longas
              overflowWrap: 'break-word', // Nova propriedade para quebrar palavras
              width: '100%',
            }}
          >
            {produto.ds_produto}
          </Typography>

          {produto.variacoes && produto.variacoes.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {produto.variacoes.length} {produto.variacoes.length === 1 ? 'variação' : 'variações'}
            </Typography>
          )}

          {/* Preço (Empurrado para baixo) */}
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {formatCurrency(item.vl_preco_catalogo)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {produto.sg_unidade_medida || 'UN'}
            </Typography>
          </Box>
        </Box>

        {/* Footer - Botão (Box 3) */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<AddCartIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Adicionar
          </Button>
        </Box>
      </Paper>
    </Grid>
  );
};

// --- Componente da Página Principal ---
export const PaginaVendedorCatalogo: React.FC = () => {
  const [idCategoriaFiltro, setIdCategoriaFiltro] = useState<number | undefined>(undefined);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const {
    data: itensCatalogo, // ✅ Correção: 'data' é o nome correto
    isLoading: isLoadingCatalogo,
    isError,
    error,
  } = useGetCatalogoVenda(idCategoriaFiltro);

  const {
    data: categorias,
    isLoading: isLoadingCategorias,
  } = useGetCategoriasVenda();

  // Filtro de busca
  const itensFiltrados = React.useMemo(() => {
    if (!itensCatalogo) return [];
    if (!buscaTexto) return itensCatalogo;
    const buscaLower = buscaTexto.toLowerCase();
    return itensCatalogo.filter(
      (item) =>
        item.produto.ds_produto.toLowerCase().includes(buscaLower) ||
        item.produto.cd_produto.toLowerCase().includes(buscaLower)
    );
  }, [itensCatalogo, buscaTexto]);

  // Colunas da tabela
  const colunas: GridColDef[] = [
    {
      field: 'produto',
      headerName: 'Código',
      width: 120,
      valueGetter: (value: IProdutoSimples, row: IItemCatalogoVenda) => row.produto.cd_produto
    },
    {
      field: 'ds_produto',
      headerName: 'Produto',
      flex: 2,
      valueGetter: (value: unknown, row: IItemCatalogoVenda) => row.produto.ds_produto
    },
    {
      field: 'sg_unidade_medida',
      headerName: 'Unidade',
      width: 100,
      valueGetter: (value: unknown, row: IItemCatalogoVenda) => row.produto.sg_unidade_medida || 'UN'
    },
    {
      field: 'vl_preco_catalogo',
      headerName: 'Preço',
      width: 120,
      valueGetter: (value: number) => formatCurrency(value)
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddCartIcon />}
          onClick={() => console.log('Adicionar ao pedido:', params.row)}
        >
          Adicionar
        </Button>
      ),
    },
  ];

  // Dados para a tabela
  const dadosTabela = React.useMemo(() => {
    return itensFiltrados.map(item => ({
      ...item,
      id: item.id_item_catalogo
    }));
  }, [itensFiltrados]);

  const handleViewChange = (e: React.MouseEvent<{}>, newMode: 'cards' | 'table') => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Catálogo de Produtos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {itensFiltrados.length} {itensFiltrados.length === 1 ? 'produto' : 'produtos'} encontrados
        </Typography>
      </Box>

      {/* Filtros e Toggle */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3,
          border: '1px solid', borderColor: 'divider', borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Categoria"
              value={idCategoriaFiltro || ''}
              onChange={(e) => setIdCategoriaFiltro(Number(e.target.value) || undefined)}
              disabled={isLoadingCategorias}
              size="small"
              fullWidth
              SelectProps={{
                displayEmpty: true,
              }}
              slotProps={{
                inputLabel: { shrink: true }, // ✅ Corrige sobreposição de label
              }}
            >
              <MenuItem value="">
                <em>Todas as categorias</em>
              </MenuItem>
              {(categorias || []).map((cat) => (
                <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.no_categoria}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              placeholder="Buscar por código ou nome do produto..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                ),
              }}
              slotProps={{
                inputLabel: { shrink: true }, // ✅ Corrige sobreposição de label
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              fullWidth // ✅ Faz o toggle ocupar a largura do item
            >
              <ToggleButton value="cards" aria-label="cards view">
                <CardViewIcon />
              </ToggleButton>
              <ToggleButton value="table" aria-label="table view">
                <TableViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Conteúdo (Cards ou Tabela) */}
      {isLoadingCatalogo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erro ao carregar o catálogo: {(error as any).message}
        </Alert>
      )}
      {!isLoadingCatalogo && !isError && (
        <>
          {itensFiltrados.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 8, textAlign: 'center',
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
              }}
            >
              <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum produto encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tente ajustar os filtros ou buscar por outro termo.
              </Typography>
            </Paper>
          ) : viewMode === 'table' ? (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                height: '75vh', // Altura fixa (resolve overflow)
                width: '100%',
              }}
            >
              <DataGrid
                rows={dadosTabela}
                columns={colunas}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                sx={{
                  border: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: 'background.default',
                    borderRadius: 0,
                  },
                }}
              />
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {itensFiltrados.map((item) => (
                <CardProdutoCatalogo key={item.id_item_catalogo} item={item} />
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};