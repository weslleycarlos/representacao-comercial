import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Edit, Plus, Trash2, Loader2, Home, User, XCircle, CheckCircle2, Check } from 'lucide-react';

const AddressForm = ({ clientId, address, onSave, closeDialog }) => {
  const [formData, setFormData] = useState({
    type: 'Comercial',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    is_primary: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (address) setFormData(address);
  }, [address]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Tipo é obrigatório';
    if (!formData.street) newErrors.street = 'Logradouro é obrigatório';
    if (!formData.city) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state) newErrors.state = 'Estado é obrigatório';
    if (!formData.zip_code) newErrors.zip_code = 'CEP é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setSuccess(`Endereço ${address ? 'atualizado' : 'adicionado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      closeDialog();
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Erro ao salvar endereço' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
            disabled={isSaving}
            required
          >
            <SelectTrigger id="type" aria-label="Tipo de endereço">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Residencial">Residencial</SelectItem>
              <SelectItem value="Entrega">Entrega</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="street">Logradouro *</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            disabled={isSaving}
            required
            aria-label="Logradouro"
          />
          {errors.street && <p className="text-sm text-red-500">{errors.street}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            disabled={isSaving}
            aria-label="Número"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement}
            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
            disabled={isSaving}
            aria-label="Complemento"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            disabled={isSaving}
            aria-label="Bairro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={isSaving}
            required
            aria-label="Cidade"
          />
          {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            disabled={isSaving}
            required
            aria-label="Estado"
          />
          {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip_code">CEP *</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            disabled={isSaving}
            required
            aria-label="CEP"
          />
          {errors.zip_code && <p className="text-sm text-red-500">{errors.zip_code}</p>}
        </div>
      </div>
      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">Sucesso</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      {errors.form && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving} aria-label="Cancelar">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving} aria-label="Salvar Endereço">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ContactForm = ({ clientId, contact, onSave, closeDialog }) => {
  const [formData, setFormData] = useState({ name: '', role: '', email: '', phone: '', is_primary: false });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (contact) setFormData(contact);
  }, [contact]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Nome é obrigatório';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setSuccess(`Contato ${contact ? 'atualizado' : 'adicionado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      closeDialog();
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Erro ao salvar contato' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSaving}
            required
            aria-label="Nome do contato"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Cargo</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            disabled={isSaving}
            aria-label="Cargo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isSaving}
            aria-label="Email do contato"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isSaving}
            aria-label="Telefone do contato"
          />
        </div>
      </div>
      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">Sucesso</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      {errors.form && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving} aria-label="Cancelar">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving} aria-label="Salvar Contato">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const loadClientData = async () => {
    try {
      const response = await api.get(`/clients/${clientId}`);
      setClient(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar dados do cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) loadClientData();
  }, [clientId]);

  const handleSaveAddress = async (addressData) => {
    await api.post(`/clients/${clientId}/addresses`, addressData);
    loadClientData();
  };

  const handleSaveContact = async (contactData) => {
    await api.post(`/clients/${clientId}/contacts`, contactData);
    loadClientData();
  };

  const handleDeleteAddress = async (addressId) => {
    // Placeholder: Requer endpoint DELETE /clients/:id/addresses/:address_id
    setSuccess('Endereço excluído com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
    loadClientData();
  };

  const handleDeleteContact = async (contactId) => {
    // Placeholder: Requer endpoint DELETE /clients/:id/contacts/:contact_id
    setSuccess('Contato excluído com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
    loadClientData();
  };

  if (loading) return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/clients"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
        aria-label="Voltar para clientes"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para todos os clientes
      </Link>

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

      {client ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{client.razao_social}</CardTitle>
              <CardDescription>{client.cnpj}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p><strong>Email:</strong> {client.email || 'Não informado'}</p>
              <p><strong>Telefone:</strong> {client.phone || 'Não informado'}</p>
              <p><strong>Nome Fantasia:</strong> {client.nome_fantasia || 'Não informado'}</p>
              <p><strong>Notas:</strong> {client.notes || 'Nenhuma'}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="addresses">
            <TabsList className="grid w-full grid-cols-2 bg-background border">
              <TabsTrigger value="addresses" className="flex items-center" aria-label="Endereços">
                <Home className="h-4 w-4 mr-2" /> Endereços
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center" aria-label="Contatos">
                <User className="h-4 w-4 mr-2" /> Contatos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="addresses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Endereços Cadastrados</CardTitle>
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setSelectedAddress(null)} aria-label="Novo Endereço">
                        <Plus className="mr-2 h-4 w-4" /> Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedAddress ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
                      </DialogHeader>
                      <AddressForm
                        clientId={clientId}
                        address={selectedAddress}
                        onSave={handleSaveAddress}
                        closeDialog={() => setShowAddressDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {client.addresses.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Logradouro</TableHead>
                          <TableHead>Cidade/UF</TableHead>
                          <TableHead>Primário</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.addresses.map((addr) => (
                          <TableRow key={addr.id}>
                            <TableCell>{addr.type}</TableCell>
                            <TableCell className="truncate max-w-[200px]">{addr.street}, {addr.number}</TableCell>
                            <TableCell>{addr.city}/{addr.state}</TableCell>
                            <TableCell>{addr.is_primary ? <Check className="h-4 w-4 text-green-600" /> : '-'}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedAddress(addr);
                                  setShowAddressDialog(true);
                                }}
                                aria-label="Editar endereço"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    aria-label="Excluir endereço"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este endereço?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAddress(addr.id)}>
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
                    <div className="text-center p-6">
                      <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setShowAddressDialog(true)}
                        aria-label="Adicionar Endereço"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Endereço
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="contacts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Contatos Cadastrados</CardTitle>
                  <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setSelectedContact(null)} aria-label="Novo Contato">
                        <Plus className="mr-2 h-4 w-4" /> Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{selectedContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
                      </DialogHeader>
                      <ContactForm
                        clientId={clientId}
                        contact={selectedContact}
                        onSave={handleSaveContact}
                        closeDialog={() => setShowContactDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {client.contacts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Primário</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="truncate max-w-[200px]">{contact.name}</TableCell>
                            <TableCell>{contact.role || '-'}</TableCell>
                            <TableCell className="truncate max-w-[200px]">{contact.email || '-'}</TableCell>
                            <TableCell>{contact.phone || '-'}</TableCell>
                            <TableCell>{contact.is_primary ? <Check className="h-4 w-4 text-green-600" /> : '-'}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setShowContactDialog(true);
                                }}
                                aria-label="Editar contato"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    aria-label="Excluir contato"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este contato?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
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
                    <div className="text-center p-6">
                      <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setShowContactDialog(true)}
                        aria-label="Adicionar Contato"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Cliente não encontrado.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ClientDetailPage;