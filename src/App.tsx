
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CheckIn from "./pages/CheckIn";
import Status from "./pages/Status";
import Restaurants from "./pages/Restaurants";
import EstabelecimentoDetalhes from "./pages/EstabelecimentoDetalhes";
import QueuePage from "./pages/QueuePage";
import NotFound from "./pages/NotFound";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import ReceptionistLogin from "./pages/ReceptionistLogin";
import ReceptionistAccess from "./pages/ReceptionistAccess";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailConfirm from "./pages/EmailConfirm";
import PrivateRoute from "./components/PrivateRoute";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/confirm" element={<EmailConfirm />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/check-in/:restaurantId" element={<CheckIn />} />
        <Route path="/status/:id" element={<Status />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/estabelecimento/:restaurantId" element={<EstabelecimentoDetalhes />} />
        <Route path="/queue/:restaurantId" element={<QueuePage />} />
        <Route path="/receptionist" element={<ReceptionistDashboard />} />
        <Route path="/receptionist-login" element={<ReceptionistLogin />} />
        <Route path="/receptionist-access/:restaurantId" element={<ReceptionistAccess />} />
        
        {/* Rotas protegidas */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        
        {/* Rota 404 - deve ser sempre a última */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
