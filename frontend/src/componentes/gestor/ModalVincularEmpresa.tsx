// /frontend/src/componentes/gestor/ModalVincularEmpresa.tsx
// Versão ajustada - UX e Layout melhorados

import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Checkbox, 
  CircularProgress, Typography, Alert, Box, Divider
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

import type { IVendedor } from '../../tipos/schemas';
import { useGetEmpresas } from '../../api/servicos/empresaService';
import { useVincularEmpresa, useDesvincularEmpresa } from '../../api/servicos/vendedorService';

interface ModalVincularEmpresaProps {
  open: boolean;
  onClose: () => void;
  vendedor: IVendedor;
}

export const ModalVincularEmpresa: React.FC<ModalVincularEmpresaProps> = ({ open, onClose, vendedor }) => {
  
  const { 
    data: todasEmpresas, 
    isLoading: isLoadingEmpresas, 
    isError: isErrorEmpresas,
    error: errorEmpresas
  } = useGetEmpresas();
  
  const { mutate: vincular, isPending: isVinculando } = useVincularEmpresa();
  const { mutate: desvincular, isPending: isDesvinculando } = useDesvincularEmpresa();

  const isSaving = isVinculando || isDesvinculando;

  const empresasVinculadasIds = useMemo(() => {
    return new Set(vendedor.empresas_vinculadas.map(emp => emp.id_empresa));
  }, [vendedor.empresas_vinculadas]);

  const handleToggle = (id_empresa: number) => {
    const payload = {
      id_usuario: vendedor.id_usuario,
      id_empresa: id_empresa,
    };

    if (empresasVinculadasIds.has(id_empresa)) {
      desvincular(payload);
    } else {
      vincular(payload);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Vincular Empresas
      </DialogTitle>
      
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Selecione as empresas que <strong>{vendedor.no_completo}</strong> pode representar.
        </Typography>
      </Box>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        {/* Estado de Loading */}
        {isLoadingEmpresas && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Estado de Erro */}
        {isErrorEmpresas && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Erro ao carregar empresas: {(errorEmpresas as any).message}
            </Alert>
          </Box>
        )}

        {/* Lista de Empresas */}
        {todasEmpresas && todasEmpresas.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma empresa cadastrada
            </Typography>
          </Box>
        )}

        {todasEmpresas && todasEmpresas.length > 0 && (
          <List sx={{ width: '100%' }} disablePadding>
            {todasEmpresas.map((empresa) => {
              const labelId = `checkbox-list-label-${empresa.id_empresa}`;
              const isChecked = empresasVinculadasIds.has(empresa.id_empresa);
              const isDisabled = isSaving || !empresa.fl_ativa;

              return (
                <ListItem
                  key={empresa.id_empresa}
                  disablePadding
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      onChange={() => handleToggle(empresa.id_empresa)}
                      checked={isChecked}
                      inputProps={{ 'aria-labelledby': labelId }}
                      disabled={isDisabled}
                    />
                  }
                >
                  <ListItemButton 
                    onClick={() => !isDisabled && handleToggle(empresa.id_empresa)}
                    disabled={isDisabled}
                  >
                    <ListItemIcon>
                      <BusinessIcon color={empresa.fl_ativa ? 'primary' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      id={labelId} 
                      primary={empresa.no_empresa}
                      secondary={!empresa.fl_ativa ? 'Empresa inativa' : null}
                      primaryTypographyProps={{
                        color: empresa.fl_ativa ? 'text.primary' : 'text.disabled'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          size="large"
          fullWidth
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};