import React, { useState } from 'react';
import { Language } from '../../types';
import { translations } from '../../lib/i18n';
import { Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { INITIAL_CARD } from '../../constants';
import CardPreview from '../preview/CardPreview';
import { useAuth } from '../../contexts/AuthContext';

interface LoginPageProps {
  language: Language;
  onLoginSuccess: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ language, onLoginSuccess }) => {
  const t = translations[language].auth;
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();

  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const loading = authLoading || localLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError('');

    try {
      let result;

      if (isRegistering) {
        result = await signUp(email, password, firstName, lastName);
      } else {
        result = await signIn(email, password);
      }

      if (result.success) {
        console.log('✅ Auth success, user:', result.user);
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();

      if (!result.success) {
        setError(result.error || 'Google authentication failed');
        setLocalLoading(false);
      }
      // Note: If successful, the auth state change will handle the UI update
      // and loading state will be managed by the auth context
    } catch (error: any) {
      console.error('❌ Google auth error:', error);
      setError(error.message || 'Google authentication failed');
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          <div className="text-center lg:text-left">
             <div className="inline-block mb-6">
                <span className="font-black text-4xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg">
                  INDI
                </span>
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">{t.welcome}</h2>
             <p className="text-slate-400">{t.subtitle}</p>
          </div>

          <div className="space-y-4">
             <button
               onClick={handleGoogleLogin}
               disabled={loading}
               className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-70"
             >
                <div className="w-5 h-5 rounded-full border-2 border-slate-900/30 flex items-center justify-center text-[10px] font-bold">G</div>
                {loading && !error ? 'Connecting...' : t.googleBtn}
             </button>

             <button
               onClick={async () => {
                 setLocalLoading(true);
                 setError('');
                 try {
                   const result = await signIn('demo@indi.com', 'demo123');
                   if (result.success) {
                     onLoginSuccess(result.user);
                   } else {
                     setError(result.error || 'Demo login failed');
                   }
                 } catch (error: any) {
                   setError('Demo login error');
                 } finally {
                   setLocalLoading(false);
                 }
               }}
               disabled={loading}
               className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-70"
             >
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">🎭</div>
                {loading && !error ? 'Conectando...' : 'Ingreso Demo'}
             </button>

             <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-600 text-xs uppercase">Or</span>
                <div className="flex-grow border-t border-slate-800"></div>
             </div>

             {error && (
               <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                 {error}
               </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-5">
                {isRegistering && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300 ml-1">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300 ml-1">Last Name</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-300 ml-1">{t.emailLabel}</label>
                   <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 pl-10 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="hello@example.com"
                      />
                      <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-sm font-medium text-slate-300 ml-1">{t.passwordLabel}</label>
                   <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 pl-10 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                   </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isRegistering ? 'Creating Account...' : t.loggingIn}
                    </>
                  ) : (
                    <>
                      {isRegistering ? 'Create Account' : t.loginBtn} <ArrowRight size={18} />
                    </>
                  )}
                </button>
             </form>
          </div>

          <p className="text-center text-slate-500 text-sm">
             {isRegistering ? (
               <>Already have an account? <button onClick={() => setIsRegistering(false)} className="text-emerald-400 hover:underline font-medium">Sign In</button></>
             ) : (
               <>{t.noAccount} <button onClick={() => setIsRegistering(true)} className="text-emerald-400 hover:underline font-medium">{t.signUp}</button></>
             )}
          </p>

        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950"></div>
         
         <div className="relative z-10 scale-[0.85] origin-center opacity-90 hover:opacity-100 transition-opacity duration-500">
             <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full"></div>
             <CardPreview card={INITIAL_CARD} mode="preview" language={language} />
         </div>
      </div>
    </div>
  );
};

export default LoginPage;