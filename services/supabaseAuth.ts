import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ikrpcaahwyibclvxbgtn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcnBjYWFod3lpYmNsdnhiZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NjYzMzcsImV4cCI6MjA0NjQ0MjMzN30.o2MYC5WDMR8CjAj5iCPGVs0eWLPXgF6YHbqJ-jnZcXM';

// Create Supabase client with auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Enhanced Supabase Auth Service
export const supabaseAuthService = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata: { firstName: string; lastName: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            full_name: `${metadata.firstName} ${metadata.lastName}`
          }
        }
      });

      if (error) {
        console.error('❌ Supabase signup error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ User signed up successfully:', data.user?.email);

      return {
        success: true,
        user: this.formatUser(data.user),
        session: data.session
      };

    } catch (error: any) {
      console.error('❌ Signup error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase signin error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ User signed in successfully:', data.user?.email);

      return {
        success: true,
        user: this.formatUser(data.user),
        session: data.session
      };

    } catch (error: any) {
      console.error('❌ Signin error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Google OAuth initiated');

      return {
        success: true,
        data
      };

    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
      return {
        success: false,
        error: 'Google authentication failed'
      };
    }
  },

  /**
   * Sign out user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Signout error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ User signed out successfully');

      return {
        success: true
      };

    } catch (error: any) {
      console.error('❌ Signout error:', error);
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  },

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session error:', error);
        return { session: null, user: null };
      }

      return {
        session,
        user: session?.user ? this.formatUser(session.user) : null
      };

    } catch (error: any) {
      console.error('❌ Session error:', error);
      return { session: null, user: null };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Get user error:', error);
        return { user: null };
      }

      return {
        user: user ? this.formatUser(user) : null
      };

    } catch (error: any) {
      console.error('❌ Get user error:', error);
      return { user: null };
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Format user data consistently
   */
  formatUser(user: any) {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || '',
      lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      emailVerified: user.email_confirmed_at ? true : false,
      createdAt: user.created_at
    };
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('❌ Reset password error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Reset password email sent');

      return {
        success: true
      };

    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      return {
        success: false,
        error: 'Reset password failed'
      };
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Update password error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Password updated successfully');

      return {
        success: true
      };

    } catch (error: any) {
      console.error('❌ Update password error:', error);
      return {
        success: false,
        error: 'Password update failed'
      };
    }
  }
};

export default supabaseAuthService;