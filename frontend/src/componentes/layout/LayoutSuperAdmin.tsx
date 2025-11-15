// /frontend/src/componentes/layout/LayoutSuperAdmin.tsx
// (VERSÃO REVISADA com menu colapsável e correção de borda)

import React, { useState } from 'react'; // <-- MUDANÇA (1): Importa useState
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Avatar,
  IconButton, // <-- MUDANÇA (2): Importa IconButton
  Tooltip,    // <-- MUDANÇA (3): Importa Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminPanelIcon,
  Business as BusinessIcon,
  Logout as LogoutIcon,
  ArticleOutlined as LogsIcon,
  Menu as MenuIcon, // <-- MUDANÇA (4): Importa MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../../contextos/AuthContext';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 80; // <-- MUDANÇA (5): Define largura mini

export const LayoutSuperAdmin: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- MUDANÇA (6): Adiciona estado para o menu ---
  const [open, setOpen] = useState(true); // Começa aberto
  
  const handleDrawerToggle = () => {
    setOpen(!open); // Inverte o estado
  };
  // --- FIM DA MUDANÇA ---

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Organizações', icon: <BusinessIcon />, path: '/admin/organizacoes' },
    { text: 'Logs do Sistema', icon: <LogsIcon />, path: '/admin/logs' },
  ];
  
  // --- MUDANÇA (7): Calcula a largura atual ---
  const currentDrawerWidth = open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header com Logo/Título */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'error.main', // Cor vermelha de Admin
            width: 40, height: 40,
            transition: 'all 0.2s',
          }}
        >
          <AdminPanelIcon />
        </Avatar>
        
        {/* --- MUDANÇA (8): Anima o texto do título --- */}
        <Typography 
          variant="h6" 
          fontWeight={700} 
          color="text.primary"
          sx={{
            opacity: open ? 1 : 0,
            transition: (theme) => theme.transitions.create('opacity', {
              duration: theme.transitions.duration.shortest,
            }),
            whiteSpace: 'nowrap',
          }}
        >
          Super Admin
        </Typography>
      </Box>
      
      <Divider />

      {/* Perfil do Admin (Opcional, pode ser combinado com o acima) */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'error.main',
            width: 44, height: 44,
            fontSize: '1.25rem', fontWeight: 600
          }}
        >
          {usuario?.no_completo ? usuario.no_completo[0].toUpperCase() : usuario?.ds_email[0].toUpperCase()}
        </Avatar>
        {/* --- MUDANÇA (9): Anima o texto do perfil --- */}
        <Box sx={{ 
          flex: 1, 
          minWidth: 0,
          opacity: open ? 1 : 0,
          transition: (theme) => theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shortest,
          }),
        }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
            {usuario?.no_completo || 'Administrador'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Administrador do Sistema
          </Typography>
        </Box>
      </Box>
      
      <Divider />

      {/* --- MUDANÇA (10): Anima o Menu Principal --- */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
            
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <Tooltip title={item.text} placement="right" disableHoverListener={open}>
                  <ListItemButton 
                    component={RouterLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      justifyContent: 'center', // Centraliza ícone
                      '&.Mui-selected': {
                        bgcolor: 'error.main', // Cor vermelha de Admin
                        color: 'error.contrastText',
                        '&:hover': { bgcolor: 'error.dark' },
                        '& .MuiListItemIcon-root': { color: 'error.contrastText' },
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive ? 'inherit' : 'text.secondary',
                        minWidth: 0,
                        mr: open ? 2 : 'auto', // Margem automática
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}
                      primaryTypographyProps={{
                        fontSize: '0.9375rem',
                        fontWeight: isActive ? 600 : 500,
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>
      
      <Divider />
      
      {/* --- MUDANÇA (11): Anima o Menu Inferior --- */}
      <List disablePadding sx={{ py: 1 }}>
        <ListItem disablePadding sx={{ px: 1.5 }}>
          <Tooltip title="Sair" placement="right" disableHoverListener={open}>
            <ListItemButton 
              onClick={handleLogout}
              sx={{ 
                borderRadius: 1.5,
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: 'error.dark',
                  color: 'error.contrastText',
                  '& .MuiListItemIcon-root': { color: 'error.contrastText' },
                }
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Sair"
                sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}
                primaryTypographyProps={{ fontSize: '0.9375rem', noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* --- MUDANÇA (12): AppBar Animada e Corrigida --- */}
      <AppBar
        position="fixed"
        elevation={0} // Mantém flat
        sx={{
          // Anima a largura e a margem
          width: `calc(100% - ${currentDrawerWidth}px)`,
          ml: `${currentDrawerWidth}px`,
          backgroundColor: 'background.paper',
          
          // Remove a borda de baixo (Correção do "TOC")
          // borderBottom: '1px solid', (Removido)
          // borderColor: 'divider', (Removido)
          
          // Animação
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* --- MUDANÇA (13): Botão de Toggle --- */}
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ 
                mr: 2, 
                color: 'text.primary',
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" color="text.primary" fontWeight={600}>
              Painel de Controle
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Espaço para ações */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- MUDANÇA (14): Sidebar Animada --- */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth, // Largura animada
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth, // Largura animada
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden', // Esconde texto ao fechar
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      {/* Conteúdo Principal (sem alteração) */}
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