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
  const temVariacoes = produto.variacoes && produto.variacoes.length > 0;

  // Calcula range de preços se houver variações
  const precoDisplay = useMemo(() => {
    if (!temVariacoes) return formatCurrency(item.vl_preco_catalogo);

    const precos = produto.variacoes.map(v => Number(item.vl_preco_catalogo) + Number(v.vl_ajuste_preco));
    const min = Math.min(...precos);
    const max = Math.max(...precos);

    if (min === max) return formatCurrency(min);
    return `De ${formatCurrency(min)} a ${formatCurrency(max)}`;
  }, [item.vl_preco_catalogo, produto.variacoes, temVariacoes]);

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
            mb: 1,
            wordBreak: 'break-word',
          }}
        >
          {produto.ds_produto}
        </Typography>

        {/* Chips de Variação */}
        {temVariacoes ? (
          <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Array.from(new Set(produto.variacoes.map(v => v.ds_cor))).slice(0, 3).map(cor => (
              <Chip key={cor} label={cor} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            ))}
            {produto.variacoes.length > 3 && (
              <Chip label={`+${produto.variacoes.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            )}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Produto Simples
          </Typography>
        )}

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: temVariacoes ? '1rem' : '1.25rem' }}>
            {precoDisplay}
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
          {temVariacoes ? 'Selecionar Opções' : 'Adicionar'}
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
            >
              <ToggleButton value="cards">
                <CardViewIcon />
              </ToggleButton>
              <ToggleButton value="table">
                <TableViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Conteúdo */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">
          Erro ao carregar catálogo: {(error as any).message}
        </Alert>
      ) : itensFiltrados.length === 0 ? (
        <Alert severity="info">Nenhum produto encontrado.</Alert>
      ) : viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {itensFiltrados.map((item) => (
            <Grid key={item.id_item_catalogo} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <CardProdutoCatalogo item={item} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={dadosTabela}
            columns={colunas}
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Paper>
      )}
    </Box>
  );
};