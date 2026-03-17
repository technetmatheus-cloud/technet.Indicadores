import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCity } from '@/contexts/CityContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.jpeg';
import { LogOut, MapPin, Settings } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { selectedCity, setSelectedCity } = useCity();
  const navigate = useNavigate();

  const handleChangeCity = () => {
    setSelectedCity(null);
    navigate('/selecionar-cidade');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="TechNET" className="h-9 w-auto rounded-lg" />
          <div>
            <h1 className="text-lg font-display font-bold text-foreground leading-none">TechNET</h1>
            {selectedCity && (
              <button
                onClick={handleChangeCity}
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
              >
                <MapPin className="h-3 w-3" />
                {selectedCity}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:block">{profile?.nome}</span>
          {profile?.role === 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
