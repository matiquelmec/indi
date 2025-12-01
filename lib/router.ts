/**
 * Professional URL Router System
 * World-class routing architecture for INDI
 */

export type RouteParams = {
  [key: string]: string | undefined;
};

export interface Route {
  path: string;
  component: string;
  exact?: boolean;
  auth?: boolean;
  userScoped?: boolean;  // Requires user identity validation
  title?: string;
  meta?: {
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
}

export interface RouterState {
  currentPath: string;
  params: RouteParams;
  query: URLSearchParams;
  previousPath?: string;
}

export class INDIRouter {
  private routes: Route[] = [];
  private listeners: ((state: RouterState) => void)[] = [];
  private currentState: RouterState;

  constructor() {
    this.currentState = this.parseCurrentLocation();
    this.setupEventListeners();
  }

  // Route definitions - User-scoped URL structure
  private defineRoutes(): Route[] {
    return [
      // Public routes
      {
        path: '/',
        component: 'landing',
        exact: true,
        title: 'INDI - Tu Identidad Digital Profesional',
        meta: {
          description: 'Crea tu tarjeta digital profesional en segundos',
          keywords: ['tarjeta digital', 'networking', 'profesional']
        }
      },
      {
        path: '/auth',
        component: 'auth',
        exact: true,
        title: 'Iniciar Sesión - INDI'
      },
      {
        path: '/auth/callback',
        component: 'auth-callback',
        exact: true,
        title: 'Autenticando...'
      },
      {
        path: '/help',
        component: 'help',
        exact: true,
        title: 'Ayuda - INDI'
      },
      {
        path: '/help/:topic',
        component: 'help-topic',
        title: 'Ayuda - INDI'
      },

      // User-scoped authenticated routes
      {
        path: '/:username/dashboard',
        component: 'dashboard',
        auth: true,
        userScoped: true,
        title: 'Panel de Control - INDI'
      },
      {
        path: '/:username/dashboard/analytics',
        component: 'dashboard-analytics',
        auth: true,
        userScoped: true,
        title: 'Analytics - INDI'
      },
      {
        path: '/:username/editor',
        component: 'editor',
        auth: true,
        userScoped: true,
        exact: true,
        title: 'Editor - Nueva Tarjeta'
      },
      {
        path: '/:username/editor/:cardId',
        component: 'editor',
        auth: true,
        userScoped: true,
        title: 'Editor - INDI'
      },
      {
        path: '/:username/editor/:cardId/preview',
        component: 'editor-preview',
        auth: true,
        userScoped: true,
        title: 'Vista Previa - INDI'
      },
      {
        path: '/:username/settings',
        component: 'settings',
        auth: true,
        userScoped: true,
        exact: true,
        title: 'Configuración - INDI'
      },
      {
        path: '/:username/settings/billing',
        component: 'settings-billing',
        auth: true,
        userScoped: true,
        title: 'Facturación - INDI'
      },
      {
        path: '/:username/settings/account',
        component: 'settings-account',
        auth: true,
        userScoped: true,
        title: 'Cuenta - INDI'
      },
      {
        path: '/:username/cards',
        component: 'cards-list',
        auth: true,
        userScoped: true,
        title: 'Mis Tarjetas - INDI'
      },

      // Global authenticated routes (not user-scoped)
      {
        path: '/upgrade',
        component: 'upgrade',
        auth: true,
        title: 'Planes Premium - INDI'
      },

      // Public user profiles and cards
      {
        path: '/:username',
        component: 'profile',
        exact: true,
        title: 'Perfil Profesional'
      },
      {
        path: '/:username/:cardSlug',
        component: 'card-live',
        title: 'Tarjeta Digital'
      },

      // Direct card access routes (public)
      {
        path: '/card/:slug',
        component: 'card-direct',
        title: 'Tarjeta Digital'
      },
      {
        path: '/card/:id',
        component: 'card-legacy',
        title: 'Tarjeta Digital'
      },

      // Legacy support (will redirect)
      {
        path: '/dashboard',
        component: 'legacy-dashboard',
        auth: true,
        title: 'Redirigiendo...'
      },
      {
        path: '/editor',
        component: 'legacy-editor',
        auth: true,
        title: 'Redirigiendo...'
      },
      {
        path: '/settings',
        component: 'legacy-settings',
        auth: true,
        title: 'Redirigiendo...'
      }
    ];
  }

  private parseCurrentLocation(): RouterState {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    return {
      currentPath: url.pathname,
      params: this.extractParams(url.pathname),
      query: url.searchParams,
      previousPath: this.currentState?.currentPath
    };
  }

  private extractParams(path: string): RouteParams {
    const route = this.findMatchingRoute(path);
    if (!route) return {};

    const routeSegments = route.path.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);
    const params: RouteParams = {};

    routeSegments.forEach((segment, index) => {
      if (segment.startsWith(':')) {
        const paramName = segment.slice(1);
        params[paramName] = pathSegments[index];
      }
    });

    return params;
  }

  private findMatchingRoute(path: string): Route | undefined {
    return this.routes.find(route => {
      if (route.exact) {
        return route.path === path;
      }

      const routePattern = route.path.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('popstate', () => {
      this.updateState();
    });

    // Intercept clicks on internal links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]');

      if (link && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) this.navigate(href);
      }
    });
  }

  private updateState(): void {
    const newState = this.parseCurrentLocation();
    this.currentState = newState;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Public API
  navigate(path: string, options?: { replace?: boolean; state?: any }): void {
    const url = new URL(path, window.location.origin);

    if (options?.replace) {
      window.history.replaceState(options.state, '', url.href);
    } else {
      window.history.pushState(options.state, '', url.href);
    }

    this.updateState();
  }

  redirect(path: string): void {
    window.location.href = path;
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }

  getState(): RouterState {
    return { ...this.currentState };
  }

  getCurrentRoute(): Route | undefined {
    return this.findMatchingRoute(this.currentState.currentPath);
  }

  subscribe(listener: (state: RouterState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  generatePath(routePath: string, params: RouteParams): string {
    let path = routePath;
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        path = path.replace(`:${key}`, value);
      }
    });
    return path;
  }

  isCurrentPath(path: string): boolean {
    return this.currentState.currentPath === path;
  }

  matchesPath(pattern: string): boolean {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
    return regex.test(this.currentState.currentPath);
  }

  // SEO and Meta management
  updatePageMeta(title?: string, meta?: Route['meta']): void {
    if (title) {
      document.title = title;
    }

    if (meta?.description) {
      this.updateMetaTag('description', meta.description);
    }

    if (meta?.keywords) {
      this.updateMetaTag('keywords', meta.keywords.join(', '));
    }

    if (meta?.ogImage) {
      this.updateMetaTag('og:image', meta.ogImage);
    }
  }

  private updateMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  // User security validation
  validateUserAccess(currentUser: any, route: Route): boolean {
    // If route is not user-scoped, allow access
    if (!route.userScoped) {
      return true;
    }

    // Extract username from current route
    const usernameFromPath = this.currentState.params.username;
    if (!usernameFromPath || !currentUser) {
      return false;
    }

    // Extract username from current user email
    const userSlug = currentUser.email ?
      currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') :
      null;

    return userSlug === usernameFromPath;
  }

  // Get redirect for user after authentication
  getUserRedirect(user: any): string {
    if (!user?.email) return '/auth';

    const userSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `/${userSlug}/dashboard`;
  }

  // Legacy route migration
  migrateLegacyRoute(path: string, user: any): string | null {
    if (!user?.email) return null;

    const userSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

    switch (path) {
      case '/dashboard':
        return `/${userSlug}/dashboard`;
      case '/editor':
        return `/${userSlug}/editor`;
      case '/settings':
        return `/${userSlug}/settings`;
      default:
        return null;
    }
  }

  // Initialize router
  init(): void {
    this.routes = this.defineRoutes();
    this.updateState();

    // Set initial page meta
    const currentRoute = this.getCurrentRoute();
    if (currentRoute) {
      this.updatePageMeta(currentRoute.title, currentRoute.meta);
    }
  }
}

// Singleton instance
export const router = new INDIRouter();

// React hook for using router
export interface UseRouter {
  state: RouterState;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  back: () => void;
  forward: () => void;
  params: RouteParams;
  query: URLSearchParams;
  currentRoute?: Route;
}