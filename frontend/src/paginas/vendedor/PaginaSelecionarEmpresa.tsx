// /frontend/src/paginas/vendedor/SelecionarEmpresa.tsx
import React from 'react';
import { useAuth } from '../../contextos/AuthContext';
import { useSelectCompany } from '../../api/servicos/authService';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

export const PaginaSelecionarEmpresa: React.FC = () => {
  // 1. Pega os dados do Contexto
  const { usuario, empresasVinculadas, selecionarEmpresa: authSelectEmpresa } = useAuth();
  
  // 2. Hook de Mutação (API)
  const { mutate: executarSelecao, isPending, error } = useSelectCompany();

  const handleSelect = (idEmpresa: number) => {
    executarSelecao(idEmpresa, {
      onSuccess: (data) => {
        // 3. Sucesso: Atualiza o AuthContext com o novo token e a empresa
        authSelectEmpresa(data.empresa_ativa, data.token.access_token);
        // (O App.tsx/LayoutVendedor irá automaticamente redirecionar)
      }
      // (onError é tratado pela variável 'error')
    });
  };

  const apiErrorMessage = (error as any)?.response?.data?.detail;

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      bgcolor="background.default"
      p={3}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Olá, {usuario?.no_completo || usuario?.ds_email}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Por favor, selecione a Empresa (Representada) que você deseja gerenciar nesta sessão.
        </Typography>

        {apiErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
        )}

        <Grid container spacing={2}>
          {empresasVinculadas.length === 0 ? (
            <Grid xs={12}>
              <Alert severity="warning">
                Você não está vinculado a nenhuma empresa. Por favor, contate seu Gestor.
              </Alert>
            </Grid>
          ) : (
            empresasVinculadas.map((empresa) => (
              <Grid xs={12} sm={6} key={empresa.id_empresa}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  disabled={isPending}
                  onClick={() => handleSelect(empresa.id_empresa)}
                  sx={{ 
                    p: 2, 
                    height: '100px', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    textAlign: 'left',
                  }}
                >
                  <BusinessIcon sx={{ mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {empresa.no_empresa}
                  </Typography>
                </Button>
              </Grid>
            ))
          )}
        </Grid>
        
        {isPending && <CircularProgress sx={{ mt: 2 }} />}
      </Paper>
    </Box>
  );
};