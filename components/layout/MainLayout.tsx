import React, { useState } from 'react';
import { LayoutDashboard, LogOut, Menu, X, Languages, ArrowRight, User } from 'lucide-react';
import SmartParticles from '../visuals/SmartParticles';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: string;
    isAuthenticated: boolean;
    language: 'es' | 'en';
    onNavigate: (view: string) => void;
    onLogout: () => void;
    onToggleLanguage: () => void;
    userEmail?: string;
    themeColor?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    currentView,
    isAuthenticated,
    language,
    onNavigate,
    onLogout,
    onToggleLanguage,
    userEmail,
    themeColor = '#10b981'
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const t = {
        logout: language === 'es' ? 'Cerrar Sesión' : 'Sign Out',
        login: language === 'es' ? 'Iniciar Sesión' : 'Sign In',
        dashboard: language === 'es' ? 'Panel' : 'Dashboard',
        getStarted: language === 'es' ? 'Comenzar Gratis' : 'Get Started Free',
    };

    const showAppNav = isAuthenticated && ['dashboard', 'editor'].includes(currentView);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans flex flex-col">
            <SmartParticles color={themeColor} intensity="subtle" />

            {/* NAVBAR */}
            <nav className={`fixed top-0 w-full h-24 z-50 flex items-center justify-between px-6 lg:px-12 transition-all ${currentView === 'landing' ? 'bg-transparent' : 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800'}`}>

                {/* Logo */}
                <div className="flex items-center cursor-pointer group" onClick={() => { if (isAuthenticated) onNavigate('dashboard'); else onNavigate('landing'); }}>
                    <span className="font-black text-5xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-lg hover:opacity-90 transition-opacity pb-1">
                        INDI
                    </span>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-6">

                    {/* App Links (Only if logged in) */}
                    {showAppNav && (
                        <>
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-sm font-bold tracking-wide border ${currentView === 'dashboard' ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
                            >
                                <LayoutDashboard size={18} /> {t.dashboard}
                            </button>
                            <div className="h-8 w-px bg-slate-800"></div>
                        </>
                    )}

                    {/* Landing Links (If NOT logged in) */}
                    {!isAuthenticated && currentView === 'landing' && (
                        <button onClick={() => onNavigate('auth')} className="text-slate-300 hover:text-white font-medium text-sm transition-colors">
                            {t.login}
                        </button>
                    )}

                    {/* Language Toggle */}
                    <button onClick={onToggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                        <Languages size={16} /> {language}
                    </button>

                    {/* CTA / Profile */}
                    {isAuthenticated ? (
                        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-sm hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all text-sm font-semibold text-slate-200">
                            <LogOut size={16} />
                            <span className="truncate max-w-[100px]">{t.logout}</span>
                        </button>
                    ) : (
                        currentView === 'landing' && (
                            <button onClick={() => onNavigate('auth')} className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 transition-colors flex items-center gap-2">
                                {t.getStarted} <ArrowRight size={16} />
                            </button>
                        )
                    )}
                </div>

                {/* Mobile Toggle */}
                <div className="flex items-center gap-4 md:hidden">
                    <button
                        className="p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all min-h-[48px] min-w-[48px] touch-manipulation active:scale-95"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="fixed top-24 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800 z-50 p-6 md:hidden animate-fade-in shadow-2xl">
                        <div className="flex flex-col gap-4 max-w-sm mx-auto">
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => { onNavigate('auth'); setIsMobileMenuOpen(false); }}
                                    className="w-full py-4 rounded-xl bg-emerald-500 text-slate-900 font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-transform"
                                >
                                    {t.login}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { onNavigate('dashboard'); setIsMobileMenuOpen(false); }}
                                        className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-transform hover:bg-slate-700"
                                    >
                                        <LayoutDashboard size={24} /> {t.dashboard}
                                    </button>
                                    <button
                                        onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                        className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-red-900/20 border-2 border-red-800/50 text-red-400 font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-all hover:bg-red-900/40 hover:border-red-700"
                                    >
                                        <LogOut size={24} /> {t.logout}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => { onToggleLanguage(); setIsMobileMenuOpen(false); }}
                                className="w-full py-3 border border-slate-700 rounded-xl text-slate-300 font-bold uppercase text-lg min-h-[52px] touch-manipulation active:scale-95 transition-transform hover:border-slate-600"
                            >
                                {language}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* CONTENT AREA */}
            <main className={`flex-1 flex flex-col ${currentView === 'landing' ? 'pt-0' : 'pt-32 pb-12 px-6 h-screen'}`}>
                {children}
            </main>
        </div>
    );
};
