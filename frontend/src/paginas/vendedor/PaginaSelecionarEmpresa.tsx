// /frontend/src/paginas/vendedor/SelecionarEmpresa.tsx
import React from 'react';
import { useAuth } from '../../contextos/AuthContext';
import { useSelectCompany } from '../../api/servicos/authService';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

export const PaginaSelecionarEmpresa: React.FC = () => {
  const { usuario, empresasVinculadas, selecionarEmpresa: authSelectEmpresa } = useAuth();
  const { mutate: executarSelecao, isPending, error } = useSelectCompany();

  const handleSelect = (idEmpresa: number) => {
    executarSelecao(idEmpresa, {
      onSuccess: (data) => {
        authSelectEmpresa(data.empresa_ativa, data.token.access_token);
      },
    });
  };

  const apiErrorMessage = (error as any)?.response?.data?.detail;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          maxWidth: 560,
          width: '100%',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          fontWeight={600}
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          Olá, {usuario?.no_completo || usuario?.ds_email}!
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Selecione a empresa que você deseja gerenciar nesta sessão.
        </Typography>

        {apiErrorMessage && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {apiErrorMessage}
          </Alert>
        )}

        <Grid container spacing={2}>
          {empresasVinculadas.length === 0 ? (
            <Grid size={12}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Você não está vinculado a nenhuma empresa. Por favor, contate seu Gestor.
              </Alert>
            </Grid>
          ) : (
            empresasVinculadas.map((empresa) => (
              <Grid size={{ xs: 12, sm: 6 }} key={empresa.id_empresa}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  disabled={isPending}
                  onClick={() => handleSelect(empresa.id_empresa)}
                  sx={{
                    p: 2.5,
                    minHeight: 110,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    textAlign: 'left',
                    textTransform: 'none',
                    borderRadius: 3,
                    borderColor: 'divider',
                    gap: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <BusinessIcon color="primary" fontSize="medium" />
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="text.primary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                    }}
                  >
                    {empresa.no_empresa}
                  </Typography>
                </Button>
              </Grid>
            ))
          )}
        </Grid>

        {isPending && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 4,
            }}
          >
            <CircularProgress size={36} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};