/**
 * Professional Application Navigation
 * World-class navigation with breadcrumbs and user context
 */

import React from 'react';
import { useRouter, useNavigate, useBreadcrumbs } from '../../hooks/useRouter';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Settings, User, LogOut, ChevronRight, Home } from 'lucide-react';

interface AppNavigationProps {
  children: React.ReactNode;
}

export default function AppNavigation({ children }: AppNavigationProps) {
  const { state, currentRoute } = useRouter();
  const { navigate } = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const breadcrumbs = useBreadcrumbs();

  // Don't show navigation on public pages
  const isPublicPage = ['landing', 'auth', 'card-live', 'profile'].includes(currentRoute?.component || '');

  if (isPublicPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-2xl font-bold text-white hover:text-emerald-400 transition-colors"
            >
              INDI
            </button>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && <ChevronRight size={14} className="text-slate-500" />}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={`hover:text-emerald-400 transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'text-white font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {index === 0 ? <Home size={14} /> : crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right: Navigation + User Menu */}
          <div className="flex items-center space-x-6">
            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <NavButton
                icon={LayoutDashboard}
                label="Dashboard"
                path="/dashboard"
                isActive={state.currentPath === '/dashboard'}
                onClick={() => navigate('/dashboard')}
              />
              <NavButton
                icon={Settings}
                label="Configuración"
                path="/settings"
                isActive={state.currentPath.startsWith('/settings')}
                onClick={() => navigate('/settings')}
              />
            </div>

            {/* User Menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-emerald-600 text-white'
          : 'text-slate-300 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}