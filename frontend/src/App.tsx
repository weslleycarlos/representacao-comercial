// /frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa nossas páginas
import { PaginaLogin } from './paginas/Login';
import { PaginaDashboardGestor } from './paginas/gestor/DashboardGestor';
import { PaginaEmpresas } from './paginas/gestor/Empresas';
import { PaginaVendedores } from './paginas/gestor/Vendedores';

// Importa os componentes de Rota
import { RotaProtegida } from './rotas/RotaProtegida';
import { LayoutGestor } from './componentes/layout/LayoutGestor';
import { useAuth } from './contextos/AuthContext';

function App() {
  const { estaLogado, usuario } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !estaLogado ? (
            <Navigate to="/login" replace />
          ) : (
            // Redireciona o usuário logado para seu dashboard principal
            <Navigate to={`/${usuario?.tp_usuario}/dashboard`} replace />
          )
        } 
      />
      
      {/* Rota de Login */}
      <Route path="/login" element={<PaginaLogin />} />

      {/* --- Rotas do GESTOR --- */}
      {/* 1. O "Portão" de segurança (Verifica se é gestor) */}
      <Route element={<RotaProtegida permissoes={['gestor', 'super_admin']} />}>
        {/* 2. O "Layout" visual (Sidebar + Appbar) */}
        <Route element={<LayoutGestor />}>
          
          {/* 3. As "Páginas" (Renderizadas dentro do <Outlet> do Layout) */}
          <Route path="/gestor/dashboard" element={<PaginaDashboardGestor />} />
          <Route path="/gestor/empresas" element={<PaginaEmpresas />} />
          <Route path="/gestor/vendedores" element={<PaginaVendedores />} />
          <Route path="/gestor/clientes" element={<h1>Página de Clientes</h1>} />
          <Route path="/gestor/pedidos" element={<h1>Página de Pedidos</h1>} />
          <Route path="/gestor/relatorios" element={<h1>Página de Relatórios</h1>} />
          <Route path="/gestor/configuracoes" element={<h1>Página de Configurações</h1>} />

        </Route>
      </Route>
      
      {/* (Adicionaremos rotas de Vendedor e Super Admin aqui) */}

      <Route path="*" element={<h1>404: Página Não Encontrada</h1>} />
    </Routes>
  );
}

export default App;