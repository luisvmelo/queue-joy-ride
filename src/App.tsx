
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Register from "./pages/Register";
import CheckIn from "./pages/CheckIn";
import Status from "./pages/Status";
import Restaurants from "./pages/Restaurants";
import EstabelecimentoDetalhes from "./pages/EstabelecimentoDetalhes";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/check-in/:restaurantId" element={<CheckIn />} />
            <Route path="/status/:id" element={<Status />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/estabelecimento/:restaurantId" element={<EstabelecimentoDetalhes />} />
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
