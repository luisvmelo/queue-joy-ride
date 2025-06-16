
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

interface SecuritySettingsProps {
  restaurantId: string;
}

const SecuritySettings = ({ restaurantId }: SecuritySettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    require_2fa: false,
    min_password_length: 8,
    require_uppercase: true,
    require_numbers: true,
  });

  useEffect(() => {
    loadSecuritySettings();
    loadActivityLogs();
  }, [restaurantId]);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("require_2fa, min_password_length, require_uppercase, require_numbers")
        .eq("restaurant_id", restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          require_2fa: data.require_2fa || false,
          min_password_length: data.min_password_length || 8,
          require_uppercase: data.require_uppercase ?? true,
          require_numbers: data.require_numbers ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading security settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de segurança",
        variant: "destructive",
      });
    }
  };

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * 10, currentPage * 10 - 1);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error("Error loading activity logs:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de atividade",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("restaurant_settings")
        .upsert({
          restaurant_id: restaurantId,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações de segurança atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Error updating security settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de segurança",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="require_2fa"
            checked={formData.require_2fa}
            onCheckedChange={(checked) => setFormData({ ...formData, require_2fa: checked })}
          />
          <Label htmlFor="require_2fa">Exigir 2FA para todos os usuários</Label>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Política de Senha</h4>
          
          <div>
            <Label htmlFor="min_password_length">Mínimo de Caracteres</Label>
            <Input
              id="min_password_length"
              type="number"
              min="6"
              max="20"
              value={formData.min_password_length}
              onChange={(e) => setFormData({ ...formData, min_password_length: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="require_uppercase"
              checked={formData.require_uppercase}
              onCheckedChange={(checked) => setFormData({ ...formData, require_uppercase: checked })}
            />
            <Label htmlFor="require_uppercase">Exigir letras maiúsculas</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="require_numbers"
              checked={formData.require_numbers}
              onCheckedChange={(checked) => setFormData({ ...formData, require_numbers: checked })}
            />
            <Label htmlFor="require_numbers">Exigir números</Label>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>

      <div>
        <h3 className="text-lg font-medium mb-4">Log de Atividades</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.details ? JSON.stringify(log.details) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {activityLogs.length === 10 && (
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentPage(currentPage + 1);
                loadActivityLogs();
              }}
            >
              Carregar Mais
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;
