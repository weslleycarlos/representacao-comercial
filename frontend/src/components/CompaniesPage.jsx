import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Loader2, Building2, Search, XCircle, CheckCircle2 } from 'lucide-react';

const CompanyForm = ({ company, onSave, closeDialog }) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    state_registration: '',
    contact_email: '',
    contact_phone: '',
    website: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        state_registration: company.state_registration || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        website: company.website || ''
      });
    } else {
      setFormData({ name: '', cnpj: '', state_registration: '', contact_email: '', contact_phone: '', website: '' });
    }
  }, [company]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    setApiError('');
    try {
      await onSave(formData);
      closeDialog();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Erro ao salvar empresa.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome da Empresa *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSaving}
            aria-label="Nome da Empresa"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            required
            disabled={isSaving}
            aria-label="CNPJ"
          />
          {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="state_registration">Inscrição Estadual</Label>
          <Input
            id="state_registration"
            value={formData.state_registration}
            onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
            disabled={isSaving}
            aria-label="Inscrição Estadual"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Email de Contato</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            disabled={isSaving}
            aria-label="Email de Contato"
          />
          {errors.contact_email && <p className="text-sm text-red-500">{errors.contact_email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Telefone de Contato</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            disabled={isSaving}
            aria-label="Telefone de Contato"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="https://..."
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            disabled={isSaving}
            aria-label="Website"
          />
        </div>
      </div>
      {apiError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving} aria-label="Cancelar">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving} aria-label="Salvar Empresa">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCompanies = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const endpoint = query ? `/companies/search?q=${encodeURIComponent(query)}` : '/companies';
      const response = await api.get(endpoint);
      setCompanies(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadCompanies(searchQuery);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleSaveCompany = async (companyData) => {
    try {
      if (selectedCompany) {
        await api.put(`/companies/${selectedCompany.id}`, companyData);
        setSuccess('Empresa atualizada com sucesso!');
      } else {
        await api.post('/companies', companyData);
        setSuccess('Empresa criada com sucesso!');
      }
      loadCompanies(searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      await api.delete(`/companies/${companyId}`);
      setSuccess('Empresa excluída com sucesso!');
      loadCompanies(searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir empresa.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Gerenciamento de Empresas</h1>
        <div className="flex space-x-2">
          <div className="relative w-64">
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              aria-label="Buscar empresas por nome ou CNPJ"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedCompany(null)} aria-label="Nova Empresa">
                <Plus className="mr-2 h-4 w-4" /> Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
              </DialogHeader>
              <CompanyForm
                company={selectedCompany}
                onSave={handleSaveCompany}
                closeDialog={() => setShowDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">Sucesso</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          {companies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">{company.name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {company.contact_email || company.contact_phone || '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowDialog(true);
                        }}
                        aria-label="Editar empresa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            aria-label="Excluir empresa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a empresa {company.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCompany(company.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                {searchQuery ? 'Nenhuma empresa encontrada para a busca.' : 'Nenhuma empresa encontrada.'}
              </p>
              <p className="text-sm text-gray-500">Clique em "Nova Empresa" para começar.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowDialog(true)}
                aria-label="Nova Empresa"
              >
                <Plus className="mr-2 h-4 w-4" /> Nova Empresa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesPage;