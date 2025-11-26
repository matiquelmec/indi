/**
 * App Configuration Service
 * Determines whether to run in demo mode or real auth mode
 */

export type AppMode = 'demo' | 'real';

interface AppConfig {
  mode: AppMode;
  isDemoMode: boolean;
  isRealMode: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * Get current app mode based on environment and configuration
 */
export const getAppConfig = (): AppConfig => {
  const mode = import.meta.env.VITE_APP_MODE as AppMode || 'demo';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Auto-detect mode based on environment
  const actualMode: AppMode =
    mode === 'real' && supabaseUrl && supabaseAnonKey ? 'real' : 'demo';

  return {
    mode: actualMode,
    isDemoMode: actualMode === 'demo',
    isRealMode: actualMode === 'real',
    supabaseUrl: actualMode === 'real' ? supabaseUrl : undefined,
    supabaseAnonKey: actualMode === 'real' ? supabaseAnonKey : undefined
  };
};

export const appConfig = getAppConfig();

console.log('🔧 App Config:', {
  mode: appConfig.mode,
  hasSupabase: !!(appConfig.supabaseUrl && appConfig.supabaseAnonKey)
});