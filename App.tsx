import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { generateUserSlug } from './lib/urlUtils';
import { authService } from './services/unifiedAuth'; // Added import
import { AuthProvider, useAuth } from './contexts/AuthContext';
// New routing system (overlay mode)
import { useAuthRouter } from './hooks/useRouter';
import { getUserSlug } from './lib/userUtils';
import { useCardManager } from './hooks/useCardManager'; // Added hook
// Meta tags for modern social sharing
import { generateCardMetaTags, updateMetaTags } from './utils/metaTags';

function AppContent() {
  // --- AUTH STATE ---
  const { user, session, isAuthenticated, signOut, loading: authLoading } = useAuth();

  // New routing system (overlay mode - gradual migration)
  // const { navigate } = useAuthRouter(isAuthenticated, user); // DISABLED for now

  // Helper functions for user-specific routing (ACTIVE)
  const getUserDashboardUrl = (user: any): string => {
    if (!user?.email) return '/dashboard'; // fallback
    const userSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `/${userSlug}/dashboard`;
  };

  const getUserEditorUrl = (user: any, cardId?: string): string => {
    if (!user?.email) return cardId ? `/editor/${cardId}` : '/editor'; // fallback
    const userSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    return cardId ? `/${userSlug}/editor/${cardId}` : `/${userSlug}/editor`;
  };

  // --- VIEW STATE ---
  // Smart initial view: detect external cards to avoid dashboard flash
  const getInitialView = (): ViewState => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/card/') || path.startsWith('/u/')) {
        return 'live'; // Start directly in live view for external cards
      }
    }
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());

  // Data State - MIGRATED TO HOOK
  const {
    cards,
    setCards,
    isSaving,
    lastSaveTime,
    createCard,
    saveCard,
    deleteCard,
    fetchCards,
    fetchCardBySlugOrId
  } = useCardManager();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardToUpgrade, setCardToUpgrade] = useState<DigitalCard | null>(null);
  const [language, setLanguage] = useState<Language>('es');

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [publishedCard, setPublishedCard] = useState<DigitalCard | null>(null);

  // Auto-save State (managed by hook now) & Refs
  // const [isSaving, setIsSaving] = useState(false); 
  // const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  // const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // const pendingCardRef = useRef<DigitalCard | null>(null);

  // 🚀 ROBUST STATE: Loading and error handling
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analytics State
  const [analyticsMode, setAnalyticsMode] = useState<'global' | 'individual'>('global');
  const [selectedAnalyticsCardId, setSelectedAnalyticsCardId] = useState<string | null>(null);

  // Track whether current card was loaded from external URL
  const [isExternalCard, setIsExternalCard] = useState(false);

  // Derived State
  const activeCard = cards.find(c => c.id === selectedCardId) || null;
  const t = translations[language].nav;

  // Function to fetch card from backend if not found locally
  const fetchCardFromBackend = async (cardIdOrSlug: string) => {
    const card = await fetchCardBySlugOrId(cardIdOrSlug);
    if (card) {
      // Only update if not already in list (avoid dupes/overwrite)
      setCards(prev => {
        if (prev.find(c => c.id === card.id)) return prev;
        return [...prev, card];
      });
      // Auto-select
      if (currentView === 'live' || currentView === 'editor') {
        setSelectedCardId(card.id);
      }

      // Handle external view for live cards
      if (currentView === 'live') {
        setIsExternalCard(true);

        // Update meta tags
        const baseUrl = window.location.origin;
        const metaTags = generateCardMetaTags(card, baseUrl);
        updateMetaTags(metaTags);
      }
    } else {
      // Not found
      if (currentView === 'live') {
        setCurrentView('landing');
      }
    }
  };

  // Duplicate fetchCardBySlug removed - functionality merged into fetchCardFromBackend and hook


  // 🚀 ROBUST DATA MANAGEMENT: Reusable fetch function with loading state
  const refetchCardsFromBackend = async () => {
    setIsRefreshing(true);
    try {
      // AUTH-SECURE FETCH
      const { session } = await authService.getCurrentSession();
      const token = session?.access_token || session?.token;

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('🔄 Refetching cards from backend...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cards`, {
        headers
      });

      if (response.ok) {
        const backendCards = await response.json();
        setCards(backendCards);
        console.log('✅ Cards refreshed:', backendCards.length, 'cards loaded');
        return backendCards;
      } else {
        console.error('Failed to refetch cards from backend:', response.status);
        // Fallback to localStorage only if backend fails
        const storedCards = getStoredCards();
        setCards(storedCards);
        return storedCards;
      }
    } catch (error) {
      console.error('Error refetching cards from backend:', error);
      // Fallback to localStorage if backend is not available
      const storedCards = getStoredCards();
      setCards(storedCards);
      return storedCards;
    } finally {
      setIsRefreshing(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    // Optimized loading: Only fetch all cards if NOT viewing external card
    const path = window.location.pathname;
    const isExternalCardView = path.startsWith('/card/') || path.startsWith('/u/');

    if (!isExternalCardView || isAuthenticated) {
      // Load cards from backend on initial mount (skip for external card views)
      refetchCardsFromBackend();
    }

    // Enhanced URL Routing System
    const checkRouting = async () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const pathSegments = path.split('/').filter(Boolean);

      console.log('🔍 Checking route:', path, 'segments:', pathSegments);

      // Early detection of external cards to prevent dashboard flash
      if (path.startsWith('/card/') || path.startsWith('/u/')) {
        setIsExternalCard(true);
        setCurrentView('live'); // Ensure we're in live view immediately
      }

      // NEW: Handle user-scoped administrative routes
      if (pathSegments.length >= 2) {
        const [userSlug, action, resourceId] = pathSegments;

        // Check if this matches current user's slug
        if (isAuthenticated && user) {
          const currentUserSlug = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

          if (userSlug === currentUserSlug) {
            console.log('📍 User-scoped route detected:', userSlug, action, resourceId);

            switch (action) {
              case 'dashboard':
                setCurrentView('dashboard');
                return;
              case 'editor':
                setCurrentView('editor');
                if (resourceId) {
                  // Load specific card for editing
                  setSelectedCardId(resourceId);
                  console.log('🎯 Setting card for editing:', resourceId);
                }
                return;
              case 'settings':
                // Future: handle settings routes
                console.log('⚙️ Settings route (not implemented)');
                return;
            }
          }
        }
      }

      // Support legacy and card viewing formats
      let cardId = null;

      // Check card viewing routes
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
          await fetchCardFromBackend(username);
          return; // Exit early since fetchCardFromBackend handles the rest
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
          // 🚀 ROBUST FIX: Attempt to fetch single card from public access (works for both ID and Slug)
          await fetchCardFromBackend(cardId);
          setSelectedCardId(cardId);
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
  }, [isAuthenticated, user]); // Updated dependencies for routing

  // Auto-redirect based on auth state
  useEffect(() => {
    if (!authLoading) {
      // Don't redirect if already viewing an external card
      if (currentView === 'live' && isExternalCard) {
        return; // Keep viewing external card
      }

      if (isAuthenticated && (currentView === 'landing' || currentView === 'auth')) {
        console.log('🔄 User authenticated, redirecting to dashboard');
        // Always go to dashboard, don't create cards automatically
        setCurrentView('dashboard');
      } else if (!isAuthenticated && (currentView === 'dashboard' || currentView === 'editor')) {
        console.log('🔄 User not authenticated, redirecting to landing');
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, authLoading, currentView, isExternalCard]);

  // Cleanup for hook-managed resources handles itself


  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (user: any) => {
    console.log('✅ Login successful:', user);

    // NEW: Generate user-specific dashboard URL
    const userDashboardUrl = getUserDashboardUrl(user);
    console.log('🔀 Redirecting to user dashboard:', userDashboardUrl);

    // Update the URL to user-specific path (e.g., /demo/dashboard for demo@indi.com)
    window.history.pushState({}, '', userDashboardUrl);

    // Keep existing view system for backward compatibility
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
  const handleCreateCard = async () => {
    // 1. Create persistent card via hook
    const newCard = await createCard();

    if (newCard) {
      // 2. Select it and switch view
      setSelectedCardId(newCard.id);
      setCurrentView('editor');

      // 3. Update URL
      if (isAuthenticated && user) {
        const userEditorUrl = getUserEditorUrl(user);
        window.history.pushState({}, '', userEditorUrl);
      }
    }
  };

  const handleEditCard = (card: DigitalCard) => {
    setSelectedCardId(card.id);
    setCurrentView('editor');

    // NEW: Update URL to user-specific editor with card ID
    if (isAuthenticated && user) {
      const userEditorUrl = getUserEditorUrl(user, card.id);
      window.history.pushState({}, '', userEditorUrl);
      console.log('🔀 Navigating to user editor for card:', userEditorUrl);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!id || isDeleting || deletingCardId) return;

    setIsDeleting(true);
    setDeletingCardId(id);
    setError(null);

    try {
      console.log('🗑️ Starting card deletion:', id);
      const success = await deleteCard(id);

      if (!success) {
        throw new Error('Deletion failed');
      }

      console.log('✅ Card deleted successfully');

      // Reset view if deleted card was selected
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setCurrentView('dashboard');

        if (isAuthenticated && user) {
          const userDashboardUrl = getUserDashboardUrl(user);
          window.history.pushState({}, '', userDashboardUrl);
        }
      }
    } catch (error) {
      setError('Error eliminando tarjeta.');
      console.error('❌ Error deleting card:', error);
    } finally {
      setIsDeleting(false);
      setDeletingCardId(null);
      if (error) setTimeout(() => setError(null), 5000);
    }
  };

  const handleViewLive = (card: DigitalCard) => {
    setSelectedCardId(card.id);
    setCurrentView('live');
    setIsExternalCard(false); // Reset external flag for owned cards

    // Update URL for live view using backend-generated URL
    const newUrl = card.customSlug
      ? `/card/${card.customSlug}`
      : `/card/${card.id}`;

    window.history.pushState({}, '', newUrl);
  };

  // Helper function to generate shareable URLs
  const generateShareableUrl = (card: DigitalCard): string => {
    const url = card.customSlug
      ? `${window.location.origin}/card/${card.customSlug}`
      : `${window.location.origin}/card/${card.id}`;
    // URL generated from backend data
    return url;
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

    // NEW: Update URL to user-specific dashboard
    if (isAuthenticated && user) {
      const userDashboardUrl = getUserDashboardUrl(user);
      window.history.pushState({}, '', userDashboardUrl);
      console.log('🔀 Navigating to user dashboard:', userDashboardUrl);
    } else {
      // Fallback to root for unauthenticated users
      window.history.pushState({}, '', '/');
    }
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

    // NEW: Update URL to user-specific editor
    if (isAuthenticated && user) {
      const cardId = selectedCardId || (cards.length > 0 ? cards[0].id : undefined);
      const userEditorUrl = getUserEditorUrl(user, cardId);
      window.history.pushState({}, '', userEditorUrl);
      console.log('🔀 Navigating to user editor:', userEditorUrl);
    }
  };

  // --- EDITOR HANDLERS ---

  // Immediate save to backend (no debounce) - for manual saves and publishing
  // --- REMOVED OLD SAVE LOGIC (Replaced by hook) ---
  const handleSaveCard = async (cardToSave: DigitalCard, immediate = false): Promise<DigitalCard> => {
    return await saveCard(cardToSave, immediate);
  };

  const handlePublish = async () => {
    console.log('🚀 PUBLISH START - activeCard:', activeCard);
    if (!activeCard) {
      console.error('No active card to publish');
      return;
    }
    setIsPublishing(true);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Let backend handle URL and slug generation (it has uniqueness logic)

    console.log('📝 CARD DATA TO PUBLISH:', {
      firstName: activeCard.firstName,
      lastName: activeCard.lastName,
      id: activeCard.id
    });

    const publishedCard = {
      ...activeCard,
      isPublished: true,
      isTemporary: false
      // Backend will generate customSlug and publishedUrl with uniqueness logic
    };

    // Publishing card to backend

    // Save to backend and wait for response with updated data (IMMEDIATE save for publishing)
    const savedCard = await handleSaveCard(publishedCard, true);
    console.log('🔍 DEBUG: savedCard received:', savedCard);
    console.log('🔍 DEBUG: savedCard.id:', savedCard?.id);
    console.log('🔍 DEBUG: savedCard.customSlug:', savedCard?.customSlug);

    // Update all states in sequence with proper timing
    setSelectedCardId(savedCard.id);
    setPublishedCard(savedCard);

    // Use setTimeout to ensure state updates complete before opening modal
    setTimeout(() => {
      setIsPublishing(false);
      setShowShareModal(true);
      console.log('🔍 DEBUG: Modal states updated');
    }, 50);

    // Debug state after all updates
    setTimeout(() => {
      console.log('🔍 DEBUG: Final state check:');
      console.log('🔍 DEBUG: isPublishing:', isPublishing);
      console.log('🔍 DEBUG: showShareModal:', showShareModal);
      console.log('🔍 DEBUG: publishedCard:', publishedCard);
    }, 100);
  };

  // --- BUSINESS LOGIC HANDLERS ---
  const handleUpgradeClick = (card: DigitalCard) => {
    setCardToUpgrade(card);
    setShowPricingModal(true);
  };

  const handleUpgradeSuccess = () => {
    if (cardToUpgrade) {
      const upgradedCard: DigitalCard = { ...cardToUpgrade, subscriptionStatus: 'active', planType: 'pro' };
      handleSaveCard(upgradedCard, true); // Immediate save for upgrade
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
        {activeCard ? (
          <CardPreview card={activeCard} mode="live" language={language} />
        ) : (
          <div className="text-white">Loading...</div>
        )}

        {/* Show edit buttons only for card owners */}
        {activeCard && isCardOwner(activeCard) && (
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
        {activeCard && !isCardOwner(activeCard) && (
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
        <div className="flex items-center cursor-pointer group" onClick={() => { if (isAuthenticated) handleGoToDashboard(); else setCurrentView('landing'); }}>
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
          <button
            className="p-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all min-h-[48px] min-w-[48px] touch-manipulation active:scale-95"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - FIXED VERSION */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="fixed top-24 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-b border-slate-800 z-50 p-6 md:hidden animate-fade-in shadow-2xl">
            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              {!isAuthenticated ? (
                <button
                  onClick={() => { setCurrentView('auth'); setIsMobileMenuOpen(false); }}
                  className="w-full py-4 rounded-xl bg-emerald-500 text-slate-900 font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-transform"
                >
                  {t.login}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { handleGoToDashboard(); setIsMobileMenuOpen(false); }}
                    className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-transform hover:bg-slate-700"
                  >
                    <LayoutDashboard size={24} /> {t.dashboard}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔄 Mobile logout attempt...');
                        setIsMobileMenuOpen(false);
                        const result = await signOut();
                        if (result.success) {
                          console.log('✅ Mobile logout successful');
                          setCurrentView('landing');
                        } else {
                          console.error('❌ Mobile logout failed, forcing logout:', result.error);
                          // Force logout on failure
                          setCurrentView('landing');
                          window.location.reload();
                        }
                      } catch (error) {
                        console.error('❌ Mobile logout error, forcing logout:', error);
                        // Force logout on any error
                        setCurrentView('landing');
                        window.location.reload();
                      }
                    }}
                    className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-red-900/20 border-2 border-red-800/50 text-red-400 font-bold text-lg min-h-[56px] touch-manipulation active:scale-95 transition-all hover:bg-red-900/40 hover:border-red-700"
                  >
                    <LogOut size={24} /> {t.logout}
                  </button>
                </>
              )}
              <button
                onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }}
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

        {currentView === 'landing' && (
          <LandingPage language={language} onStart={() => setCurrentView('auth')} onLogin={() => setCurrentView('auth')} />
        )}

        {currentView === 'editor' && (
          <>
            {activeCard ? (
              <div className="flex flex-col md:flex-row gap-8 h-full max-w-[1600px] mx-auto w-full animate-slide-up">
                <div className="flex-1 min-w-0 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center md:hidden">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold text-white">Editor</h2>

                      {/* Auto-save Indicator */}
                      {(isSaving || lastSaveTime) && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          {isSaving ? (
                            <>
                              <div className="relative w-3 h-3">
                                <div className="absolute inset-0 border border-blue-400/30 rounded-full"></div>
                                <div className="absolute inset-0 border border-transparent border-t-blue-400 rounded-full animate-spin"></div>
                              </div>
                              <span className="text-xs text-blue-400 font-medium">Guardando...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/30"></div>
                              <span className="text-xs text-emerald-400 font-medium">Guardado</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button onClick={() => setShowMobilePreview(true)} className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-xs border border-emerald-600/30">
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                  <CardEditor
                    card={activeCard}
                    setCard={(updater) => { const updated = typeof updater === 'function' ? updater(activeCard) : updater; handleSaveCard(updated); }} // Auto-save with debouncing
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
              isDeleting={isDeleting}
              deletingCardId={deletingCardId}
              isRefreshing={isRefreshing}
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

      {showShareModal && <ShareModal isOpen={showShareModal} onClose={() => { setShowShareModal(false); setPublishedCard(null); }} url={publishedCard ? generateShareableUrl(publishedCard) : ''} onOpenLive={() => {
        setShowShareModal(false);
        if (publishedCard?.customSlug) {
          window.open(`/card/${publishedCard.customSlug}`, '_blank');
        } else if (publishedCard?.id) {
          window.open(`/card/${publishedCard.id}`, '_blank');
        }
      }} language={language} card={publishedCard} />}
      {showPricingModal && <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onSuccess={handleUpgradeSuccess} language={language} />}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[70] animate-slide-down">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl border border-red-500 flex items-center gap-3 max-w-md">
            <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-200 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay for Refreshing */}
      {isRefreshing && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in">
          <div className="bg-slate-800/95 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-600/50 flex items-center gap-4">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-emerald-400/30 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-emerald-400 border-r-emerald-400/60 rounded-full animate-spin"></div>
              <div className="absolute inset-1 bg-emerald-400/20 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Actualizando datos...
            </span>
          </div>
        </div>
      )}

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