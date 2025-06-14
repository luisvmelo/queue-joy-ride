
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManualQueueEntryProps {
  restaurantId: string;
  onPartyAdded: () => void;
}

const ManualQueueEntry = ({ restaurantId, onPartyAdded }: ManualQueueEntryProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    party_size: 1
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'party_size' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('parties')
        .insert({
          restaurant_id: restaurantId,
          name: formData.name.trim(),
          phone: formData.phone.trim() || 'Não informado',
          party_size: formData.party_size,
          notification_type: 'manual',
          status: 'waiting'
        });

      if (error) throw error;

      toast({
        title: "Grupo adicionado",
        description: `${formData.name} foi adicionado à fila com sucesso`,
      });

      // Reset form
      setFormData({ name: "", phone: "", party_size: 1 });
      setShowForm(false);
      onPartyAdded();

    } catch (error) {
      console.error('Error adding party:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o grupo à fila",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="pt-6">
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full h-16 text-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          >
            <UserPlus className="w-6 h-6 mr-3" />
            Adicionar Grupo Manualmente
          </Button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Para clientes sem celular ou internet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <span>Adicionar Grupo à Fila</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome do responsável"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="party_size">Pessoas *</Label>
              <Input
                id="party_size"
                name="party_size"
                type="number"
                min="1"
                max="20"
                required
                value={formData.party_size}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setFormData({ name: "", phone: "", party_size: 1 });
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Adicionando..." : "Adicionar à Fila"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualQueueEntry;
