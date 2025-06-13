
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CheckIn from "./pages/CheckIn";
import Status from "./pages/Status";
import Restaurants from "./pages/Restaurants";
import EstabelecimentoDetalhes from "./pages/EstabelecimentoDetalhes";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";
import EmailConfirm from "./pages/EmailConfirm";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/check-in/:restaurantId" element={<CheckIn />} />
          <Route path="/status/:id" element={<Status />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/estabelecimento/:restaurantId" element={<EstabelecimentoDetalhes />} />
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/confirm" element={<EmailConfirm />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
