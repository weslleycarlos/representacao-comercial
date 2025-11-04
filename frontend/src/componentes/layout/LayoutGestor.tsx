// /frontend/src/componentes/layout/LayoutGestor.tsx
import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Business as BusinessIcon, // Ícone para Empresas
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contextos/AuthContext';

// Define a largura da barra lateral
const DRAWER_WIDTH = 256; // (256px é um pouco mais largo que os 240 padrão)

export const LayoutGestor: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redireciona para o login após sair
  };

  // Itens do menu de navegação (inspirado no seu protótipo)
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/gestor/dashboard' },
    { text: 'Empresas', icon: <BusinessIcon />, path: '/gestor/empresas' },
    { text: 'Vendedores', icon: <GroupIcon />, path: '/gestor/vendedores' },
    { text: 'Clientes', icon: <GroupIcon />, path: '/gestor/clientes' },
    { text: 'Pedidos', icon: <ShoppingCartIcon />, path: '/gestor/pedidos' },
    { text: 'Relatórios', icon: <BarChartIcon />, path: '/gestor/relatorios' },
  ];

  const drawerContent = (
    <div>
      {/* --- Perfil do Usuário na Sidebar --- */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {usuario?.no_completo ? usuario.no_completo[0] : usuario?.ds_email[0]}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {usuario?.no_completo || 'Gestor'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuario?.tp_usuario === 'gestor' ? 'Gestor da Organização' : 'Usuário'}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />

      {/* --- Lista de Navegação Principal --- */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} // Usa o Link do React Router
              to={item.path}
              // TODO: Adicionar lógica para destacar o item ativo
              // selected={location.pathname === item.path} 
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      
      {/* --- Menu Inferior (Config & Sair) --- */}
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/gestor/configuracoes">
            <ListItemIcon sx={{ color: 'text.secondary' }}><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Configurações" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'text.secondary' }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* --- Barra Superior (Header) --- */}
      <AppBar
        position="fixed"
        elevation={1} // Sombra sutil
        sx={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          // Usa a cor 'paper' (cartão escuro) para combinar com o protótipo
          backgroundColor: 'background.paper', 
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" color="text.primary">
            {/* O Título da Página (ex: Dashboard) virá aqui no futuro */}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* --- Barra Lateral (Sidebar) --- */}
      <Drawer
        variant="permanent" // Fixa
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            // Cor do papel (tema escuro) e borda sutil
            backgroundColor: 'background.paper', 
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>

      {/* --- Conteúdo Principal da Página --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Usa a cor de fundo padrão (o cinza/azul mais escuro)
          bgcolor: 'background.default', 
          p: 3, // Padding interno
          minHeight: '100vh',
        }}
      >
        {/* Espaçador para o conteúdo não ficar atrás da AppBar */}
        <Toolbar /> 
        
        {/* O <Outlet> renderiza a página filha (Dashboard, Clientes, etc.) */}
        <Outlet />
      </Box>
    </Box>
  );
};