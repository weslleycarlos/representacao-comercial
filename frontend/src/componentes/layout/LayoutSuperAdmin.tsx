// /frontend/src/componentes/layout/LayoutSuperAdmin.tsx
// Versão ajustada - UX e Layout melhorados

import React from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminPanelIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon,
  ArticleOutlined as LogsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contextos/AuthContext';

const DRAWER_WIDTH = 260;

export const LayoutSuperAdmin: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Organizações', icon: <BusinessIcon />, path: '/admin/organizacoes' },
    { text: 'Logs do Sistema', icon: <LogsIcon />, path: '/admin/logs' },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header com Logo/Título */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'error.main',
            width: 40,
            height: 40,
          }}
        >
          <AdminPanelIcon />
        </Avatar>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Super Admin
        </Typography>
      </Box>
      
      <Divider />

      {/* Perfil do Admin */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'error.main',
            width: 44,
            height: 44,
            fontSize: '1.25rem',
            fontWeight: 600
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
            {usuario?.no_completo || 'Administrador'}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            noWrap
          >
            Administrador do Sistema
          </Typography>
        </Box>
      </Box>
      
      <Divider />

      {/* Menu Principal */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            location.pathname.startsWith(item.path + '/');
            
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <ListItemButton 
                  component={RouterLink}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'error.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isActive ? 'inherit' : 'text.secondary',
                      minWidth: 40 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9375rem',
                      fontWeight: isActive ? 600 : 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      
      <Divider />
      
      {/* Menu Inferior - Logout */}
      <List disablePadding sx={{ py: 1 }}>
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
              }
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
            Painel de Controle
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Espaço para ações do header */}
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
    </Box>
  );
};