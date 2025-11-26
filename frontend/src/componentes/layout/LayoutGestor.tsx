// /frontend/src/componentes/layout/LayoutGestor.tsx
// (VERSÃO REVISADA com menu colapsável e correção de borda)

import React, { useState } from 'react'; // 1. Importa useState
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
  History as HistoryIcon,
  Menu as MenuIcon, // 2. Importa o ícone de Menu
  ChevronLeft as ChevronLeftIcon, // (Opcional) Ícone para fechar
} from '@mui/icons-material';
import { useAuth } from '../../contextos/AuthContext';

// Define as larguras do menu
const DRAWER_WIDTH = 260; // Largura total (como você definiu)
const MINI_DRAWER_WIDTH = 80; // Largura do menu "mini" (só ícones)

export const LayoutGestor: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 3. Adiciona o estado para controlar o menu
  const [open, setOpen] = useState(true); // Começa aberto
  
  const handleDrawerToggle = () => {
    setOpen(!open); // Inverte o estado
  };

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
    { text: 'Logs de Auditoria', icon: <HistoryIcon />, path: '/gestor/logs' },
  ];

  // 4. Calcula a largura atual (para animação)
  const currentDrawerWidth = open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* --- Perfil (adaptado para colapsar) --- */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main',
            width: 44,
            height: 44,
            fontSize: '1.25rem',
            fontWeight: 600,
            transition: 'all 0.2s', // Animação do avatar
          }}
        >
          {usuario?.no_completo ? usuario.no_completo[0].toUpperCase() : usuario?.ds_email[0].toUpperCase()}
        </Avatar>
        
        {/* Oculta o texto quando o menu estiver fechado (open=false) */}
        <Box sx={{ 
          flex: 1, 
          minWidth: 0,
          opacity: open ? 1 : 0, // Animação de fade
          transition: (theme) => theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shortest,
          }),
        }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
            {usuario?.no_completo || 'Gestor'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {usuario?.tp_usuario === 'gestor' ? 'Gestor' : 'Usuário'}
          </Typography>
        </Box>
      </Box>
      
      <Divider />

      {/* --- Menu Principal --- */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
            
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                {/* O Tooltip só aparece quando o menu está fechado */}
                <Tooltip title={item.text} placement="right" disableHoverListener={open}>
                  <ListItemButton 
                    component={RouterLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      borderRadius: 1.5,
                      justifyContent: 'center', // Centraliza ícone quando fechado
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive ? 'inherit' : 'text.secondary',
                        minWidth: 0, // Permite o ícone centralizar
                        mr: open ? 2 : 'auto', // Margem automática quando fechado
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {/* Oculta o texto quando 'open=false' */}
                    <ListItemText 
                      primary={item.text}
                      sx={{ 
                        opacity: open ? 1 : 0, // Animação de fade
                        transition: 'opacity 0.2s',
                      }}
                      primaryTypographyProps={{
                        fontSize: '0.9375rem',
                        fontWeight: isActive ? 600 : 500,
                        noWrap: true, // Impede quebra de linha
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
      
      {/* --- Menu Inferior --- */}
      <List disablePadding sx={{ py: 1 }}>
        {/* (Configurações) */}
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <Tooltip title="Configurações" placement="right" disableHoverListener={open}>
            <ListItemButton 
              component={RouterLink} 
              to="/gestor/configuracoes"
              selected={location.pathname === '/gestor/configuracoes'}
              sx={{ borderRadius: 1.5, justifyContent: 'center' }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Configurações"
                sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}
                primaryTypographyProps={{ fontSize: '0.9375rem', noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {/* (Sair) */}
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
      
      {/* --- AppBar (Corrigida) --- */}
      <AppBar
        position="fixed"
        elevation={0} // Mantém o visual "flat"
        sx={{
          // 5. Anima a largura e a margem da AppBar
          width: `calc(100% - ${currentDrawerWidth}px)`,
          ml: `${currentDrawerWidth}px`,
          backgroundColor: 'background.paper',
          
          // 6. CORREÇÃO DO "TOC": Remove a borda de baixo
          // borderBottom: '1px solid', (Removido)
          // borderColor: 'divider', (Removido)

          // Adiciona a animação de transição
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* --- 7. BOTÃO DE TOGGLE DO MENU --- */}
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ 
                mr: 2, 
                color: 'text.primary',
                // (Opcional) Gira o ícone quando o menu está fechado
                // transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                // transition: 'transform 0.2s'
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" noWrap component="div" color="text.primary" fontWeight={600}>
              {/* Título (você pode querer um título dinâmico aqui) */}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* (Espaço para Notificações, etc.) */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- Sidebar (Corrigida) --- */}
      <Drawer
        variant="permanent"
        sx={{
          // 8. Anima a largura do Drawer
          width: currentDrawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap', // Impede quebra de linha durante a animação
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            // 9. Anima a largura do "papel" interno
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden', // Esconde o texto ao fechar
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

      {/* --- Conteúdo Principal (Corrigido) --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Espaçador (correto) */}
        <Outlet />
      </Box>
    </Box>
  );
};