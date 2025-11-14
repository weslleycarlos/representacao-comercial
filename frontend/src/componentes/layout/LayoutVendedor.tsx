// /frontend/src/componentes/layout/LayoutVendedor.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Drawer,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Group as GroupIcon,
  Category as CatalogoIcon,
  Logout as LogoutIcon,
  SwapHoriz as TrocarEmpresaIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contextos/AuthContext';
import { PaginaSelecionarEmpresa } from '../../paginas/vendedor/PaginaSelecionarEmpresa';
import { ModalSelecionarEmpresa } from '../auth/ModalSelecionarEmpresa';

const DRAWER_WIDTH = 260;

export const LayoutVendedor: React.FC = () => {
  const { usuario, logout, empresaAtiva } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Adicionado

  // --- ADICIONE ESTE STATE ---
  const [modalTrocarEmpresaAberto, setModalTrocarEmpresaAberto] = useState(false);

  if (!empresaAtiva) {
    return <PaginaSelecionarEmpresa />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTrocarEmpresa = () => {
    // Em vez de deslogar, abre o modal
    setModalTrocarEmpresaAberto(true);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/vendedor/dashboard' },
    { text: 'Catálogo', icon: <CatalogoIcon />, path: '/vendedor/catalogo' },
    { text: 'Pedidos', icon: <ShoppingCartIcon />, path: '/vendedor/pedidos' },
    { text: 'Clientes', icon: <GroupIcon />, path: '/vendedor/clientes' },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Perfil do Usuário */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 44,
            height: 44,
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          {usuario?.no_completo ? usuario.no_completo[0].toUpperCase() : usuario?.ds_email[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
            sx={{ lineHeight: 1.3 }}
          >
            {usuario?.no_completo || 'Vendedor'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {empresaAtiva.no_empresa}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu Principal */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'inherit' : 'text.secondary',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9375rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Menu Inferior */}
      <List disablePadding sx={{ py: 1 }}>
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <ListItemButton
            onClick={handleTrocarEmpresa}
            sx={{ borderRadius: 1.5 }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <TrocarEmpresaIcon />
            </ListItemIcon>
            <ListItemText
              primary="Trocar Empresa"
              primaryTypographyProps={{ fontSize: '0.9375rem' }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ px: 1.5 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1.5,
              '&:hover': {
                bgcolor: 'error.dark',
                color: 'error.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'error.contrastText',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Sair"
              primaryTypographyProps={{ fontSize: '0.9375rem' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" color="text.primary" fontWeight={600}>
            Empresa Ativa: {empresaAtiva.no_empresa}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Espaço para ações do header (notificações, etc) */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* --- MODAL DE TROCA DE EMPRESA --- */}
      <ModalSelecionarEmpresa
        open={modalTrocarEmpresaAberto}
        onClose={() => setModalTrocarEmpresaAberto(false)}
      />
    </Box>
  );
};