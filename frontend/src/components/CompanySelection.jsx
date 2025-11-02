import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building2, Loader2, XCircle } from 'lucide-react';

const CompanySelection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstButtonRef = useRef(null);

  const { companies, selectCompany } = useAuth();

  useEffect(() => {
    if (companies.length > 0) {
      firstButtonRef.current?.focus();
    }
  }, [companies]);

  const handleSelectCompany = async (companyId) => {
    setLoading(true);
    setError('');
    try {
      await selectCompany(companyId);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao selecionar empresa');
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
            Selecionar Empresa
          </CardTitle>
          <CardDescription className="text-gray-600">
            Escolha a empresa para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" id="error-alert">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription id="error-message">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {companies.map((company, index) => (
              <Button
                key={company.id}
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-transform hover:scale-[1.02] rounded-lg"
                onClick={() => handleSelectCompany(company.id)}
                disabled={loading}
                ref={index === 0 ? firstButtonRef : null}
                aria-label={`Selecionar empresa ${company.name}`}
                aria-describedby={error ? 'error-message' : undefined}
              >
                <Building2 className="mr-3 h-5 w-5 text-indigo-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{company.name}</div>
                  <div className="text-sm text-gray-500">{company.cnpj}</div>
                </div>
                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-indigo-600" />}
              </Button>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                Nenhuma empresa encontrada.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Entre em contato com o administrador para obter acesso.
              </p>
              <Button
                variant="link"
                className="text-indigo-600 hover:text-indigo-800"
                // Placeholder: Requer integração com suporte
                onClick={() => setError('Funcionalidade de suporte não implementada')}
                aria-label="Contactar administrador"
              >
                Contactar Administrador
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySelection;