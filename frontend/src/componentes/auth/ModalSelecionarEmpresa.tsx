// /frontend/src/componentes/auth/ModalSelecionarEmpresa.tsx
import React from 'react';
import { useAuth } from '../../contextos/AuthContext';
import { useSelectCompany } from '../../api/servicos/authService';
import {
  Dialog, DialogTitle, DialogContent, Grid,
  CircularProgress, Alert, Button, Typography
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

interface ModalSelecionarEmpresaProps {
  open: boolean;
  onClose: () => void;
}

export const ModalSelecionarEmpresa: React.FC<ModalSelecionarEmpresaProps> = ({ open, onClose }) => {
  const { empresasVinculadas, selecionarEmpresa: authSelectEmpresa } = useAuth();
  const { mutate: executarSelecao, isPending, error } = useSelectCompany();

  const handleSelect = (idEmpresa: number) => {
    executarSelecao(idEmpresa, {
      onSuccess: (data) => {
        // Atualiza o contexto (o que muda o token e a empresaAtiva)
        authSelectEmpresa(data.empresa_ativa, data.token.access_token);
        onClose(); // Fecha o modal
      }
    });
  };

  const apiErrorMessage = (error as any)?.response?.data?.detail;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Trocar Empresa</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione a empresa que deseja gerenciar.
        </Typography>

        {apiErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>{apiErrorMessage}</Alert>
        )}

        <Grid container spacing={2}>
          {empresasVinculadas.map((empresa) => (
            <Grid xs={12} sm={6} key={empresa.id_empresa}>
              <Button
                fullWidth
                variant="outlined"
                disabled={isPending}
                onClick={() => handleSelect(empresa.id_empresa)}
                sx={{ p: 2, height: '100px', flexDirection: 'column' }}
              >
                <BusinessIcon sx={{ mb: 1 }} />
                {empresa.no_empresa}
              </Button>
            </Grid>
          ))}
        </Grid>
        
        {isPending && <CircularProgress sx={{ mt: 2 }} />}
      </DialogContent>
    </Dialog>
  );
};