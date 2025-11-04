// /frontend/src/rotas/RotaProtegida.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contextos/AuthContext';

interface RotaProtegidaProps {
  permissoes?: ('super_admin' | 'gestor' | 'vendedor')[];
}

export const RotaProtegida = ({ permissoes }: RotaProtegidaProps) => {
  const { estaLogado, usuario } = useAuth();

  if (!estaLogado || !usuario) {
    // 1. Não está logado? Redireciona para /login
    return <Navigate to="/login" replace />;
  }

  // 2. Está logado, mas esta rota exige permissões específicas?
  if (permissoes && !permissoes.includes(usuario.tp_usuario)) {
    // 3. Logado, mas sem permissão? Redireciona para um "Não Autorizado"
    // (Por enquanto, vamos redirecionar para o dashboard principal dele)
    // TODO: Criar uma página /nao-autorizado
    return <Navigate to="/" replace />; 
  }

  // 4. Está logado e tem permissão? Renderiza a página solicitada.
  return <Outlet />;
};