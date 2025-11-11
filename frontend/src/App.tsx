// /frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Páginas
import { PaginaLogin } from './paginas/Login';
import { PaginaDashboardGestor } from './paginas/gestor/DashboardGestor';
import { PaginaEmpresas } from './paginas/gestor/Empresas';
import { PaginaVendedores } from './paginas/gestor/Vendedores';
import { PaginaAdminDashboard } from './paginas/admin/DashboardAdmin';
import { PaginaClientes } from './paginas/gestor/Clientes';
import { PaginaCatalogo } from './paginas/gestor/Catalogo';
// (Importe as outras páginas do gestor quando as criarmos)

// Layouts e Rotas
import { RotaProtegida } from './rotas/RotaProtegida';
import { LayoutGestor } from './componentes/layout/LayoutGestor';
import { LayoutSuperAdmin } from './componentes/layout/LayoutSuperAdmin'; // <-- IMPORTAR
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
        // 2. MUDAR O REDIRECT
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
          <Route path="/gestor/pedidos" element={<h1>Página de Pedidos (Gestor)</h1>} />
          <Route path="/gestor/relatorios" element={<h1>Página de Relatórios (Gestor)</h1>} />
          <Route path="/gestor/configuracoes" element={<h1>Página de Configs (Gestor)</h1>} />
        </Route>
      </Route>
      
      {/* --- Rotas do SUPER ADMIN --- */}
      <Route element={<RotaProtegida permissoes={['super_admin']} />}>
        <Route element={<LayoutSuperAdmin />}>
        <Route path="/admin/dashboard" element={<PaginaAdminDashboard />} />
          <Route path="/admin/organizacoes" element={<h1>Página de Organizações (Admin)</h1>} />
          <Route path="/admin/logs" element={<h1>Página de Logs (Admin)</h1>} />
          {/* (Adicionaremos o dashboard do admin aqui) */}
        </Route>
      </Route>

      {/* --- Rotas do VENDEDOR --- */}
      {/* (Adicionaremos o LayoutVendedor e as rotas aqui) */}
      <Route element={<RotaProtegida permissoes={['vendedor']} />}>
         {/* <Route element={<LayoutVendedor />}> ... </Route> */}
         <Route path="/vendedor/dashboard" element={<h1>Dashboard do Vendedor</h1>} />
      </Route>

      {/* Página 404 */}
      <Route path="*" element={<h1>404: Página Não Encontrada</h1>} />
    </Routes>
  );
}

export default App;