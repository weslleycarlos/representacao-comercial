import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cnpjService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Loader2, Users, Search, XCircle, CheckCircle2 } from 'lucide-react';

const ClientForm = ({ onSave, closeDialog }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [isFormEnabled, setIsFormEnabled] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!formData.razao_social) newErrors.razao_social = 'Razão Social é obrigatória';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCnpjSearch = async () => {
    if (!formData.cnpj) {
      setErrors({ cnpj: 'CNPJ é obrigatório' });
      return;
    }
    setIsSearching(true);
    setApiError('');
    setIsFormEnabled(false);
    try {
      const apiResult = await cnpjService.consultar(formData.cnpj);
      const newClientData = {
        cnpj: formData.cnpj,
        razao_social: apiResult.razao_social || '',
        nome_fantasia: apiResult.nome_fantasia || '',
        email: apiResult.email || '',
        phone: apiResult.telefone || '',
        street: apiResult.logradouro || '',
        number: apiResult.numero || '',
        complement: apiResult.complemento || '',
        neighborhood: apiResult.bairro || '',
        city: apiResult.municipio || '',
        state: apiResult.uf || '',
        zip_code: apiResult.cep || '',
      };
      setFormData(newClientData);
      setIsFormEnabled(true);
    } catch (err) {
      setApiError(err.response?.data?.error || 'CNPJ não encontrado ou inválido.');
      setIsFormEnabled(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      closeDialog();
    } catch (err) {
      setApiError(err.response?.data?.error || 'Erro ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cnpj-search">CNPJ do Cliente *</Label>
        <div className="flex space-x-2">
          <Input
            id="cnpj-search"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="Digite o CNPJ para buscar"
            disabled={isSearching || isSaving}
            aria-label="CNPJ do cliente"
          />
          <Button
            type="button"
            onClick={handleCnpjSearch}
            disabled={isSearching || isSaving || !formData.cnpj}
            size="icon"
            aria-label="Buscar CNPJ"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {errors.cnpj && <p className="text-sm text-red-500">{errors.cnpj}</p>}
        {apiError && <p className="text-sm text-red-500">{apiError}</p>}
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="razao_social">Razão Social *</Label>
          <Input
            id="razao_social"
            value={formData.razao_social}
            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
            required
            disabled={!isFormEnabled || isSaving}
            aria-label="Razão Social"
          />
          {errors.razao_social && <p className="text-sm text-red-500">{errors.razao_social}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
          <Input
            id="nome_fantasia"
            value={formData.nome_fantasia}
            onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Nome Fantasia"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email de Contato</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Email de Contato"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone de Contato</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Telefone de Contato"
          />
        </div>
      </div>

      <Separator />
      <Label className="font-semibold">Endereço Principal</Label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="street">Logradouro</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Logradouro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Número"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement}
            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Complemento"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Bairro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="CEP"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado (UF)</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            disabled={!isFormEnabled || isSaving}
            aria-label="Estado"
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
        <Button type="submit" disabled={!isFormEnabled || isSaving} aria-label="Salvar Cliente">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Cliente'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadClients = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const endpoint = query ? `/clients/search?q=${encodeURIComponent(query)}` : '/clients';
      const response = await api.get(endpoint);
      setClients(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadClients(searchQuery);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const handleSaveClient = async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      setSuccess('Cliente criado com sucesso!');
      navigate(`/clients/${response.data.id}`);
      loadClients(searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      throw err;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Gerenciamento de Clientes</h1>
        <div className="flex space-x-2">
          <div className="relative w-64">
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              aria-label="Buscar clientes por nome"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button aria-label="Novo Cliente">
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-2xl">
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              <ClientForm onSave={handleSaveClient} closeDialog={() => setShowDialog(false)} />
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
          {clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium truncate max-w-[200px]">{client.razao_social}</TableCell>
                    <TableCell>{client.cnpj}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{client.email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                {searchQuery ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente encontrado.'}
              </p>
              <p className="text-sm text-gray-500">Clique em "Novo Cliente" para começar.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;