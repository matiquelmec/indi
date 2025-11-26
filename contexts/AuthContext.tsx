import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/unifiedAuth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get current session
        const { session: currentSession, user: currentUser } = await authService.getCurrentSession();

        if (mounted) {
          setSession(currentSession);
          setUser(currentUser);
          setLoading(false);
        }

        console.log('🔐 Auth initialized:', {
          hasSession: !!currentSession,
          hasUser: !!currentUser,
          userEmail: currentUser?.email
        });

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);

        if (mounted) {
          setSession(session);
          setUser(session?.user ? authService.formatUser(session.user) : null);
          setLoading(false);
        }

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          console.log('✅ User signed out');
        } else if (event === 'SIGNED_IN') {
          console.log('✅ User signed in:', session?.user?.email);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);

    try {
      const result = await authService.signUp(email, password, { firstName, lastName });
      return result;
    } catch (error: any) {
      console.error('❌ SignUp error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const result = await authService.signIn(email, password);
      return result;
    } catch (error: any) {
      console.error('❌ SignIn error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      const result = await authService.signInWithGoogle();
      return result;
    } catch (error: any) {
      console.error('❌ Google SignIn error:', error);
      return {
        success: false,
        error: error.message || 'Google authentication failed'
      };
    } finally {
      // Note: loading will be set to false by the auth state change listener
      // when the OAuth redirect completes
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      const result = await authService.signOut();
      return result;
    } catch (error: any) {
      console.error('❌ SignOut error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Reset password failed'
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;