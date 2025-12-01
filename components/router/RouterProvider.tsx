/**
 * Router Provider Component
 * Provides routing context and renders appropriate components
 */

import React from 'react';
import { useRouter, useAuthRouter } from '../../hooks/useRouter';
import { useAuth } from '../../contexts/AuthContext';

// Import all page components
import LandingPage from '../layout/LandingPage';
import LoginPage from '../auth/LoginPage';
import Dashboard from '../dashboard/Dashboard';
import CardEditor from '../editor/CardEditor';
import CardPreview from '../preview/CardPreview';
import ExternalCardView from '../preview/ExternalCardView';

interface RouterProviderProps {
  children?: React.ReactNode;
}

export default function RouterProvider({ children }: RouterProviderProps) {
  const { state, currentRoute } = useRouter();
  const { isAuthenticated, authLoading } = useAuth();
  useAuthRouter(isAuthenticated);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Render based on current route
  const renderComponent = () => {
    if (!currentRoute) {
      // 404 page
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-slate-400">Página no encontrada</p>
          </div>
        </div>
      );
    }

    switch (currentRoute.component) {
      case 'landing':
        return <LandingPage />;

      case 'auth':
        return <LoginPage />;

      case 'auth-callback':
        return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-white">Autenticando...</div>
          </div>
        );

      case 'dashboard':
        return <Dashboard />;

      case 'dashboard-analytics':
        return <Dashboard analyticsView={true} />;

      case 'editor':
        return <CardEditor cardId={state.params.cardId} />;

      case 'editor-preview':
        return <CardEditor cardId={state.params.cardId} previewMode={true} />;

      case 'settings':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Configuración</h1>
            <p className="text-slate-400">Panel de configuración en desarrollo...</p>
          </div>
        );

      case 'settings-billing':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Facturación</h1>
            <p className="text-slate-400">Panel de facturación en desarrollo...</p>
          </div>
        );

      case 'settings-account':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Cuenta</h1>
            <p className="text-slate-400">Configuración de cuenta en desarrollo...</p>
          </div>
        );

      case 'upgrade':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Planes Premium</h1>
            <p className="text-slate-400">Planes premium en desarrollo...</p>
          </div>
        );

      case 'help':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Ayuda</h1>
            <p className="text-slate-400">Centro de ayuda en desarrollo...</p>
          </div>
        );

      case 'help-topic':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Ayuda - {state.params.topic}</h1>
            <p className="text-slate-400">Tema de ayuda en desarrollo...</p>
          </div>
        );

      case 'profile':
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Perfil de {state.params.username}</h1>
            <p className="text-slate-400">Perfil de usuario en desarrollo...</p>
          </div>
        );

      case 'card-live':
        return <ExternalCardView username={state.params.username} cardSlug={state.params.cardSlug} />;

      case 'card-direct':
        // Direct card access via /card/:slug
        return <ExternalCardView cardSlug={state.params.slug} />;

      case 'card-legacy':
        // Handle legacy URLs by redirecting to external card view with ID
        return <ExternalCardView cardId={state.params.id} />;

      default:
        return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Error</h1>
              <p className="text-slate-400">Componente no encontrado</p>
            </div>
          </div>
        );
    }
  };

  return <>{renderComponent()}</>;
}