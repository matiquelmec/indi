/**
 * User Utilities for URL-based User Management
 * Handles user identity in URLs securely
 */

import { User } from '../types';

/**
 * Extracts username slug from user email
 * Examples:
 * - demo@indi.com → "demo"
 * - elena.castillo@gmail.com → "elena-castillo"
 * - user+test@domain.com → "user-test"
 */
export function getUserSlug(user: User | null): string | null {
  if (!user?.email) return null;

  const emailPrefix = user.email.split('@')[0];

  // Clean and normalize the email prefix for URL usage
  const slug = emailPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/--+/g, '-')        // Remove multiple consecutive hyphens
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens

  return slug || null;
}

/**
 * Generates user-specific routes
 */
export function getUserRoutes(user: User | null) {
  const slug = getUserSlug(user);
  if (!slug) return null;

  return {
    dashboard: `/${slug}/dashboard`,
    editor: `/${slug}/editor`,
    settings: `/${slug}/settings`,
    profile: `/${slug}`,
    cards: `/${slug}/cards`,
  };
}

/**
 * Checks if current user has access to a user-specific route
 */
export function hasUserAccess(currentUser: User | null, requestedUserSlug: string): boolean {
  if (!currentUser) return false;

  const currentUserSlug = getUserSlug(currentUser);
  return currentUserSlug === requestedUserSlug;
}

/**
 * Validates if a route belongs to the current user
 */
export function validateUserRoute(path: string, currentUser: User | null): boolean {
  // Public routes that don't require user validation
  const publicRoutes = ['/', '/auth', '/auth/callback', '/help'];
  if (publicRoutes.includes(path)) return true;

  // Extract user slug from path
  const pathSegments = path.split('/').filter(Boolean);
  if (pathSegments.length === 0) return true;

  // Check if first segment is a user slug
  const potentialUserSlug = pathSegments[0];

  // If it looks like a user slug, validate access
  if (potentialUserSlug && !['api', 'static', 'assets'].includes(potentialUserSlug)) {
    return hasUserAccess(currentUser, potentialUserSlug);
  }

  return true;
}

/**
 * Redirects to appropriate user route based on authentication
 */
export function getPostLoginRedirect(user: User | null, intendedPath?: string): string {
  if (!user) return '/auth';

  const userRoutes = getUserRoutes(user);
  if (!userRoutes) return '/auth';

  // If there's an intended path, validate it belongs to this user
  if (intendedPath && validateUserRoute(intendedPath, user)) {
    return intendedPath;
  }

  // Default to user's dashboard
  return userRoutes.dashboard;
}

/**
 * Checks if a path is a user-scoped route
 */
export function isUserScopedRoute(path: string): boolean {
  const segments = path.split('/').filter(Boolean);

  // Routes like /:username/dashboard, /:username/editor
  return segments.length >= 2 &&
         !['api', 'auth', 'help', 'upgrade', 'static'].includes(segments[0]);
}

/**
 * Extracts user slug from current path
 */
export function getUserSlugFromPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const potentialSlug = segments[0];

  // Validate it's not a system route
  if (['api', 'auth', 'help', 'upgrade', 'static'].includes(potentialSlug)) {
    return null;
  }

  return potentialSlug;
}

/**
 * User identity verification for security
 */
export function verifyUserIdentity(user: User | null, email: string): boolean {
  return user?.email === email;
}