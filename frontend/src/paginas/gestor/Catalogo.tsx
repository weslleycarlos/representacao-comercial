// /frontend/src/paginas/gestor/Catalogo.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Alert,
  Tabs, Tab, TextField, MenuItem, CircularProgress
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

import { useGetEmpresas } from '../../api/servicos/empresaService';
import { AbaProdutos } from './abas/AbaProdutos';
import { AbaCatalogos } from './abas/AbaCatalogos';

// Componente TabPanel
const TabPanel = (props: { children?: React.ReactNode; index: number; value: number }) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`catalogo-tabpanel-${index}`}
      aria-labelledby={`catalogo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const PaginaCatalogo: React.FC = () => {
  const { data: empresas, isLoading: isLoadingEmpresas } = useGetEmpresas();

  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState<number | null>(null);
  const [abaAtual, setAbaAtual] = useState(0);

  const handleMudancaAba = (event: React.SyntheticEvent, newValue: number) => {
    setAbaAtual(newValue);
  };

  const empresaSelecionada = empresas?.find(emp => emp.id_empresa === empresaSelecionadaId);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        {empresaSelecionada && (
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Catálogo
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Gerencie produtos e listas de preço de {empresaSelecionada.no_empresa}
          </Typography>
        </Box>)}
        
        {/* Seletor de Empresa */}
        <TextField
          select
          label="Empresa"
          value={empresaSelecionadaId || ''}
          onChange={(e) => {
            setEmpresaSelecionadaId(Number(e.target.value));
            setAbaAtual(0); // Reset para primeira aba
          }}
          disabled={isLoadingEmpresas}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: isLoadingEmpresas ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : (
              <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
            ),
          }}
        >
          <MenuItem value="" disabled>
            <em>Selecione uma empresa...</em>
          </MenuItem>
          {(empresas || [])
            .filter(emp => emp.fl_ativa) // Apenas empresas ativas
            .map((emp) => (
              <MenuItem key={emp.id_empresa} value={emp.id_empresa}>
                {emp.no_empresa}
              </MenuItem>
            ))}
        </TextField>
      </Box>

      {/* Conteúdo */}
      {!empresaSelecionadaId ? (
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
          <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma empresa selecionada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione uma empresa acima para gerenciar seus produtos e listas de preço
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >


          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={abaAtual} 
              onChange={handleMudancaAba} 
              aria-label="Abas de Gestão de Catálogo"
              sx={{ px: 2 }}
            >
              <Tab 
                label="Produtos" 
                id="catalogo-tab-0"
                sx={{ fontWeight: 500 }}
              />
              <Tab 
                label="Listas de Preço" 
                id="catalogo-tab-1"
                sx={{ fontWeight: 500 }}
              />
            </Tabs>
          </Box>
          
          {/* Painéis das Abas */}
          <TabPanel value={abaAtual} index={0}>
            <AbaProdutos idEmpresa={empresaSelecionadaId} />
          </TabPanel>
          
          <TabPanel value={abaAtual} index={1}>
            <AbaCatalogos idEmpresa={empresaSelecionadaId} />
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
};