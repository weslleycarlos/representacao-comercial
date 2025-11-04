// /frontend/src/componentes/gestor/ModalVincularEmpresa.tsx
import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemIcon, ListItemText, Checkbox, 
  CircularProgress, Typography, Alert, Box
} from '@mui/material';

import type { VendedorSchema } from '../../tipos/schemas';
import { useGetEmpresas } from '../../api/servicos/empresaService';
import { useVincularEmpresa, useDesvincularEmpresa } from '../../api/servicos/vendedorService';

interface ModalVincularEmpresaProps {
  open: boolean;
  onClose: () => void;
  vendedor: VendedorSchema; // O vendedor que estamos editando
}

export const ModalVincularEmpresa: React.FC<ModalVincularEmpresaProps> = ({ open, onClose, vendedor }) => {
  
  // 1. Buscar TODAS as empresas da organização
  const { 
    data: todasEmpresas, 
    isLoading: isLoadingEmpresas, 
    isError: isErrorEmpresas,
    error: errorEmpresas
  } = useGetEmpresas();
  
  // 2. Hooks de Mutação para Vínculo
  const { mutate: vincular, isPending: isVinculando } = useVincularEmpresa();
  const { mutate: desvincular, isPending: isDesvinculando } = useDesvincularEmpresa();

  const isSaving = isVinculando || isDesvinculando;

  // 3. Otimização: Criar um Set() com os IDs das empresas que o vendedor JÁ representa
  //    Isso nos ajuda a marcar os checkboxes corretos rapidamente.
  const empresasVinculadasIds = useMemo(() => {
    return new Set(vendedor.empresas_vinculadas.map(emp => emp.id_empresa));
  }, [vendedor.empresas_vinculadas]);

  // 4. Função chamada ao clicar em um checkbox
  const handleToggle = (id_empresa: number) => {
    const payload = {
      id_usuario: vendedor.id_usuario,
      id_empresa: id_empresa,
    };

    if (empresasVinculadasIds.has(id_empresa)) {
      // Já está vinculado -> Desvincular
      desvincular(payload);
    } else {
      // Não está vinculado -> Vincular
      vincular(payload);
    }
    // O onSuccess das mutações (em vendedorService.ts) irá
    // invalidar o cache e a UI (tabela e modal) será atualizada.
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Vincular Empresas
        <Typography variant="body2" color="text.secondary">
          Selecione as empresas que <strong>{vendedor.no_completo}</strong> pode representar.
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Estado de Loading */}
        {isLoadingEmpresas && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Estado de Erro */}
        {isErrorEmpresas && (
           <Alert severity="error" sx={{ mb: 2 }}>
             Erro ao carregar empresas: {(errorEmpresas as any).message}
           </Alert>
        )}

        {/* Lista de Empresas */}
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {todasEmpresas && todasEmpresas.map((empresa) => {
            const labelId = `checkbox-list-label-${empresa.id_empresa}`;
            const isChecked = empresasVinculadasIds.has(empresa.id_empresa);

            return (
              <ListItem
                key={empresa.id_empresa}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    onChange={() => handleToggle(empresa.id_empresa)}
                    checked={isChecked}
                    inputProps={{ 'aria-labelledby': labelId }}
                    disabled={isSaving || !empresa.fl_ativa} // Desabilita se estiver salvando ou empresa inativa
                  />
                }
                disablePadding
              >
                <ListItemText 
                  id={labelId} 
                  primary={empresa.no_empresa} 
                  secondary={!empresa.fl_ativa ? 'Inativa' : null}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};