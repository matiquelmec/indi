/**
 * React Hook for Professional Router System
 * Provides clean React integration with INDIRouter
 */

import { useState, useEffect } from 'react';
import { router, RouterState, UseRouter, RouteParams } from '../lib/router';

export function useRouter(): UseRouter {
  const [state, setState] = useState<RouterState>(router.getState());

  useEffect(() => {
    // Subscribe to router state changes
    const unsubscribe = router.subscribe((newState) => {
      setState(newState);
    });

    // Initialize router on first use
    router.init();

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    state,
    navigate: router.navigate.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    params: state.params,
    query: state.query,
    currentRoute: router.getCurrentRoute()
  };
}

/**
 * Hook for route parameters
 */
export function useParams(): RouteParams {
  const { params } = useRouter();
  return params;
}

/**
 * Hook for query parameters
 */
export function useQuery(): URLSearchParams {
  const { query } = useRouter();
  return query;
}

/**
 * Hook for navigation functions
 */
export function useNavigate() {
  const { navigate, back, forward } = useRouter();

  return {
    navigate,
    back,
    forward,
    // Helper functions for common navigation patterns
    goToDashboard: () => navigate('/dashboard'),
    goToEditor: (cardId?: string) => navigate(cardId ? `/editor/${cardId}` : '/editor'),
    goToSettings: () => navigate('/settings'),
    goToCard: (username: string, cardSlug?: string) =>
      navigate(cardSlug ? `/${username}/${cardSlug}` : `/${username}`),
    goToAuth: () => navigate('/auth'),
    goToLanding: () => navigate('/'),
  };
}

/**
 * Hook to check current route
 */
export function useRouteMatch(pattern: string): boolean {
  const { state } = useRouter();
  const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
  return regex.test(state.currentPath);
}

/**
 * Hook for authentication-aware routing with user security
 */
export function useAuthRouter(isAuthenticated: boolean, user?: any) {
  const { navigate, state } = useRouter();
  const currentRoute = router.getCurrentRoute();

  useEffect(() => {
    // Handle unauthenticated users
    if (!isAuthenticated && currentRoute?.auth) {
      navigate('/auth');
      return;
    }

    // Handle authenticated users
    if (isAuthenticated && user) {
      // Redirect from auth/landing to user dashboard
      if (['/auth', '/'].includes(state.currentPath)) {
        const userRedirect = router.getUserRedirect(user);
        navigate(userRedirect);
        return;
      }

      // Handle legacy routes
      const legacyRedirect = router.migrateLegacyRoute(state.currentPath, user);
      if (legacyRedirect) {
        navigate(legacyRedirect, { replace: true });
        return;
      }

      // Validate user-scoped routes
      if (currentRoute?.userScoped) {
        const hasAccess = router.validateUserAccess(user, currentRoute);
        if (!hasAccess) {
          // Redirect to user's own dashboard if trying to access another user's area
          const userRedirect = router.getUserRedirect(user);
          navigate(userRedirect);
          return;
        }
      }
    }
  }, [isAuthenticated, user, state.currentPath, currentRoute, navigate]);

  return {
    navigate,
    currentRoute,
    isProtectedRoute: currentRoute?.auth || false,
    isUserScopedRoute: currentRoute?.userScoped || false
  };
}

/**
 * Hook for SEO and meta management
 */
export function useSEO(title?: string, description?: string, keywords?: string[]) {
  useEffect(() => {
    router.updatePageMeta(title, {
      description,
      keywords
    });
  }, [title, description, keywords]);
}

/**
 * Hook for breadcrumb navigation
 */
export function useBreadcrumbs() {
  const { state } = useRouter();

  const generateBreadcrumbs = () => {
    const pathSegments = state.currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Inicio', path: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Generate human-readable labels
      let label = segment;
      if (segment === 'dashboard') label = 'Panel de Control';
      else if (segment === 'editor') label = 'Editor';
      else if (segment === 'settings') label = 'Configuración';
      else if (segment === 'billing') label = 'Facturación';
      else if (segment === 'account') label = 'Cuenta';
      else if (segment === 'help') label = 'Ayuda';
      else if (segment === 'upgrade') label = 'Planes';

      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  return generateBreadcrumbs();
}