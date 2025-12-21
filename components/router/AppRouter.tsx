import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCardManager } from '../../hooks/useCardManager';
import { DigitalCard, Language, ViewState } from '../../types';
import { MainLayout } from '../layout/MainLayout';
import { NotFound } from './NotFound';
import LandingPage from '../layout/LandingPage';
import LoginPage from '../auth/LoginPage';
import Dashboard from '../dashboard/Dashboard';
import CardEditor from '../editor/CardEditor';
import CardPreview from '../preview/CardPreview';
import { ShareModal } from '../modals/ShareModal';
import { PricingModal } from '../modals/PricingModal';
import { Edit3, LayoutDashboard, Eye, X } from 'lucide-react';
// import { generateCardMetaTags, updateMetaTags } from '../../utils/metaTags'; // Keep if needed or handle in MainLayout? Sticky to logic here.
// Re-implementing simplified version of updateMetaTags if needed, or import.

export const AppRouter: React.FC = () => {
    // --- STATE ---
    const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
    const {
        cards,
        isSaving,
        lastSaveTime,
        createCard,
        saveCard,
        deleteCard,
        fetchCards,
        fetchCardBySlugOrId
    } = useCardManager();

    const [currentView, setCurrentView] = useState<ViewState | 'not-found'>('landing');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [themeId, setThemeId] = useState<string>('emerald');
    const [language, setLanguage] = useState<Language>('es');
    const [isExternalCard, setIsExternalCard] = useState(false);

    // UI State
    const [showShareModal, setShowShareModal] = useState(false);
    const [publishedCard, setPublishedCard] = useState<DigitalCard | null>(null);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const [analyticsMode, setAnalyticsMode] = useState(false);
    const [selectedAnalyticsCardId, setSelectedAnalyticsCardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const activeCard = cards.find(c => c.id === selectedCardId) || null;

    // --- EFFECT: Routing Logic ---
    useEffect(() => {
        const checkRouting = async () => {
            // 1. Check for Public/Shared Card URL
            const path = window.location.pathname;

            // Support: /card/:slug OR /u/:slug
            if (path.startsWith('/card/') || path.startsWith('/u/')) {
                const slugOrId = path.split('/').pop(); // Last segment
                if (slugOrId) {
                    setIsExternalCard(true);

                    // Try to find in loaded cards first
                    let card = cards.find(c => c.id === slugOrId || c.customSlug === slugOrId || c.slug === slugOrId);

                    if (!card) {
                        // Fetch if missing
                        card = await fetchCardBySlugOrId(slugOrId);
                    }

                    if (card) {
                        // Success: Show Live View
                        // If it's MY card and I am logged in, I might want to edit? 
                        // UX Decision: /card/ always shows live view. Editor is /editor/.
                        setSelectedCardId(card.id);
                        setCurrentView('live');
                    } else {
                        // Fail: 404
                        setCurrentView('not-found');
                    }
                }
                return;
            }

            // 2. Auth State Redirection
            if (!authLoading) {
                if (isAuthenticated) {
                    // Logged In -> Dashboard (unless explicitly on a different route)
                    if (currentView === 'landing' || currentView === 'auth') {
                        setCurrentView('dashboard');
                    }
                } else {
                    // Logged Out -> Landing (if on private route)
                    if (['dashboard', 'editor'].includes(currentView)) {
                        setCurrentView('landing');
                    }
                }
            }
        };

        checkRouting();
    }, [isAuthenticated, authLoading, cards.length]); // Re-run if auth changes

    // --- HANDLERS ---
    const handleNavigate = (view: string) => {
        // Simple View Switcher
        if (view === 'dashboard') {
            setSelectedCardId(null);
            setCurrentView('dashboard');
            window.history.pushState({}, '', '/dashboard');
        } else if (view === 'landing') {
            setCurrentView('landing');
            window.history.pushState({}, '', '/');
        } else if (view === 'auth') {
            setCurrentView('auth');
            window.history.pushState({}, '', '/login');
        }
    };

    const handleCreateCard = async () => {
        setIsRefreshing(true);
        try {
            const newCard = await createCard();
            if (newCard) {
                setSelectedCardId(newCard.id);
                setCurrentView('editor');
            }
        } catch (err) {
            setError('Error al crear la tarjeta');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleEditCard = (card: DigitalCard) => {
        setSelectedCardId(card.id);
        setCurrentView('editor');
    };

    const handleViewLive = (card: DigitalCard) => {
        const slug = card.customSlug || card.slug || card.id;
        window.open(`/card/${slug}`, '_blank');
    };

    const handlePublish = async (card: DigitalCard) => {
        // Logic to show share modal
        setPublishedCard(card);
        setShowShareModal(true);
    };

    // --- RENDER ---

    // 1. PUBLIC LIVE VIEW (No Shell)
    if (currentView === 'live' && activeCard) {
        return (
            <div className="min-h-screen bg-black relative">
                <CardPreview card={activeCard} mode="live" language={language} />

                {/* Floating Action for Owner */}
                {isAuthenticated && user?.email && activeCard.email === user.email && (
                    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                        <button onClick={() => setCurrentView('editor')} className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white font-medium hover:bg-slate-800 transition-all">
                            <Edit3 size={18} /> <span>Editar</span>
                        </button>
                        <button onClick={() => setCurrentView('dashboard')} className="flex items-center justify-center w-12 h-12 bg-black/50 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white hover:bg-slate-900 transition-all">
                            <LayoutDashboard size={18} />
                        </button>
                    </div>
                )}

                {/* Branding for Visitors */}
                {!isAuthenticated && (
                    <div className="fixed bottom-6 left-6 z-50">
                        <button onClick={() => setCurrentView('landing')} className="px-4 py-2 bg-black/40 backdrop-blur-md border border-slate-700/50 rounded-full text-slate-300 text-sm hover:text-white transition-colors">
                            INDI Digital Card
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // 2. 404 VIEW
    if (currentView === 'not-found') {
        return <NotFound onGoHome={() => handleNavigate('landing')} />;
    }

    // 3. AUTH VIEW
    if (currentView === 'auth') {
        return <LoginPage language={language} onLoginSuccess={() => setCurrentView('dashboard')} />;
    }

    // 4. MAIN LAYOUT (Dashboard / Editor / Landing)
    return (
        <MainLayout
            currentView={currentView}
            isAuthenticated={isAuthenticated}
            language={language}
            onNavigate={handleNavigate}
            onLogout={signOut}
            onToggleLanguage={() => setLanguage(l => l === 'es' ? 'en' : 'es')}
            userEmail={user?.email}
            themeColor={activeCard?.themeConfig?.brandColor}
        >
            {currentView === 'landing' && <LandingPage language={language} onStart={() => setCurrentView('auth')} onLogin={() => setCurrentView('auth')} />}

            {currentView === 'dashboard' && (
                <div className="w-full h-full overflow-y-auto scrollbar-hide animate-fade-in">
                    <Dashboard
                        cards={cards}
                        onCreateNew={handleCreateCard}
                        onEdit={handleEditCard}
                        onDelete={deleteCard}
                        onViewLive={handleViewLive}
                        onUpgrade={() => setShowPricingModal(true)}
                        language={language}
                        analyticsMode={analyticsMode}
                        onAnalyticsModeChange={setAnalyticsMode}
                        selectedAnalyticsCardId={selectedAnalyticsCardId}
                        onAnalyticsCardSelect={setSelectedAnalyticsCardId}
                        isRefreshing={isRefreshing}
                        // Missing props defaulting
                        isDeleting={false}
                        deletingCardId={null}
                    />
                </div>
            )}

            {currentView === 'editor' && activeCard && (
                <div className="flex flex-col md:flex-row gap-8 h-full max-w-[1600px] mx-auto w-full animate-slide-up">
                    <div className="flex-1 min-w-0 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Editor Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center md:hidden">
                            <h2 className="text-sm font-semibold text-white">Editor</h2>
                            <button onClick={() => setShowMobilePreview(true)} className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-xs border border-emerald-600/30">
                                <Eye size={12} /> Preview
                            </button>
                        </div>

                        <CardEditor
                            card={activeCard}
                            setCard={(updated) => saveCard(updated as DigitalCard)}
                            onPublish={() => handlePublish(activeCard)}
                            isPublishing={false} // Managed by useCardManager implicitly via save
                            language={language}
                        />
                    </div>

                    {/* PC Preview */}
                    <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800/50">
                        <CardPreview card={activeCard} scale={1.0} mode="preview" language={language} />
                    </div>
                </div>
            )}

            {/* Global Modals */}
            {showShareModal && publishedCard && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    url={`${window.location.origin}/card/${publishedCard.customSlug || publishedCard.slug || publishedCard.id}`}
                    card={publishedCard}
                    language={language}
                    onOpenLive={() => window.open(`/card/${publishedCard.customSlug || publishedCard.slug || publishedCard.id}`, '_blank')}
                />
            )}

            {showPricingModal && <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onSuccess={() => { }} language={language} />}

            {/* Mobile Preview Modal */}
            {showMobilePreview && activeCard && (
                <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 lg:hidden">
                    <div className="absolute top-4 right-4 z-50"><button onClick={() => setShowMobilePreview(false)} className="p-3 bg-slate-800 rounded-full text-white border border-slate-700"><X size={24} /></button></div>
                    <div className="scale-[0.85]"><CardPreview card={activeCard} mode="preview" language={language} /></div>
                </div>
            )}

            {/* Loading/Error Overlays */}
            {isRefreshing && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in">
                    <div className="bg-slate-800/95 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-600/50 flex items-center gap-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                        <span>Procesando...</span>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};
