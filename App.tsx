import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, LogOut, Menu, X, Eye, Edit3, Languages, ArrowRight } from 'lucide-react';
import SmartParticles from './components/visuals/SmartParticles';
import CardPreview from './components/preview/CardPreview';
import CardEditor from './components/editor/CardEditor';
import Dashboard from './components/dashboard/Dashboard';
import ShareModal from './components/modals/ShareModal';
import PricingModal from './components/modals/PricingModal';
import LandingPage from './components/layout/LandingPage';
import LoginPage from './components/auth/LoginPage';
import { DigitalCard, Language, ViewState } from './types';
import { getStoredCards, saveCardToStorage, deleteCardFromStorage, createNewCardTemplate } from './services/storageService';
import { translations } from './lib/i18n';
import { generateProfileUrl, generateUserSlug } from './lib/urlUtils';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  // --- AUTH STATE ---
  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth();

  // --- VIEW STATE ---
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  
  // Data State
  const [cards, setCards] = useState<DigitalCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardToUpgrade, setCardToUpgrade] = useState<DigitalCard | null>(null);
  const [language, setLanguage] = useState<Language>('es');

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Analytics State
  const [analyticsMode, setAnalyticsMode] = useState<'global' | 'individual'>('global');
  const [selectedAnalyticsCardId, setSelectedAnalyticsCardId] = useState<string | null>(null);

  // Track whether current card was loaded from external URL
  const [isExternalCard, setIsExternalCard] = useState(false);

  // Derived State
  const activeCard = cards.find(c => c.id === selectedCardId) || null;
  const t = translations[language].nav;

  // Function to fetch card from backend if not found locally
  const fetchCardFromBackend = async (cardId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards/${cardId}/public`);
      if (response.ok) {
        const card = await response.json();
        setCards(prev => [...(prev || []).filter(c => c.id !== cardId), card]);
        setSelectedCardId(cardId);
        setCurrentView('live');
        setIsExternalCard(true); // Mark as external card
      } else {
        console.error('Card not found:', cardId);
        // Redirect to 404 or landing page
        setCurrentView('landing');
      }
    } catch (error) {
      console.error('Error fetching card:', error);
      setCurrentView('landing');
    }
  };

  // Function to fetch card by slug from backend
  const fetchCardBySlug = async (slug: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards/by-slug/${slug}`);
      if (response.ok) {
        const card = await response.json();
        setCards(prev => [...(prev || []).filter(c => c.id !== card.id), card]);
        setSelectedCardId(card.id);
        setCurrentView('live');
        setIsExternalCard(true); // Mark as external card
      } else {
        console.error('Card not found by slug:', slug);
        // Redirect to 404 or landing page
        setCurrentView('landing');
      }
    } catch (error) {
      console.error('Error fetching card by slug:', error);
      setCurrentView('landing');
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    // Load cards from backend
    const loadCardsFromBackend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`);
        if (response.ok) {
          const backendCards = await response.json();
          setCards(backendCards);
        } else {
          console.error('Failed to load cards from backend');
          // Fallback to localStorage only if backend fails
          const storedCards = getStoredCards();
          setCards(storedCards);
        }
      } catch (error) {
        console.error('Error loading cards from backend:', error);
        // Fallback to localStorage if backend is not available
        const storedCards = getStoredCards();
        setCards(storedCards);
      }
    };

    loadCardsFromBackend();

    // Enhanced URL Routing System
    const checkRouting = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      // Support both new and legacy URL formats
      // New format: /card/[id] or /u/[username]
      // Legacy format: ?shareId=[id]

      let cardId = null;

      // Check new path-based routing
      if (path.startsWith('/card/')) {
        cardId = path.split('/card/')[1];
      } else if (path.startsWith('/u/')) {
        const username = path.split('/u/')[1];
        // First, try to find card locally using proper slug generation
        const cardByUsername = cards.find(c =>
          generateUserSlug(c.firstName || '', c.lastName || '') === username
        );
        if (cardByUsername) {
          cardId = cardByUsername.id;
        } else {
          // If not found locally, fetch from backend by slug
          fetchCardBySlug(username);
          return; // Exit early since fetchCardBySlug handles the rest
        }
      }
      // Fallback to legacy query param routing
      else {
        cardId = params.get('shareId');
        const view = params.get('view');

        if (!cardId && view === 'live' && cards.length > 0) {
          // Fallback demo
          cardId = cards[0].id;
        }
      }

      if (cardId) {
        // Check both localStorage and potentially Supabase
        let sharedCard = cards.find(c => c.id === cardId);

        if (sharedCard) {
          setSelectedCardId(sharedCard.id);
          setCurrentView('live');
          setIsExternalCard(false); // It's user's own card

          // Update URL to clean format if using legacy
          if (window.location.search.includes('shareId')) {
            const newUrl = `/card/${cardId}`;
            window.history.replaceState({}, '', newUrl);
          }
        } else {
          // If not found in localStorage, try to fetch from backend
          fetchCardFromBackend(cardId);
        }
      }
    };

    checkRouting();

    // Handle browser back/forward navigation
    const handlePopState = () => {
      checkRouting();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-redirect based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && (currentView === 'landing' || currentView === 'auth')) {
        console.log('🔄 User authenticated, redirecting to dashboard');
        // Always go to dashboard, don't create cards automatically
        setCurrentView('dashboard');
      } else if (!isAuthenticated && (currentView === 'dashboard' || currentView === 'editor')) {
        console.log('🔄 User not authenticated, redirecting to landing');
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, authLoading, currentView]);

  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (user: any) => {
    console.log('✅ Login successful:', user);

    // Always go to dashboard after login
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        console.log('✅ Logout successful');
        setCurrentView('landing');
        setIsMobileMenuOpen(false);
      } else {
        console.error('❌ Logout error:', result.error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // --- NAVIGATION HANDLERS ---
  const handleCreateCard = () => {
    const newCard = createNewCardTemplate();
    // NO guardar en storage todavía - solo crear plantilla temporal
    setCards(prev => [...prev, { ...newCard, isTemporary: true }]);
    setSelectedCardId(newCard.id);
    setCurrentView('editor');
  };

  const handleEditCard = (card: DigitalCard) => {
    setSelectedCardId(card.id);
    setCurrentView('editor');
  };

  const handleDeleteCard = async (id: string) => {
    if (!id) return;

    try {
      // Delete from backend first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to delete card from backend');
        return; // Don't delete locally if backend fails
      }

      // If backend deletion successful, delete from localStorage
      const updatedCards = deleteCardFromStorage(id);
      setCards([...updatedCards]); // Force refresh

      // Reset view if deleted card was selected
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setCurrentView('dashboard');
      }

      console.log('Card deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting card:', error);
      // Optionally show user feedback here
    }
  };

  const handleViewLive = (card: DigitalCard) => {
    setSelectedCardId(card.id);
    setCurrentView('live');
    setIsExternalCard(false); // Reset external flag for owned cards

    // Update URL for live view using proper URL generation
    const fullUrl = generateProfileUrl(card.firstName || '', card.lastName || '', card.id);
    const newUrl = fullUrl.replace(window.location.origin, '');

    window.history.pushState({}, '', newUrl);
  };

  // Helper function to generate shareable URLs
  const generateShareableUrl = (card: DigitalCard): string => {
    return generateProfileUrl(card.firstName || '', card.lastName || '', card.id);
  };

  // Check if current user is the owner of the active card
  const isCardOwner = (card: DigitalCard | null): boolean => {
    if (!card || !isAuthenticated || !user) return false;

    // If card was loaded from external URL, it's definitely not owned by current user
    if (isExternalCard) return false;

    // Check if card exists in user's stored cards (means they own it)
    const userCards = getStoredCards();
    const isOwnCard = userCards.some(c => c.id === card.id);

    return isOwnCard;
  };

  const handleGoToDashboard = () => {
    // Limpiar tarjetas temporales no publicadas al regresar al dashboard
    setCards(prev => (prev || []).filter(card => !card.isTemporary));
    setSelectedCardId(null);
    setCurrentView('dashboard');
    setIsMobileMenuOpen(false);
    setIsExternalCard(false); // Reset external flag

    // Clean URL when going back to dashboard
    window.history.pushState({}, '', '/');
  };

  const handleGoToEditor = () => {
    if (!selectedCardId && cards.length > 0) {
        setSelectedCardId(cards[0].id);
    } else if (cards.length === 0) {
        // No cards available, show message or stay in dashboard
        console.log('No cards available to edit. User must create one first.');
        return;
    }
    setCurrentView('editor');
    setIsMobileMenuOpen(false);
  };

  // --- EDITOR HANDLERS ---
  const handleSaveCard = async (cardToSave: DigitalCard) => {
    setCards(prev => prev.map(c => c.id === cardToSave.id ? cardToSave : c));

    // Solo guardar en backend si NO es temporal
    if (!cardToSave.isTemporary) {
      try {
        // Check if card exists (for updates vs creation)
        const existingCard = cards.find(c => c.id === cardToSave.id);

        if (existingCard && !existingCard.isNew && !existingCard.isTemporary) {
          // Update existing card (PUT) - only if it exists in backend
          const response = await fetch(`${import.meta.env.VITE_API_URL}/cards/${cardToSave.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardToSave)
          });

          if (!response.ok) {
            console.error('Failed to update card in backend');
            // If PUT fails, try POST instead (card might not exist in backend)
            const postResponse = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({...cardToSave, isNew: false})
            });

            if (postResponse.ok) {
              const savedCard = await postResponse.json();
              setCards(prev => prev.map(c => c.id === cardToSave.id ? savedCard : c));
            }
          }
        } else {
          // Create new card (POST)
          const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({...cardToSave, isNew: false})
          });

          if (response.ok) {
            const savedCard = await response.json();
            // Update local state with backend response
            setCards(prev => prev.map(c => c.id === cardToSave.id ? savedCard : c));
          } else {
            console.error('Failed to save card to backend');
          }
        }

        // Also save to localStorage as fallback
        saveCardToStorage(cardToSave);
      } catch (error) {
        console.error('Error saving card:', error);
        // Fallback to localStorage only
        saveCardToStorage(cardToSave);
      }
    }
  };

  const handlePublish = () => {
    if (!activeCard) {
      console.error('No active card to publish');
      return;
    }
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);

      // Generate clean, professional URLs with proper character normalization
      const publishedUrl = generateProfileUrl(
        activeCard.firstName || '',
        activeCard.lastName || '',
        activeCard.id
      );

      const publishedCard = { ...activeCard, isPublished: true, publishedUrl, isTemporary: false };

      // Always save to backend whether it's new or existing
      handleSaveCard(publishedCard);

      setShowShareModal(true);
    }, 1500);
  };

  // --- BUSINESS LOGIC HANDLERS ---
  const handleUpgradeClick = (card: DigitalCard) => {
    setCardToUpgrade(card);
    setShowPricingModal(true);
  };

  const handleUpgradeSuccess = () => {
    if (cardToUpgrade) {
      const upgradedCard: DigitalCard = { ...cardToUpgrade, subscriptionStatus: 'active', planType: 'pro' };
      handleSaveCard(upgradedCard);
    }
    setShowPricingModal(false);
    setCardToUpgrade(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  // --- RENDER VIEWS ---

  // 1. LIVE VIEW (Public - No Shell)
  if (currentView === 'live') {
    return (
      <div className="min-h-screen bg-black">
        <CardPreview card={activeCard} mode="live" language={language} />

        {/* Show edit buttons only for card owners */}
        {isCardOwner(activeCard) && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <button onClick={() => setCurrentView('editor')} className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white font-medium hover:bg-slate-800 transition-all">
               <Edit3 size={18} />
               <span>{language === 'es' ? 'Editar Tarjeta' : 'Edit Card'}</span>
            </button>
            <button onClick={handleGoToDashboard} className="flex items-center justify-center w-12 h-12 bg-black/50 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white hover:bg-slate-900 transition-all">
               <LayoutDashboard size={18} />
            </button>
          </div>
        )}

        {/* Show branding and CTA for external visitors */}
        {!isCardOwner(activeCard) && (
          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
            {/* Branding */}
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-slate-700/50 rounded-full text-slate-300 text-sm">
              <span className="font-semibold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">INDI</span>
              <span className="text-slate-500">Digital Card</span>
            </div>

            {/* Call to Action */}
            <button
              onClick={() => {
                setCurrentView('landing');
                window.history.pushState({}, '', '/');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 rounded-full text-white text-sm font-medium hover:bg-emerald-500 transition-all shadow-lg"
            >
              <span>Crear mi tarjeta</span>
              <span className="text-xs">→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. AUTH VIEW (Login Page)
  if (currentView === 'auth') {
    return <LoginPage language={language} onLoginSuccess={handleLoginSuccess} />;
  }

  // --- APP SHELL (Navbar + Content) ---
  // Theme color for particles
  const themeColor = activeCard?.themeConfig?.brandColor || '#10b981';
  // Determine if we should show logged-in navigation
  const showAppNav = isAuthenticated && ['dashboard', 'editor'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans flex flex-col">
      
      <SmartParticles color={themeColor} intensity="subtle" />

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full h-24 z-50 flex items-center justify-between px-6 lg:px-12 transition-all ${currentView === 'landing' ? 'bg-transparent' : 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800'}`}>
        
        {/* Logo */}
        <div className="flex items-center cursor-pointer group" onClick={() => { if(isAuthenticated) handleGoToDashboard(); else setCurrentView('landing'); }}>
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
                onClick={handleGoToDashboard}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-sm font-bold tracking-wide border ${currentView === 'dashboard' ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'text-slate-400 border-transparent hover:bg-slate-800/50'}`}
              >
                <LayoutDashboard size={18} /> {t.dashboard}
              </button>
              <div className="h-8 w-px bg-slate-800"></div>
            </>
          )}

          {/* Landing Links (If NOT logged in) */}
          {!isAuthenticated && currentView === 'landing' && (
             <button onClick={() => setCurrentView('auth')} className="text-slate-300 hover:text-white font-medium text-sm transition-colors">
                {t.login}
             </button>
          )}

          {/* Language Toggle */}
          <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            <Languages size={16} /> {language}
          </button>

          {/* CTA / Profile */}
          {isAuthenticated ? (
             <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-sm hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all text-sm font-semibold text-slate-200">
               <LogOut size={16} />
               <span className="truncate max-w-[100px]">{t.logout}</span>
             </button>
          ) : (
             currentView === 'landing' && (
                <button onClick={() => setCurrentView('auth')} className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 transition-colors flex items-center gap-2">
                   {t.getStarted} <ArrowRight size={16} />
                </button>
             )
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button className="p-2 text-slate-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-24 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 z-40 p-6 md:hidden animate-fade-in flex flex-col gap-4 shadow-2xl">
           {!isAuthenticated ? (
              <button onClick={() => setCurrentView('auth')} className="w-full py-4 rounded-xl bg-emerald-500 text-slate-900 font-bold">{t.login}</button>
           ) : (
              <>
                <button onClick={handleGoToDashboard} className="flex items-center gap-3 px-4 py-4 rounded-xl bg-slate-800 text-white font-bold"><LayoutDashboard size={24} /> {t.dashboard}</button>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-4 rounded-xl text-red-400 font-bold"><LogOut size={24} /> {t.logout}</button>
              </>
           )}
           <button onClick={toggleLanguage} className="w-full py-3 border border-slate-700 rounded-xl text-slate-300 font-bold uppercase">{language}</button>
        </div>
      )}

      {/* CONTENT AREA */}
      <main className={`flex-1 flex flex-col ${currentView === 'landing' ? 'pt-0' : 'pt-32 pb-12 px-6 h-screen'}`}>
        
        {currentView === 'landing' && (
           <LandingPage language={language} onStart={() => setCurrentView('auth')} onLogin={() => setCurrentView('auth')} />
        )}

        {currentView === 'editor' && (
          <>
            {activeCard ? (
              <div className="flex flex-col md:flex-row gap-8 h-full max-w-[1600px] mx-auto w-full animate-slide-up">
                <div className="flex-1 min-w-0 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center md:hidden">
                      <h2 className="text-sm font-semibold text-white">Editor</h2>
                      <button onClick={() => setShowMobilePreview(true)} className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-xs border border-emerald-600/30">
                        <Eye size={12} /> Preview
                      </button>
                  </div>
                  <CardEditor
                    card={activeCard}
                    setCard={(updater) => { const updated = typeof updater === 'function' ? updater(activeCard) : updater; handleSaveCard(updated); }}
                    onPublish={handlePublish}
                    isPublishing={isPublishing}
                    language={language}
                  />
                </div>
                <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800/50">
                  <CardPreview card={activeCard} scale={1.0} mode="preview" language={language} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 max-w-md">
                  <h2 className="text-xl font-semibold text-white mb-4">No hay tarjetas para editar</h2>
                  <p className="text-slate-400 mb-6">Crea tu primera tarjeta digital para comenzar</p>
                  <button
                    onClick={handleCreateCard}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Crear Mi Primera Tarjeta
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'dashboard' && (
           <div className="w-full h-full overflow-y-auto scrollbar-hide animate-fade-in">
             <Dashboard
               cards={(cards || []).filter(card => !card.isTemporary)}
               onCreateNew={handleCreateCard}
               onEdit={handleEditCard}
               onDelete={handleDeleteCard}
               onViewLive={handleViewLive}
               onUpgrade={handleUpgradeClick}
               language={language}
               analyticsMode={analyticsMode}
               onAnalyticsModeChange={setAnalyticsMode}
               selectedAnalyticsCardId={selectedAnalyticsCardId}
               onAnalyticsCardSelect={setSelectedAnalyticsCardId}
             />
           </div>
        )}
      </main>

      {/* MODALS & OVERLAYS */}
      {showMobilePreview && currentView === 'editor' && activeCard && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 lg:hidden">
          <div className="absolute top-4 right-4 z-50"><button onClick={() => setShowMobilePreview(false)} className="p-3 bg-slate-800 rounded-full text-white border border-slate-700"><X size={24} /></button></div>
          <div className="scale-[0.85]"><CardPreview card={activeCard} mode="preview" language={language} /></div>
        </div>
      )}

      {showShareModal && <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} url={activeCard ? generateShareableUrl(activeCard) : ''} onOpenLive={() => { setShowShareModal(false); setCurrentView('live'); }} language={language} />}
      {showPricingModal && <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onSuccess={handleUpgradeSuccess} language={language} />}

    </div>
  );
}

// Main App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;