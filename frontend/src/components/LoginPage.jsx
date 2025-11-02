import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, LogIn, UserPlus, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailInputRef = useRef(null);

  const { login, register } = useAuth();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateForm = () => {
    if (!email) {
      setError('Email é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return false;
    }
    if (!password) {
      setError('Senha é obrigatória');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        setSuccess('Usuário criado com sucesso! Faça login para continuar.');
        setIsLogin(true);
        setPassword('');
        setEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-blue-100 p-4">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <Card className="w-full max-w-md shadow-xl rounded-xl border-none animate-fadeIn">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-medium text-indigo-900">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isLogin
              ? 'Entre com suas credenciais para acessar o sistema'
              : 'Registre-se para começar a usar o sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                  aria-label="Email"
                  aria-describedby={error ? 'email-error' : undefined}
                  ref={emailInputRef}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 pr-10"
                  aria-label="Senha"
                  aria-describedby={error ? 'password-error' : undefined}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" id="error-alert">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription id="email-error password-error">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200" id="success-alert">
                <CheckCircle2 className="h-4 w-4 text-green-700" />
                <AlertTitle className="text-green-800">Sucesso</AlertTitle>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-transform hover:scale-105"
              disabled={loading}
              aria-label={isLogin ? 'Entrar' : 'Criar Conta'}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLogin ? (
                <LogIn className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="space-y-2 text-center">
            {isLogin && (
              <Button
                variant="link"
                className="text-indigo-600 hover:text-indigo-800"
                disabled={loading}
                // Placeholder: Requer endpoint para recuperação de senha
                onClick={() => setError('Funcionalidade de recuperação de senha não implementada')}
                aria-label="Esqueci minha senha"
              >
                Esqueci minha senha
              </Button>
            )}
            <Button
              variant="link"
              className="text-indigo-600 hover:text-indigo-800"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setEmail('');
                setPassword('');
              }}
              disabled={loading}
              aria-label={isLogin ? 'Criar conta' : 'Fazer login'}
            >
              {isLogin ? 'Não tem uma conta? Criar conta' : 'Já tem uma conta? Fazer login'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;