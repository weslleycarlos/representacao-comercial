import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import CompanySelection from './components/CompanySelection';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrdersPage from './components/OrdersPage';
import OrderDetailPage from './components/OrderDetailPage';
import CatalogPage from './components/CatalogPage';
import CompaniesPage from './components/CompaniesPage';
import ClientsPage from './components/ClientsPage';
import ClientDetailPage from './components/ClientDetailPage';
import UsersPage from './components/UsersPage';
import UserDetailPage from './components/UserDetailPage';
import { useServiceWorker } from './hooks/useOffline';
import { Loader2 } from 'lucide-react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Componente para as rotas protegidas (nenhuma mudança aqui)
const ProtectedRoutes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <Routes>
        {/* Rotas para todos os usuários */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<OrdersPage />} />

        {/* Rotas exclusivas para Admin */}
        {isAdmin && (
          <>
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="/users" element={<UsersPage />} /> 
            <Route path="/users/:userId" element={<UserDetailPage />} />
          </>
        )}
        
        {/* Redireciona qualquer outra rota não encontrada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

// Componente de conteúdo com a lógica de navegação corrigida
const AppContent = () => {
  const { user, company, loading, initialAuthCheckComplete } = useAuth();
  const navigate = useNavigate();

  useServiceWorker();

  // Este useEffect agora gerencia os redirecionamentos de forma controlada
  useEffect(() => {
    // Só executa a lógica se a verificação inicial de autenticação estiver completa
    if (!initialAuthCheckComplete) {
      return;
    }

    const currentPath = window.location.pathname;

    // Se não há usuário e ele não está na página de login, redirecione para lá
    if (!user && currentPath !== '/login') {
      navigate('/login');
      return;
    }

    // Se há usuário, mas não empresa, e ele não está na página de seleção, redirecione
    if (user && !company && currentPath !== '/select-company') {
      navigate('/select-company');
      return;
    }

    // Se o usuário está totalmente autenticado (user e company),
    // mas está em uma página de autenticação, redirecione para o dashboard
    if (user && company && (currentPath === '/login' || currentPath === '/select-company')) {
      navigate('/');
    }
  }, [user, company, initialAuthCheckComplete, navigate]);

  // Enquanto a verificação inicial acontece, mostramos um spinner
  if (!initialAuthCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // O JSX de retorno agora apenas define as rotas. O useEffect acima garante
  // que o navegador estará na rota correta para o estado atual do usuário.
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-company" element={<CompanySelection />} />
      <Route path="/*" element={user && company ? <ProtectedRoutes /> : null} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      {/* O <Router> precisa envolver o AppContent para que o `useNavigate` funcione */}
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;