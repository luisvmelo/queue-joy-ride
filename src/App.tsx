
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CheckIn from "./pages/CheckIn";
import Status from "./pages/Status";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import EstabelecimentoDetalhes from "./pages/EstabelecimentoDetalhes";
import QueuePage from "./pages/QueuePage";
import AdminDashboard from "./pages/AdminDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import ReceptionistAccess from "./pages/ReceptionistAccess";
import ReceptionistLogin from "./pages/ReceptionistLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailConfirm from "./pages/EmailConfirm";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/check-in/:restaurantId" element={<CheckIn />} />
          <Route path="/status/:partyId" element={<Status />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurant/:restaurantId" element={<RestaurantDetails />} />
          <Route path="/estabelecimento/:restaurantId" element={<EstabelecimentoDetalhes />} />
          <Route path="/queue/:restaurantId" element={<QueuePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/receptionist-access" element={<ReceptionistAccess />} />
          <Route path="/receptionist-login" element={<ReceptionistLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-confirm" element={<EmailConfirm />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
