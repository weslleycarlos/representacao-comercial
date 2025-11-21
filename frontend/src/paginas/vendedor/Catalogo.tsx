// /frontend/src/paginas/vendedor/Catalogo.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
import { useAuth } from '../../contextos/AuthContext';
import {
  useGetCatalogoVenda,
  useGetCategoriasVenda,
  useGetCatalogosDisponiveis,
} from '../../api/servicos/vendedorService';
import { formatCurrency } from '../../utils/format';
import type { IItemCatalogoVenda, IProdutoSimples } from '../../tipos/schemas';

// --- Componente Card do Produto ---
const CardProdutoCatalogo: React.FC<{ item: IItemCatalogoVenda }> = ({ item }) => {
  const produto = item.produto as IProdutoSimples;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      {/* Imagem */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          bgcolor: 'action.hover',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
          }}
        >
          <Typography variant="caption">Sem imagem</Typography>
        </Box>
        <Chip
          label={produto.cd_produto}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'background.paper',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      </Box>

      {/* Conteúdo */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          title={produto.ds_produto}
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            lineHeight: 1.4,
            minHeight: '2.8em',
            mb: 0.5,
            wordBreak: 'break-word',
          }}
        >
          {produto.ds_produto}
        </Typography>

        {produto.variacoes && produto.variacoes.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            {produto.variacoes.length} {produto.variacoes.length === 1 ? 'variação' : 'variações'}
          </Typography>
        )}

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {formatCurrency(item.vl_preco_catalogo)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {produto.sg_unidade_medida || 'UN'}
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          size="small"
          startIcon={<AddCartIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Adicionar
        </Button>
      </Box>
    </Paper>
  );
};

// --- Componente da Página Principal ---
export const PaginaVendedorCatalogo: React.FC = () => {
  const { empresaAtiva } = useAuth();
  const [idCatalogoSelecionado, setIdCatalogoSelecionado] = useState<number | undefined>(undefined);
  const [idCategoriaFiltro, setIdCategoriaFiltro] = useState<number | undefined>(undefined);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Buscar Catálogos Disponíveis
  const { data: listaCatalogos, isLoading: isLoadingCatalogos } = useGetCatalogosDisponiveis(
    empresaAtiva?.id_empresa
  );

  // Auto-selecionar o primeiro catálogo
  useEffect(() => {
    if (listaCatalogos && listaCatalogos.length > 0 && !idCatalogoSelecionado) {
      setIdCatalogoSelecionado(listaCatalogos[0].id_catalogo);
    }
  }, [listaCatalogos, idCatalogoSelecionado]);

  // Buscar Itens do Catálogo
  const {
    data: itensCatalogo,
    isLoading: isLoadingCatalogo,
    isError,
    error,
  } = useGetCatalogoVenda(empresaAtiva?.id_empresa, idCatalogoSelecionado, idCategoriaFiltro);

  // Buscar Categorias
  const { data: categorias, isLoading: isLoadingCategorias } = useGetCategoriasVenda(
    empresaAtiva?.id_empresa
  );

  // Filtro de busca
  const itensFiltrados = useMemo(() => {
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
      field: 'cd_produto',
      headerName: 'Código',
      width: 120,
      valueGetter: (_value: unknown, row: IItemCatalogoVenda) => row.produto.cd_produto,
    },
    {
      field: 'ds_produto',
      headerName: 'Produto',
      flex: 2,
      valueGetter: (_value: unknown, row: IItemCatalogoVenda) => row.produto.ds_produto,
    },
    {
      field: 'sg_unidade_medida',
      headerName: 'Unidade',
      width: 100,
      valueGetter: (_value: unknown, row: IItemCatalogoVenda) =>
        row.produto.sg_unidade_medida || 'UN',
    },
    {
      field: 'vl_preco_catalogo',
      headerName: 'Preço',
      width: 120,
      valueFormatter: (value: number) => formatCurrency(value),
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 140,
      sortable: false,
      renderCell: () => (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddCartIcon />}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Adicionar
        </Button>
      ),
    },
  ];

  // Dados para a tabela
  const dadosTabela = useMemo(() => {
    return itensFiltrados.map((item) => ({
      ...item,
      id: item.id_item_catalogo,
    }));
  }, [itensFiltrados]);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'cards' | 'table' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const isLoading = isLoadingCatalogo || isLoadingCatalogos;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Catálogo de Produtos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {itensFiltrados.length} {itensFiltrados.length === 1 ? 'produto' : 'produtos'} encontrados
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Seletor de Tabela de Preços */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Tabela de Preços"
              value={idCatalogoSelecionado || ''}
              onChange={(e) => setIdCatalogoSelecionado(Number(e.target.value) || undefined)}
              disabled={isLoadingCatalogos}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            >
              {(listaCatalogos || []).map((cat) => (
                <MenuItem key={cat.id_catalogo} value={cat.id_catalogo}>
                  {cat.no_catalogo}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Seletor de Categoria */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              label="Categoria"
              value={idCategoriaFiltro || ''}
              onChange={(e) => setIdCategoriaFiltro(Number(e.target.value) || undefined)}
              disabled={isLoadingCategorias}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">
                <em>Todas</em>
              </MenuItem>
              {(categorias || []).map((cat) => (
                <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.no_categoria}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Campo de Busca */}
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              placeholder="Buscar por código ou nome..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* Toggle View */}
          <Grid size={{ xs: 12, md: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: 2,
                  py: 1,
                },
              }}
            >
              <ToggleButton value="cards" aria-label="visualização em cards">
                <CardViewIcon />
              </ToggleButton>
              <ToggleButton value="table" aria-label="visualização em tabela">
                <TableViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Conteúdo */}
      {!idCatalogoSelecionado && !isLoading ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Nenhuma tabela de preços disponível. Contate seu gestor.
        </Alert>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Erro ao carregar o catálogo: {(error as Error)?.message}
        </Alert>
      ) : itensFiltrados.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <SearchIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
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
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            height: 'calc(100vh - 320px)',
            minHeight: 400,
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
                bgcolor: 'background.default',
              },
            }}
          />
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {itensFiltrados.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id_item_catalogo}>
              <CardProdutoCatalogo item={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};