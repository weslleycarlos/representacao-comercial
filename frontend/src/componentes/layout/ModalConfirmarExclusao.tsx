// /frontend/src/componentes/layout/ModalConfirmarExclusao.tsx
// Versão ajustada - UX e Layout melhorados

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Divider
} from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';

interface ModalConfirmarExclusaoProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  isLoading?: boolean;
}

export const ModalConfirmarExclusao: React.FC<ModalConfirmarExclusaoProps> = ({
  open,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  isLoading = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle 
        id="confirm-dialog-title"
        sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <WarningIcon color="error" />
        {titulo}
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText 
          id="confirm-dialog-description"
          sx={{ color: 'text.primary' }}
        >
          {mensagem}
        </DialogContentText>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={isLoading}
          size="large"
          fullWidth
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={onConfirm} 
          color="error"
          variant="contained" 
          disabled={isLoading}
          size="large"
          fullWidth
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};