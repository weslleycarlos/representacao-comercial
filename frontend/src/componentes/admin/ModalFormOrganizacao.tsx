// /frontend/src/componentes/admin/ModalFormOrganizacao.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Alert,
  MenuItem, Typography, Divider, Box, IconButton,
  InputAdornment, Chip, Paper, Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Description as DescriptionIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { type AdminOrganizacaoFormData, adminOrganizacaoSchema } from '../../tipos/validacao';
import type { IOrganizacao } from '../../tipos/schemas';
import { useCreateOrganizacao, useUpdateOrganizacao } from '../../api/servicos/adminService';
import { MaskedInput } from '../utils/MaskedInput';

interface Props {
  open: boolean;
  onClose: () => void;
  organizacao?: IOrganizacao;
}

// Configurações dos planos
const PLANOS_CONFIG = {
  basico: {
    label: 'Básico',
    color: 'default' as const,
    usuarios: 5,
    empresas: 2,
    descricao: 'Ideal para pequenas equipes'
  },
  premium: {
    label: 'Premium',
    color: 'primary' as const,
    usuarios: 20,
    empresas: 10,
    descricao: 'Recomendado para médias empresas'
  },
  enterprise: {
    label: 'Enterprise',
    color: 'success' as const,
    usuarios: 100,
    empresas: 50,
    descricao: 'Solução corporativa completa'
  }
};

export const ModalFormOrganizacao: React.FC<Props> = ({ open, onClose, organizacao }) => {
  const isEditMode = !!organizacao;

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors }, 
    setValue, 
    watch 
  } = useForm<AdminOrganizacaoFormData>({
    resolver: zodResolver(adminOrganizacaoSchema),
    defaultValues: {
      tp_plano: 'basico',
      st_assinatura: 'ativo',
      qt_limite_usuarios: 5,
      qt_limite_empresas: 2,
    }
  });

  const { mutate: create, isPending: isCreating, error: createError } = useCreateOrganizacao();
  const { mutate: update, isPending: isUpdating, error: updateError } = useUpdateOrganizacao();

  const isSaving = isCreating || isUpdating;
  const mutationError = createError || updateError;

  // Watch para atualizar limites quando o plano muda
  const selectedPlano = watch('tp_plano');

  useEffect(() => {
    if (open) {
      if (isEditMode && organizacao) {
        reset(organizacao);
      } else {
        reset({
          tp_plano: 'basico',
          st_assinatura: 'ativo',
          qt_limite_usuarios: 5,
          qt_limite_empresas: 2,
        });
      }
    }
  }, [open, organizacao, isEditMode, reset]);

  // Atualiza limites ao mudar plano (apenas na criação)
  useEffect(() => {
    if (!isEditMode && selectedPlano && PLANOS_CONFIG[selectedPlano as keyof typeof PLANOS_CONFIG]) {
      const config = PLANOS_CONFIG[selectedPlano as keyof typeof PLANOS_CONFIG];
      setValue('qt_limite_usuarios', config.usuarios);
      setValue('qt_limite_empresas', config.empresas);
    }
  }, [selectedPlano, isEditMode, setValue]);

  const onSubmit = (data: AdminOrganizacaoFormData) => {
    if (isEditMode && organizacao) {
      const { gestor, ...orgData } = data;
      update({ id: organizacao.id_organizacao, data: orgData }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { borderRadius: 2 }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {isEditMode ? 'Editar Organização' : 'Nova Organização'}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="small"
          disabled={isSaving}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          {/* Erro de Mutação */}
          {mutationError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {(mutationError as any)?.message || 'Erro ao processar solicitação'}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* ========== DADOS DA ORGANIZAÇÃO ========== */}
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={600} color="primary">
                    DADOS DA EMPRESA
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField 
                {...register('no_organizacao')} 
                label="Nome da Organização" 
                fullWidth 
                required 
                error={!!errors.no_organizacao} 
                helperText={errors.no_organizacao?.message}
                placeholder="Ex: Minha Empresa Ltda"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <MaskedInput 
                mask="cnpj" 
                label="CNPJ" 
                fullWidth 
                required
                value={watch('nr_cnpj') || ''} 
                onChange={(v) => setValue('nr_cnpj', v)}
                error={!!errors.nr_cnpj}
                helperText={errors.nr_cnpj?.message}
              />
            </Grid>

            {/* Plano e Limites */}
            <Grid item xs={12} sm={4}>
              <TextField 
                select 
                label="Plano" 
                {...register('tp_plano')} 
                fullWidth 
                defaultValue="basico"
                error={!!errors.tp_plano}
                helperText={selectedPlano ? PLANOS_CONFIG[selectedPlano as keyof typeof PLANOS_CONFIG]?.descricao : ''}
              >
                {Object.entries(PLANOS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={config.label} 
                        color={config.color} 
                        size="small" 
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField 
                type="number" 
                label="Limite de Usuários" 
                {...register('qt_limite_usuarios', { valueAsNumber: true })} 
                fullWidth
                error={!!errors.qt_limite_usuarios}
                helperText={errors.qt_limite_usuarios?.message}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField 
                type="number" 
                label="Limite de Empresas" 
                {...register('qt_limite_empresas', { valueAsNumber: true })} 
                fullWidth
                error={!!errors.qt_limite_empresas}
                helperText={errors.qt_limite_empresas?.message}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>

            {/* Status (apenas na edição) */}
            {isEditMode && (
              <Grid item xs={12}>
                <TextField 
                  select 
                  label="Status da Assinatura" 
                  {...register('st_assinatura')} 
                  fullWidth
                  error={!!errors.st_assinatura}
                  helperText={errors.st_assinatura?.message}
                >
                  <MenuItem value="ativo">
                    <Chip label="Ativo" color="success" size="small" />
                  </MenuItem>
                  <MenuItem value="suspenso">
                    <Chip label="Suspenso" color="warning" size="small" />
                  </MenuItem>
                  <MenuItem value="cancelado">
                    <Chip label="Cancelado" color="error" size="small" />
                  </MenuItem>
                </TextField>
              </Grid>
            )}

            {/* ========== DADOS DO GESTOR (APENAS NA CRIAÇÃO) ========== */}
            {!isEditMode && (
              <>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'info.50',
                      border: '1px solid',
                      borderColor: 'info.200'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon fontSize="small" color="info" />
                      <Typography variant="subtitle2" fontWeight={600} color="info.main">
                        PRIMEIRO GESTOR (ACESSO INICIAL)
                      </Typography>
                    </Box>
                    <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
                      Este será o usuário administrador da organização
                    </Alert>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    {...register('gestor.no_completo')} 
                    label="Nome Completo do Gestor" 
                    fullWidth 
                    required 
                    error={!!errors.gestor?.no_completo} 
                    helperText={errors.gestor?.no_completo?.message}
                    placeholder="Ex: João da Silva"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <MaskedInput 
                    mask="telefone" 
                    label="Telefone" 
                    fullWidth 
                    value={watch('gestor.nr_telefone') || ''} 
                    onChange={(v) => setValue('gestor.nr_telefone', v)}
                    error={!!errors.gestor?.nr_telefone}
                    helperText={errors.gestor?.nr_telefone?.message}
                    placeholder="(00) 00000-0000"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    type="email" 
                    {...register('gestor.ds_email')} 
                    label="E-mail (Login)" 
                    fullWidth 
                    required 
                    error={!!errors.gestor?.ds_email} 
                    helperText={errors.gestor?.ds_email?.message}
                    placeholder="gestor@empresa.com.br"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    type="password" 
                    {...register('gestor.password')} 
                    label="Senha Inicial" 
                    fullWidth 
                    required 
                    error={!!errors.gestor?.password} 
                    helperText={errors.gestor?.password?.message || 'Mínimo 6 caracteres'}
                    placeholder="••••••"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 1
        }}>
          <Button 
            onClick={handleClose} 
            disabled={isSaving}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 120
            }}
          >
            {isSaving ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Criar Organização')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};