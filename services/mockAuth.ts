/**
 * Mock Authentication Service for Demo Mode
 * Simulates real authentication without external dependencies
 */

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  user?: MockUser;
  session?: any;
}

// Demo users for testing
const DEMO_USERS: MockUser[] = [
  {
    id: 'demo-user-1',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    fullName: 'Demo User',
    emailVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-user-2',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    emailVerified: true,
    createdAt: new Date().toISOString()
  }
];

// Simple session storage for demo
let currentSession: { user: MockUser; token: string } | null = null;
let authStateCallbacks: ((event: string, session: any) => void)[] = [];

// Helper to notify auth state changes
const notifyAuthStateChange = (event: string, session: any) => {
  authStateCallbacks.forEach(callback => callback(event, session));
};

/**
 * Mock Authentication Service
 */
export const mockAuthService = {
  /**
   * Mock sign up
   */
  async signUp(email: string, password: string, metadata: { firstName: string; lastName: string }): Promise<AuthResponse> {
    console.log('🎭 [DEMO] Mock signUp:', email);

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    // Check if user already exists
    const existingUser = DEMO_USERS.find(user => user.email === email);
    if (existingUser) {
      return {
        success: false,
        error: 'User already exists'
      };
    }

    const newUser: MockUser = {
      id: `demo-user-${Date.now()}`,
      email,
      firstName: metadata.firstName,
      lastName: metadata.lastName,
      fullName: `${metadata.firstName} ${metadata.lastName}`,
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    DEMO_USERS.push(newUser);

    const mockSession = {
      user: newUser,
      token: `mock-token-${Date.now()}`
    };

    currentSession = mockSession;
    localStorage.setItem('demo-session', JSON.stringify(mockSession));

    return {
      success: true,
      user: newUser,
      session: mockSession
    };
  },

  /**
   * Mock sign in
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    console.log('🎭 [DEMO] Mock signIn:', email);

    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    // Find user
    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    // For demo, any password works except empty
    if (!password || password.length < 1) {
      return {
        success: false,
        error: 'Password required'
      };
    }

    const mockSession = {
      user,
      token: `mock-token-${Date.now()}`
    };

    currentSession = mockSession;
    localStorage.setItem('demo-session', JSON.stringify(mockSession));

    // Notify auth state change
    setTimeout(() => {
      notifyAuthStateChange('SIGNED_IN', mockSession);
    }, 10);

    return {
      success: true,
      user,
      session: mockSession
    };
  },

  /**
   * Mock Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    console.log('🎭 [DEMO] Mock Google OAuth');

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate OAuth flow

    const googleUser: MockUser = {
      id: `google-demo-${Date.now()}`,
      email: 'google.demo@example.com',
      firstName: 'Google',
      lastName: 'Demo',
      fullName: 'Google Demo User',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=150&h=150&q=80',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    const mockSession = {
      user: googleUser,
      token: `google-mock-token-${Date.now()}`
    };

    currentSession = mockSession;
    localStorage.setItem('demo-session', JSON.stringify(mockSession));

    return {
      success: true,
      user: googleUser,
      session: mockSession
    };
  },

  /**
   * Mock sign out
   */
  async signOut(): Promise<AuthResponse> {
    console.log('🎭 [DEMO] Mock signOut');

    await new Promise(resolve => setTimeout(resolve, 300));

    currentSession = null;
    localStorage.removeItem('demo-session');

    // Notify auth state change
    setTimeout(() => {
      notifyAuthStateChange('SIGNED_OUT', null);
    }, 10);

    return {
      success: true
    };
  },

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<{ session: any; user: MockUser | null }> {
    const storedSession = localStorage.getItem('demo-session');

    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        currentSession = session;
        console.log('🎭 [DEMO] Restored session:', session.user?.email);
        return {
          session,
          user: session.user
        };
      } catch (error) {
        console.error('🎭 [DEMO] Error parsing stored session:', error);
        localStorage.removeItem('demo-session');
      }
    }

    return {
      session: null,
      user: null
    };
  },

  /**
   * Auth state change listener (mock)
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    console.log('🎭 [DEMO] Setting up auth state listener');

    // Add callback to global list
    authStateCallbacks.push(callback);

    // Mock subscription
    const subscription = {
      unsubscribe: () => {
        console.log('🎭 [DEMO] Auth listener unsubscribed');
        // Remove callback from global list
        const index = authStateCallbacks.indexOf(callback);
        if (index > -1) {
          authStateCallbacks.splice(index, 1);
        }
      }
    };

    // Check for existing session on setup
    setTimeout(() => {
      if (currentSession) {
        callback('SIGNED_IN', currentSession);
      } else {
        callback('SIGNED_OUT', null);
      }
    }, 100);

    return { data: { subscription } };
  },

  /**
   * Reset password (mock)
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    console.log('🎭 [DEMO] Mock reset password for:', email);

    await new Promise(resolve => setTimeout(resolve, 500));

    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true
    };
  },

  /**
   * Format user (mock)
   */
  formatUser(user: any): MockUser | null {
    if (!user) return null;
    return user as MockUser;
  }
};