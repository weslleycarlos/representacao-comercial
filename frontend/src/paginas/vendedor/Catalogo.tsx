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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { useGetCatalogoVenda, useGetCategoriasVenda } from '../../api/servicos/vendedorService';
import { formatCurrency } from '../../utils/format';
import type { IItemCatalogoVenda } from '../../tipos/schemas';

// --- Componente Card do Produto ---
const CardProdutoCatalogo: React.FC<{ item: IItemCatalogoVenda }> = ({ item }) => {
  const produto = item.produto; // O produto aninhado

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
        }}
      >
        {/* (Imagem do Produto - Futuro) */}
        <Box
          sx={{
            height: 180,
            bgcolor: 'grey.100', // Placeholder mais claro
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption">Imagem do Produto</Typography>
        </Box>

        <Box sx={{ p: 2, flexGrow: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 1,
            }}
          >
            {produto.cd_produto}
          </Typography>

          <Typography
            variant="h6"
            component="h3"
            fontWeight="bold"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              minHeight: '2.5em',
              mb: 1,
            }}
          >
            {produto.ds_produto}
          </Typography>

          {/* Mostrar Variações (se houver) */}
          {produto.variacoes && produto.variacoes.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {produto.variacoes.map((v) => (
                <Chip
                  key={v.id_variacao}
                  label={v.ds_tamanho || v.ds_cor}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {formatCurrency(item.vl_preco_catalogo)}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 1 }}
            // onClick={() => adicionarAoCarrinho(item)} // (Próxima etapa: Pedidos)
          >
            Adicionar ao Pedido
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

  // 1. Hooks de Busca (TanStack Query)
  const {
     itensCatalogo,
    isLoading: isLoadingCatalogo,
    isError,
    error,
  } = useGetCatalogoVenda(idCategoriaFiltro);

  const {
     categorias,
    isLoading: isLoadingCategorias,
  } = useGetCategoriasVenda();

  // 2. Lógica de Filtro (Frontend)
  // (Filtra os resultados baseado no texto de busca)
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

  return (
    <Box>
      {/* --- Cabeçalho e Filtros --- */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Catálogo de Produtos
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <TextField
            select
            label="Filtrar Categoria"
            value={idCategoriaFiltro || ''}
            onChange={(e) => setIdCategoriaFiltro(Number(e.target.value) || undefined)}
            disabled={isLoadingCategorias}
            size="small"
            sx={{ minWidth: 200 }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          >
            <MenuItem value="">Todas as Categorias</MenuItem>
            {(categorias || []).map((cat) => (
              <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                {cat.no_categoria}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Buscar por Código ou Nome"
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </Box>
      </Box>

      {/* --- Grid de Produtos --- */}
      {isLoadingCatalogo && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar o catálogo: {(error as any).message}
        </Alert>
      )}

      {!isLoadingCatalogo && !isError && (
        <Grid container spacing={3}>
          {itensFiltrados.length === 0 ? (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum produto encontrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar os filtros ou buscar por outro termo.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            itensFiltrados.map((item) => (
              <CardProdutoCatalogo key={item.id_item_catalogo} item={item} />
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};