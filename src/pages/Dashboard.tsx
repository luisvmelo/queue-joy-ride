
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      // Redirect based on user type
      switch (profile.user_type) {
        case 'owner':
          navigate('/owner-dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'receptionist':
          navigate('/receptionist');
          break;
        default:
          navigate('/auth');
      }
    }
  }, [user, profile, loading, navigate]);

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

  return null;
};

export default Dashboard;
