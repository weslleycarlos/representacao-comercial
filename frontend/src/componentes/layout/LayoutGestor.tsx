// /frontend/src/componentes/layout/LayoutGestor.tsx
// Versão ajustada - UX e Layout melhorados

import React from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contextos/AuthContext';

const DRAWER_WIDTH = 260;

export const LayoutGestor: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/gestor/dashboard' },
    { text: 'Empresas', icon: <BusinessIcon />, path: '/gestor/empresas' },
    { text: 'Vendedores', icon: <GroupIcon />, path: '/gestor/vendedores' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/gestor/clientes' },
    { text: 'Catálogo', icon: <CategoryIcon />, path: '/gestor/catalogo' },
    { text: 'Pedidos', icon: <ShoppingCartIcon />, path: '/gestor/pedidos' },
    { text: 'Relatórios', icon: <BarChartIcon />, path: '/gestor/relatorios' },
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
            {usuario?.no_completo || 'Gestor'}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            noWrap
          >
            {usuario?.tp_usuario === 'gestor' ? 'Gestor' : 'Usuário'}
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
      
      {/* Menu Inferior */}
      <List disablePadding sx={{ py: 1 }}>
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <ListItemButton 
            component={RouterLink} 
            to="/gestor/configuracoes"
            selected={location.pathname === '/gestor/configuracoes'}
            sx={{ borderRadius: 1.5 }}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Configurações"
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
            {/* Título dinâmico da página pode vir aqui */}
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
    </Box>
  );
};