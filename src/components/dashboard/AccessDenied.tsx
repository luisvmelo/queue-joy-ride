
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Acesso negado</p>
        <Button onClick={() => navigate("/login")}>Fazer Login</Button>
      </div>
    </div>
  );
};

export default AccessDenied;
