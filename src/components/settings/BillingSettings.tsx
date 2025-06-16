
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, CreditCard } from "lucide-react";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  pdf_url: string | null;
  created_at: string;
}

interface BillingSettingsProps {
  restaurantId: string;
}

const BillingSettings = ({ restaurantId }: BillingSettingsProps) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPlan, setCurrentPlan] = useState("basic");

  useEffect(() => {
    loadBillingData();
  }, [restaurantId]);

  const loadBillingData = async () => {
    try {
      const [restaurantResponse, invoicesResponse] = await Promise.all([
        supabase
          .from("restaurants")
          .select("plan_type")
          .eq("id", restaurantId)
          .single(),
        supabase
          .from("billing_invoices")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false })
      ]);

      if (restaurantResponse.error) throw restaurantResponse.error;

      setCurrentPlan(restaurantResponse.data.plan_type || "basic");
      setInvoices(invoicesResponse.data || []);
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de faturamento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      paid: { label: "Pago", variant: "default" as const },
      pending: { label: "Pendente", variant: "secondary" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: "outline" as const 
    };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanLabel = (plan: string) => {
    const planMap = {
      basic: "Básico",
      premium: "Premium",
      enterprise: "Enterprise",
    };
    return planMap[plan as keyof typeof planMap] || plan;
  };

  const changePlan = async () => {
    toast({
      title: "Em breve",
      description: "Funcionalidade de mudança de plano será implementada em breve",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">{getPlanLabel(currentPlan)}</h3>
              <p className="text-gray-600">Seu plano atual</p>
            </div>
            <Button onClick={changePlan}>
              Mudar Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-medium mb-4">Histórico de Faturas</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell>
                  {new Date(invoice.due_date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  {invoice.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BillingSettings;
