import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                🏢 BALI ZERO TAX
              </h1>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <div className="font-medium text-text-primary">{user.full_name}</div>
                  <div className="text-text-secondary text-xs">{user.role}</div>
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
