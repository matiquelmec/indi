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

  // Derived State
  const activeCard = cards.find(c => c.id === selectedCardId) || null;
  const t = translations[language].nav;

  // --- EFFECTS ---
  useEffect(() => {
    // Load stored cards data
    const storedCards = getStoredCards();
    setCards(storedCards);

    // Check for Shared URL Parameters (Simulation of Routing)
    // ?shareId=12345
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    const view = params.get('view');

    if (shareId) {
       // In a real app, fetch from DB. Here we check local storage mock.
       const sharedCard = storedCards.find(c => c.id === shareId);
       if (sharedCard) {
         setSelectedCardId(sharedCard.id);
         setCurrentView('live');
       }
    } else if (view === 'live' && storedCards.length > 0) {
        // Fallback demo
        setSelectedCardId(storedCards[0].id);
        setCurrentView('live');
    }
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

  const handleDeleteCard = (id: string) => {
    if (!id) return;
    const updatedCards = deleteCardFromStorage(id);
    setCards([...updatedCards]); // Force refresh
    
    if (selectedCardId === id) {
      setSelectedCardId(null);
      setCurrentView('dashboard');
    }
  };

  const handleViewLive = (card: DigitalCard) => {
    setSelectedCardId(card.id);
    setCurrentView('live');
  };

  const handleGoToDashboard = () => {
    // Limpiar tarjetas temporales no publicadas al regresar al dashboard
    setCards(prev => prev.filter(card => !card.isTemporary));
    setSelectedCardId(null);
    setCurrentView('dashboard');
    setIsMobileMenuOpen(false);
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
  const handleSaveCard = (cardToSave: DigitalCard) => {
    setCards(prev => prev.map(c => c.id === cardToSave.id ? cardToSave : c));
    // Solo guardar en storage si NO es temporal
    if (!cardToSave.isTemporary) {
      saveCardToStorage(cardToSave);
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
      const uniqueId = Math.random().toString(36).substring(7);
      // Generate a link that works with our Query Param logic
      const publishedUrl = `${window.location.origin}/?shareId=${activeCard.id}`;
      const publishedCard = { ...activeCard, isPublished: true, publishedUrl, isTemporary: false };

      // Si es temporal, guardarlo por primera vez en storage
      if (activeCard.isTemporary) {
        const updatedCards = saveCardToStorage(publishedCard);
        setCards(updatedCards);
      } else {
        // Si ya existe, solo actualizarlo
        handleSaveCard(publishedCard);
      }

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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <button onClick={() => setCurrentView('editor')} className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white font-medium hover:bg-slate-800 transition-all">
               <Edit3 size={18} />
               <span>{language === 'es' ? 'Editar Tarjeta' : 'Edit Card'}</span>
            </button>
            <button onClick={handleGoToDashboard} className="flex items-center justify-center w-12 h-12 bg-black/50 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl text-white hover:bg-slate-900 transition-all">
               <LayoutDashboard size={18} />
            </button>
        </div>
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
             <Dashboard cards={cards.filter(card => !card.isTemporary)} onCreateNew={handleCreateCard} onEdit={handleEditCard} onDelete={handleDeleteCard} onViewLive={handleViewLive} onUpgrade={handleUpgradeClick} language={language} />
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

      {showShareModal && <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} url={activeCard?.publishedUrl || ''} onOpenLive={() => { setShowShareModal(false); setCurrentView('live'); }} language={language} />}
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