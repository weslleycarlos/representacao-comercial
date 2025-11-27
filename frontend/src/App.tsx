// /frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Páginas
import { PaginaLogin } from './paginas/Login';
import { PaginaAdminDashboard } from './paginas/admin/DashboardAdmin';
import { PaginaAdminOrganizacoes } from './paginas/admin/Organizacoes';
import { PaginaAdminLogs } from './paginas/admin/Logs';
import { PaginaDashboardGestor } from './paginas/gestor/DashboardGestor';
import { PaginaEmpresas } from './paginas/gestor/Empresas';
import { PaginaVendedores } from './paginas/gestor/Vendedores';
import { PaginaClientes } from './paginas/gestor/Clientes';
import { PaginaCatalogo } from './paginas/gestor/Catalogo';
import { PaginaGestorPedidos } from './paginas/gestor/Pedidos';
import { PaginaConfiguracoes } from './paginas/gestor/Configuracoes';
import { PaginaRelatorios } from './paginas/gestor/Relatorios';
import { PaginaLogs } from './paginas/gestor/Logs';
import { PaginaVendedorCatalogo } from './paginas/vendedor/Catalogo';
import { PaginaVendedorClientes } from './paginas/vendedor/Clientes';
import { PaginaVendedorPedidos } from './paginas/vendedor/Pedidos';
import { PaginaVendedorDashboard } from './paginas/vendedor/DashboardVendedor';

// Layouts e Rotas
import { RotaProtegida } from './rotas/RotaProtegida';
import { LayoutGestor } from './componentes/layout/LayoutGestor';
import { LayoutSuperAdmin } from './componentes/layout/LayoutSuperAdmin';
import { LayoutVendedor } from './componentes/layout/LayoutVendedor';
import { useAuth } from './contextos/AuthContext';

function App() {
  const { estaLogado, usuario } = useAuth();

  /**
   * Rota Raiz (/)
   * Decide para onde redirecionar o usuário com base no status de login e no papel.
   */
  const getPaginaInicial = () => {
    if (!estaLogado || !usuario) {
      return <Navigate to="/login" replace />;
    }
    
    // Roteamento baseado no Papel (Role)
    switch (usuario.tp_usuario) {
      case 'super_admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'gestor':
        return <Navigate to="/gestor/dashboard" replace />;
      case 'vendedor':
        return <Navigate to="/vendedor/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <Routes>
      {/* Rota Raiz (/) */}
      <Route path="/" element={getPaginaInicial()} />
      
      {/* Rota de Login */}
      <Route path="/login" element={<PaginaLogin />} />

      {/* --- Rotas do GESTOR --- */}
      <Route element={<RotaProtegida permissoes={['gestor']} />}>
        <Route element={<LayoutGestor />}>
          <Route path="/gestor/dashboard" element={<PaginaDashboardGestor />} />
          <Route path="/gestor/empresas" element={<PaginaEmpresas />} />
          <Route path="/gestor/vendedores" element={<PaginaVendedores />} />
          <Route path="/gestor/clientes" element={<PaginaClientes />} />
          <Route path="/gestor/catalogo" element={<PaginaCatalogo />} />
          <Route path="/gestor/pedidos" element={<PaginaGestorPedidos />} />
          <Route path="/gestor/relatorios" element={<PaginaRelatorios />} />
          <Route path="/gestor/configuracoes" element={<PaginaConfiguracoes />} />
          <Route path="/gestor/logs" element={<PaginaLogs />} />
        </Route>
      </Route>
      
      {/* --- Rotas do SUPER ADMIN --- */}
      <Route element={<RotaProtegida permissoes={['super_admin']} />}>
        <Route element={<LayoutSuperAdmin />}>
          <Route path="/admin/dashboard" element={<PaginaAdminDashboard />} />
          <Route path="/admin/organizacoes" element={<PaginaAdminOrganizacoes />} />
          <Route path="/admin/logs" element={<PaginaAdminLogs />} />
        </Route>
      </Route>

      {/* --- Rotas do VENDEDOR --- */}
      <Route element={<RotaProtegida permissoes={['vendedor']} />}>
        <Route element={<LayoutVendedor />}>
          <Route path="/vendedor/dashboard" element={<PaginaVendedorDashboard />} />
          <Route path="/vendedor/catalogo" element={<PaginaVendedorCatalogo />} />
          <Route path="/vendedor/pedidos" element={<PaginaVendedorPedidos />} />
          <Route path="/vendedor/clientes" element={<PaginaVendedorClientes />} />
        </Route>
      </Route>

      {/* Página 404 */}
      <Route path="*" element={<h1>404: Página Não Encontrada</h1>} />
    </Routes>
  );
}

export default App;