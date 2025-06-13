
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings, Users, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

const OwnerDashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (profile && profile.user_type !== 'owner') {
      navigate('/dashboard');
      return;
    }

    if (user) {
      fetchRestaurants();
    }
  }, [user, profile, loading, navigate]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus estabelecimentos",
        variant: "destructive"
      });
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const restaurantData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      owner_id: user?.id
    };

    try {
      const { error } = await supabase
        .from('restaurants')
        .insert([restaurantData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Estabelecimento cadastrado com sucesso"
      });

      setShowAddForm(false);
      fetchRestaurants();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar estabelecimento",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel do Proprietário</h1>
              <p className="text-gray-600">Bem-vindo, {profile?.full_name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                Ver App
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Estabelecimentos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estabelecimentos Ativos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restaurants.filter(r => r.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Restaurant Button */}
        <div className="mb-6">
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Estabelecimento
          </Button>
        </div>

        {/* Add Restaurant Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Novo Estabelecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Estabelecimento *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea id="address" name="address" rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" type="url" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Restaurants List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    restaurant.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {restaurant.description && (
                  <p className="text-gray-600 mb-2 text-sm">{restaurant.description}</p>
                )}
                {restaurant.address && (
                  <p className="text-gray-500 text-sm mb-1">📍 {restaurant.address}</p>
                )}
                {restaurant.phone && (
                  <p className="text-gray-500 text-sm mb-1">📞 {restaurant.phone}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/estabelecimento/${restaurant.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/admin?restaurant=${restaurant.id}`)}
                  >
                    Painel Admin
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {restaurants.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">Você ainda não cadastrou nenhum estabelecimento.</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Estabelecimento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
