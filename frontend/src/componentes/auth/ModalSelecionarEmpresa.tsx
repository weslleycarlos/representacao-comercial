// /frontend/src/componentes/auth/ModalSelecionarEmpresa.tsx
import React from 'react';
import { useAuth } from '../../contextos/AuthContext';
import { useSelectCompany } from '../../api/servicos/authService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Typography,
  Box,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

interface ModalSelecionarEmpresaProps {
  open: boolean;
  onClose: () => void;
}

export const ModalSelecionarEmpresa: React.FC<ModalSelecionarEmpresaProps> = ({
  open,
  onClose,
}) => {
  const { empresasVinculadas, selecionarEmpresa: authSelectEmpresa } = useAuth();
  const { mutate: executarSelecao, isPending, error } = useSelectCompany();

  const handleSelect = (idEmpresa: number) => {
    executarSelecao(idEmpresa, {
      onSuccess: (data) => {
        authSelectEmpresa(data.empresa_ativa, data.token.access_token);
        onClose();
      },
    });
  };

  const apiErrorMessage = (error as any)?.response?.data?.detail;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 500,
        }}
      >
        Trocar Empresa
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Selecione a empresa que deseja gerenciar.
        </Typography>

        {apiErrorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {apiErrorMessage}
          </Alert>
        )}

        <Grid container spacing={2}>
          {empresasVinculadas.map((empresa) => (
            <Grid size={{ xs: 12, sm: 6 }} key={empresa.id_empresa}>
              <Button
                fullWidth
                variant="outlined"
                disabled={isPending}
                onClick={() => handleSelect(empresa.id_empresa)}
                sx={{
                  p: 2.5,
                  minHeight: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  borderRadius: 2,
                  borderColor: 'divider',
                  textTransform: 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: 1,
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                <BusinessIcon color="primary" />
                <Typography
                  variant="body2"
                  fontWeight={500}
                  textAlign="center"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {empresa.no_empresa}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>

        {isPending && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 3,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};