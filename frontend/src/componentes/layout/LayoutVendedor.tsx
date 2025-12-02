// /frontend/src/componentes/layout/LayoutVendedor.tsx
// (VERSÃO REVISADA com menu colapsável e correção de borda)

import React, { useState } from 'react'; // <-- MUDANÇA (1): Importa useState
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
  IconButton, // <-- MUDANÇA (2): Importa IconButton
  Tooltip,    // <-- MUDANÇA (3): Importa Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Group as GroupIcon,
  Category as CatalogoIcon,
  Logout as LogoutIcon,
  SwapHoriz as TrocarEmpresaIcon,
  Menu as MenuIcon, // <-- MUDANÇA (4): Importa MenuIcon
  LockReset as LockResetIcon,
} from '@mui/icons-material';

import { useAuth } from '../../contextos/AuthContext';
import { PaginaSelecionarEmpresa } from '../../paginas/vendedor/PaginaSelecionarEmpresa';
import { ModalSelecionarEmpresa } from '../auth/ModalSelecionarEmpresa';
import { ModalAlterarSenha } from '../comum/ModalAlterarSenha';

const DRAWER_WIDTH = 260;
const MINI_DRAWER_WIDTH = 80; // <-- MUDANÇA (5): Define largura mini

export const LayoutVendedor: React.FC = () => {
  const { usuario, logout, empresaAtiva } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [modalTrocarEmpresaAberto, setModalTrocarEmpresaAberto] = useState(false);

  // --- MUDANÇA (6): Adiciona estado para o menu ---
  const [open, setOpen] = useState(true); // Começa aberto
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open); // Inverte o estado
  };
  // --- FIM DA MUDANÇA ---

  if (!empresaAtiva) {
    return <PaginaSelecionarEmpresa />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTrocarEmpresa = () => {
    setModalTrocarEmpresaAberto(true);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/vendedor/dashboard' },
    { text: 'Catálogo', icon: <CatalogoIcon />, path: '/vendedor/catalogo' },
    { text: 'Pedidos', icon: <ShoppingCartIcon />, path: '/vendedor/pedidos' },
    { text: 'Clientes', icon: <GroupIcon />, path: '/vendedor/clientes' },
  ];

  // --- MUDANÇA (7): Calcula a largura atual ---
  const currentDrawerWidth = open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Perfil do Usuário */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 44, height: 44,
            fontSize: '1.25rem', fontWeight: 600,
            transition: 'all 0.2s', // Animação
          }}
        >
          {usuario?.no_completo ? usuario.no_completo[0].toUpperCase() : usuario?.ds_email[0].toUpperCase()}
        </Avatar>

        {/* --- MUDANÇA (8): Anima o texto do perfil --- */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          opacity: open ? 1 : 0, // Fade out
          transition: (theme) => theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shortest,
          }),
        }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
            {usuario?.no_completo || 'Vendedor'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {empresaAtiva.no_empresa}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* --- MUDANÇA (9): Anima o Menu Principal --- */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

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
                        minWidth: 0, // Permite centralizar
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

      {/* --- MUDANÇA (10): Anima o Menu Inferior --- */}
      <List disablePadding sx={{ py: 1 }}>
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <Tooltip title="Trocar Empresa" placement="right" disableHoverListener={open}>
            <ListItemButton
              onClick={handleTrocarEmpresa}
              sx={{ borderRadius: 1.5, justifyContent: 'center' }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                <TrocarEmpresaIcon />
              </ListItemIcon>
              <ListItemText
                primary="Trocar Empresa"
                sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}
                primaryTypographyProps={{ fontSize: '0.9375rem', noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* (Alterar Senha) */}
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <Tooltip title="Alterar Senha" placement="right" disableHoverListener={open}>
            <ListItemButton
              onClick={() => setModalSenhaAberto(true)}
              sx={{ borderRadius: 1.5, justifyContent: 'center' }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                <LockResetIcon />
              </ListItemIcon>
              <ListItemText
                primary="Alterar Senha"
                sx={{ opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}
                primaryTypographyProps={{ fontSize: '0.9375rem', noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>

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
      {/* --- MUDANÇA (11): AppBar Animada e Corrigida --- */}
      <AppBar
        position="fixed"
        elevation={0} // Mantém flat
        sx={{
          // Anima a largura e margem
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
            {/* --- MUDANÇA (12): Botão de Toggle --- */}
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
              Empresa Ativa: {empresaAtiva.no_empresa}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Espaço para ações */}
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- MUDANÇA (13): Sidebar Animada --- */}
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

      {/* Modal de Troca (sem alteração) */}
      <ModalSelecionarEmpresa
        open={modalTrocarEmpresaAberto}
        onClose={() => setModalTrocarEmpresaAberto(false)}
      />

      {/* Modal de Alterar Senha */}
      <ModalAlterarSenha
        open={modalSenhaAberto}
        onClose={() => setModalSenhaAberto(false)}
      />
    </Box>
  );
};