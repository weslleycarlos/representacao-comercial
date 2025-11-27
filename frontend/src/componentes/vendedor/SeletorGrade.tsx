// /frontend/src/componentes/vendedor/SeletorGrade.tsx
import React, { useMemo } from 'react';
import { 
  Box, Typography, Grid, TextField, Paper, Chip, Divider 
} from '@mui/material';
import type { IVariacaoProduto, IProdutoSimples } from '../../tipos/schemas';
import { formatCurrency } from '../../utils/format';

interface SeletorGradeProps {
  produto: IProdutoSimples;
  precoBase: number;
  // Recebe um objeto onde a chave é o ID da variação e o valor é a quantidade
  // Ex: { 1: 5, 2: 10 } (5 unidades do ID 1, 10 do ID 2)
  quantidades: Record<number, number>; 
  onChange: (idVariacao: number, qtd: number) => void;
}

export const SeletorGrade: React.FC<SeletorGradeProps> = ({ 
  produto, 
  precoBase, 
  quantidades, 
  onChange 
}) => {
  
  // 1. Agrupa as variações por COR
  const variacoesPorCor = useMemo(() => {
    const grupos: Record<string, IVariacaoProduto[]> = {};
    
    produto.variacoes.forEach(v => {
      // Se não tiver cor definida, usa "Padrão"
      const cor = v.ds_cor || 'Padrão';
      if (!grupos[cor]) grupos[cor] = [];
      grupos[cor].push(v);
    });

    return grupos;
  }, [produto.variacoes]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Selecione as quantidades por grade:
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
        {Object.entries(variacoesPorCor).map(([cor, variacoes], index) => (
          <Box key={cor}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            
            {/* Nome da Cor */}
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                {cor}
              </Typography>
            </Box>

            {/* Grid de Tamanhos */}
            <Grid container spacing={2}>
              {variacoes.map((variacao) => {
                const precoFinal = precoBase + Number(variacao.vl_ajuste_preco || 0);
                const temAjuste = Number(variacao.vl_ajuste_preco) > 0;

                return (
                  <Grid item xs={6} sm={4} md={3} key={variacao.id_variacao}>
                    <Box sx={{ 
                        p: 1.5, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: quantidades[variacao.id_variacao] > 0 ? 'primary.main' : 'divider',
                        position: 'relative'
                    }}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {variacao.ds_tamanho || 'Único'}
                          </Typography>
                          {temAjuste && (
                            <Typography variant="caption" color="error.main" fontWeight="bold">
                              +{formatCurrency(Number(variacao.vl_ajuste_preco))}
                            </Typography>
                          )}
                       </Box>
                       
                       <TextField
                          type="number"
                          size="small"
                          fullWidth
                          placeholder="0"
                          value={quantidades[variacao.id_variacao] || ''}
                          onChange={(e) => onChange(variacao.id_variacao, Number(e.target.value))}
                          InputProps={{ inputProps: { min: 0 } }}
                          sx={{ 
                            '& input': { textAlign: 'center', fontWeight: 'bold' } 
                          }}
                       />
                       
                       <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 0.5 }}>
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