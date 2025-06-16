
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  accepted_at: string | null;
}

interface TeamSettingsProps {
  restaurantId: string;
}

const TeamSettings = ({ restaurantId }: TeamSettingsProps) => {
  const { toast } = useToast();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "receptionist",
    require_2fa: false,
  });

  useEffect(() => {
    loadTeam();
  }, [restaurantId]);

  const loadTeam = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_staff_invites")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeam(data || []);
    } catch (error) {
      console.error("Error loading team:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar equipe",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error } = await supabase
        .from("restaurant_staff_invites")
        .insert({
          restaurant_id: restaurantId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite enviado com sucesso",
      });

      setShowModal(false);
      resetForm();
      loadTeam();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (inviteId: string) => {
    if (!confirm("Tem certeza que deseja remover este convite?")) return;

    try {
      const { error } = await supabase
        .from("restaurant_staff_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Convite removido com sucesso",
      });

      loadTeam();
    } catch (error) {
      console.error("Error deleting invite:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover convite",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "receptionist",
      require_2fa: false,
    });
  };

  const getRoleLabel = (role: string) => {
    return role === "manager" ? "Gerente" : "Recepcionista";
  };

  const getStatusBadge = (member: TeamMember) => {
    if (member.accepted_at) {
      return <Badge variant="default">Ativo</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Equipe e Permissões</h3>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Convidar Usuário
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{getRoleLabel(member.role)}</TableCell>
              <TableCell>{getStatusBadge(member)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Papel</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="require_2fa"
                checked={formData.require_2fa}
                onCheckedChange={(checked) => setFormData({ ...formData, require_2fa: checked })}
              />
              <Label htmlFor="require_2fa">Exigir 2FA</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Convite"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamSettings;
