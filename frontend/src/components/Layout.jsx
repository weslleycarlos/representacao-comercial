import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  Building2,
  Menu,
  X,
  BookOpen,
  Users,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, company, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  const allNavigation = [
    { name: 'Dashboard', icon: LayoutDashboard, to: '/', adminOnly: false },
    { name: 'Pedidos', icon: ShoppingCart, to: '/orders', adminOnly: false },
    { name: 'Catálogo', icon: BookOpen, to: '/catalog', adminOnly: true },
    { name: 'Empresas', icon: Building2, to: '/companies', adminOnly: true },
    { name: 'Clientes', icon: Users, to: '/clients', adminOnly: true },
    { name: 'Usuários', icon: UsersRound, to: '/users', adminOnly: true },
  ];

  const navigation = allNavigation.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">RepCom</h1>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:block"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  {company && (
                    <Badge variant="outline" className="mt-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {company.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-base font-normal text-gray-900 rounded-lg hover:bg-gray-100 ${
                      isActive ? 'bg-gray-200' : ''
                    } ${isCollapsed ? 'justify-center' : 'justify-start'}`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-2 mt-auto border-t">
            <Button
              variant="outline"
              className={`w-full flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className={`sticky top-0 z-40 bg-white shadow-sm border-b ${isCollapsed ? 'lg:pl-14' : 'lg:pl-60'} transition-all duration-300`}>
          <div className="flex items-center justify-between h-16 px-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              {/* Espaço para futuros ícones */}
            </div>
          </div>
        </div>

        <main className={`px-2 py-4 ${isCollapsed ? 'lg:pl-14' : 'lg:pl-60'} transition-all duration-300`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;