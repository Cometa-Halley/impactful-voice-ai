import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Video, Film, LayoutTemplate, User } from 'lucide-react';
import logoPresencia from '@/assets/logo-presencia.png';
import ParticleBackground from '@/components/ParticleBackground';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/create-video', icon: Video, label: t('nav.createVideo') },
    { to: '/my-videos', icon: Film, label: t('nav.myVideos') },
    { to: '/templates', icon: LayoutTemplate, label: t('nav.templates') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoPresencia} alt="Presencia" className="h-7 w-auto" />
            <span className="text-lg font-bold tracking-tight text-foreground">Presencia</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 text-sm ${isActive ? 'text-white bg-nav-hover hover:bg-nav-hover' : 'text-muted-foreground hover:text-foreground hover:bg-nav-hover/20'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.signOut')}</span>
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden overflow-x-auto border-t border-border/50 px-4 py-2 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-xs whitespace-nowrap ${isActive ? 'text-white bg-nav-hover hover:bg-nav-hover' : 'text-muted-foreground hover:text-foreground hover:bg-nav-hover/20'}`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
