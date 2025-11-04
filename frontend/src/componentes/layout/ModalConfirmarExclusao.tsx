// /frontend/src/componentes/layout/ModalConfirmarExclusao.tsx
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';

// Define as propriedades (props) que o modal aceitará
interface ModalConfirmarExclusaoProps {
  open: boolean;
  onClose: () => void;  // Função para fechar (botão "Cancelar")
  onConfirm: () => void; // Função para confirmar (botão "Confirmar")
  titulo: string;        // Ex: "Confirmar Desativação"
  mensagem: string;      // Ex: "Tem certeza que deseja desativar esta empresa?"
  isLoading?: boolean;    // Para mostrar o loading no botão de confirmar
}

export const ModalConfirmarExclusao: React.FC<ModalConfirmarExclusaoProps> = ({
  open,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  isLoading = false // Valor padrão
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {titulo}
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {mensagem}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {/* Botão Cancelar */}
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Cancelar
        </Button>
        
        {/* Botão Confirmar (Ação Destrutiva - cor 'error') */}
        <Button 
          onClick={onConfirm} 
          color="error" // Vermelho para indicar perigo/exclusão
          variant="contained" 
          disabled={isLoading}
          // Mostra o ícone de loading se estiver em progresso
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Excluindo...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};