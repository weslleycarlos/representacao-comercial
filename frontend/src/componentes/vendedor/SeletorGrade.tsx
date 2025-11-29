// /frontend/src/componentes/vendedor/SeletorGrade.tsx
import React, { useMemo } from 'react';
import { Box, Typography, Grid, TextField, Paper, Divider } from '@mui/material';
import type { IVariacaoProduto, IProdutoSimples } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';

interface SeletorGradeProps {
  produto: IProdutoSimples;
  precoBase: number;
  quantidades: Record<number, number>;
  onChange: (idVariacao: number, qtd: number) => void;
}

export const SeletorGrade: React.FC<SeletorGradeProps> = ({
  produto,
  precoBase,
  quantidades,
  onChange,
}) => {
  // Agrupa as variações por COR
  const variacoesPorCor = useMemo(() => {
    const grupos: Record<string, IVariacaoProduto[]> = {};

    produto.variacoes.forEach((v) => {
      const cor = v.ds_cor || 'Padrão';
      if (!grupos[cor]) grupos[cor] = [];
      grupos[cor].push(v);
    });

    return grupos;
  }, [produto.variacoes]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Selecione as quantidades por grade:
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        {Object.entries(variacoesPorCor).map(([cor, variacoes], index) => (
          <Box key={cor}>
            {index > 0 && <Divider sx={{ my: 2 }} />}

            {/* Nome da Cor */}
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
              {cor}
            </Typography>

            {/* Grid de Tamanhos - CORREÇÃO AQUI */}
            <Grid container spacing={2}>
              {variacoes.map((variacao) => {
                const precoFinal = precoBase + Number(variacao.vl_ajuste_preco || 0);
                const temAjuste = Number(variacao.vl_ajuste_preco) > 0;
                const qtdAtual = quantidades[variacao.id_variacao] || 0;

                return (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={variacao.id_variacao}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: qtdAtual > 0 ? 'primary.main' : 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: qtdAtual > 0 ? 'primary.dark' : 'primary.light',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {variacao.ds_tamanho || 'Único'}
                        </Typography>
                        {temAjuste && (
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            +{formatCurrency(Number(variacao.vl_ajuste_preco))}
                          </Typography>
                        )}
                      </Box>

                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="0"
                        value={qtdAtual || ''}
                        onChange={(e) => onChange(variacao.id_variacao, Number(e.target.value))}
                        slotProps={{
                          input: {
                            inputProps: { min: 0 },
                            sx: { textAlign: 'center', fontWeight: 600 },
                          },
                        }}
                      />

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        textAlign="center"
                        sx={{ mt: 0.5 }}
                      >
                        {formatCurrency(precoFinal)}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </Paper>
    </Box>
  );
};