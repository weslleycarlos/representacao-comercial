import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

const UserDetailPage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', role: 'user', is_active: true });
  const [isEditing, setIsEditing] = useState(false);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, companiesData] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/companies'),
      ]);
      setUser(userData.data);
      setAllCompanies(companiesData.data);
      setFormData({
        full_name: userData.data.full_name || '',
        email: userData.data.email,
        role: userData.data.role,
        is_active: userData.data.is_active,
      });
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleAssociateCompany = async () => {
    if (!selectedCompanyId) return;
    try {
      await api.post(`/users/${userId}/companies`, { company_id: selectedCompanyId });
      setSelectedCompanyId('');
      loadData();
    } catch (error) {
      alert('Erro ao associar empresa.');
    }
  };

  const handleDisassociateCompany = async (companyId) => {
    if (!window.confirm("Tem certeza que deseja remover o acesso deste usuário a esta empresa?")) return;
    try {
      await api.delete(`/users/${userId}/companies/${companyId}`);
      loadData();
    } catch (error) {
      alert('Erro ao remover associação.');
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.full_name || !formData.email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      await api.put(`/users/${userId}`, {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
      });
      alert('Usuário atualizado com sucesso!');
      setIsEditing(false);
      loadData();
    } catch (error) {
      alert('Erro ao salvar alterações: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) return;
    try {
      await api.delete(`/users/${userId}`);
      alert('Usuário excluído com sucesso!');
      navigate('/users');
    } catch (error) {
      alert('Erro ao excluir usuário: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user) return <p className="text-center">Usuário não encontrado.</p>;

  const availableCompanies = allCompanies.filter(comp => 
    !user.companies.some(userComp => userComp.id === comp.id)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link to="/users" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para todos os usuários
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{user.full_name || user.email}</CardTitle>
            {isAdmin && (
              <div className="space-x-2">
                <Button
                  variant={isEditing ? 'outline' : 'default'}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
                {!isEditing && (
                  <Button variant="destructive" onClick={handleDeleteUser}>
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Digite o nome..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email..."
                />
              </div>
              <div>
                <Label>Permissão</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>Nome:</strong> {user.full_name || 'Não informado'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Permissão:</strong> {user.role}</p>
              <p><strong>Status:</strong> {user.is_active ? 'Ativo' : 'Inativo'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Empresas Associadas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.companies.map(company => (
              <div key={company.id} className="flex items-center justify-between p-2 border rounded">
                <span>{company.name}</span>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => handleDisassociateCompany(company.id)}>
                    <Trash2 className="h-4 w-4 text-red-500"/>
                  </Button>
                )}
              </div>
            ))}
            {user.companies.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma empresa associada.</p>}
          </div>
          
          <Separator className="my-6" />

          {isAdmin && (
            <div className="space-y-2">
              <h3 className="font-semibold">Associar Nova Empresa</h3>
              <div className="flex space-x-2">
                <Select onValueChange={setSelectedCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma empresa..." /></SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map(comp => (
                      <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssociateCompany} disabled={!selectedCompanyId}>Associar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailPage;