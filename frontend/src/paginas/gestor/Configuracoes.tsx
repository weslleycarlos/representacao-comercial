import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { AbaFormasPagamento } from './abas/AbaFormasPagamento';
import { AbaRegrasComissao } from './abas/AbaRegrasComissao';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const PaginaConfiguracoes: React.FC = () => {
  const [abaAtual, setAbaAtual] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setAbaAtual(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Configurações
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 0,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={abaAtual}
            onChange={handleChange}
            aria-label="Abas de Configuração"
            sx={{ px: 2 }}
          >
            <Tab label="Formas de Pagamento" />
            <Tab label="Regras de Comissão" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={abaAtual} index={0}>
            <AbaFormasPagamento />
          </TabPanel>

          <TabPanel value={abaAtual} index={1}>
            <AbaRegrasComissao />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};