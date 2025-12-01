/**
 * External Card View Component
 * Handles loading and displaying cards for external users
 * Provides smooth loading experience with caching and error handling
 */

import React, { useState, useEffect } from 'react';
import { DigitalCard, Language } from '../../types';
import CardPreview from './CardPreview';
import { Eye, AlertCircle, RefreshCw } from 'lucide-react';

interface ExternalCardViewProps {
  username?: string;
  cardSlug?: string;
  cardId?: string; // For legacy support
  language?: Language;
}

// Robust API_BASE configuration matching analyticsService
const API_BASE = (() => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Production environment
  if (import.meta.env.PROD) {
    return 'https://indbackend.vercel.app/api';
  }

  // Development environment
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5001/api';
    }
  }

  // Final fallback
  return 'https://indbackend.vercel.app/api';
})();

// Simple cache for external cards
const cardCache = new Map<string, { card: DigitalCard; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ExternalCardView: React.FC<ExternalCardViewProps> = ({
  username,
  cardSlug,
  cardId,
  language = 'es'
}) => {
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const getCacheKey = () => {
    if (cardSlug) return `slug:${cardSlug}`;
    if (cardId) return `id:${cardId}`;
    return '';
  };

  const loadCardFromCache = (): DigitalCard | null => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;

    const cached = cardCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.card;
    }
    return null;
  };

  const saveCardToCache = (cardData: DigitalCard) => {
    const cacheKey = getCacheKey();
    if (cacheKey) {
      cardCache.set(cacheKey, { card: cardData, timestamp: Date.now() });
    }
  };

  const loadCard = async (useCache = true) => {
    const cacheKey = getCacheKey();

    // Try cache first
    if (useCache) {
      const cachedCard = loadCardFromCache();
      if (cachedCard) {
        setCard(cachedCard);
        setIsLoading(false);
        setError(null);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let url: string;

      if (cardSlug) {
        // Use the by-slug endpoint we just fixed
        url = `${API_BASE}/cards/by-slug/${encodeURIComponent(cardSlug)}`;
      } else if (cardId) {
        // Legacy support for direct card ID access
        url = `${API_BASE}/cards/${cardId}`;
      } else {
        throw new Error('No se proporcionó slug ni ID de la tarjeta');
      }

      console.log('🔍 Loading card from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Allow CORS for external access
          'Access-Control-Allow-Origin': '*'
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tarjeta no encontrada o no está publicada');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta más tarde');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      const cardData: DigitalCard = result.card || result;

      if (!cardData) {
        throw new Error('No se pudo cargar la información de la tarjeta');
      }

      // Validate that the card is published
      if (!cardData.isPublished) {
        throw new Error('Esta tarjeta no está disponible públicamente');
      }

      // Save to cache
      saveCardToCache(cardData);
      setCard(cardData);
      setRetryCount(0);

      console.log('✅ Card loaded successfully:', cardData.firstName, cardData.lastName);

    } catch (err) {
      console.error('❌ Error loading external card:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');

      // Auto-retry on network errors (up to 3 times)
      if (retryCount < 3 && (
        err instanceof Error && (
          err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.message.includes('servidor')
        )
      )) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadCard(false); // Skip cache on retry
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCard();
  }, [cardSlug, cardId]);

  const handleRetry = () => {
    setRetryCount(0);
    loadCard(false); // Force refresh, skip cache
  };

  const handleRefresh = () => {
    // Clear cache and reload
    const cacheKey = getCacheKey();
    if (cacheKey) {
      cardCache.delete(cacheKey);
    }
    loadCard(false);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        <div className="relative z-10 text-center max-w-sm mx-auto px-6">
          {/* Enhanced Loading Animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>

            {/* Rotating outer ring */}
            <div className="absolute inset-1 border-4 border-slate-700/20 rounded-full"></div>

            {/* Main spinning ring */}
            <div className="absolute inset-1 border-4 border-transparent border-t-emerald-400 border-r-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>

            {/* Inner pulsing core */}
            <div className="absolute inset-6 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-full animate-pulse"></div>

            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-emerald-400 font-black text-sm tracking-tight">INDI</span>
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Cargando tu tarjeta
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {retryCount > 0
                ? `Reintentando conexión... (${retryCount}/3)`
                : 'Preparando tu experiencia digital'
              }
            </p>

            {/* Progress indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-400/60 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Oops! Algo salió mal</h2>
          <p className="text-slate-400 mb-8">{error}</p>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Intentar nuevamente
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Render Card
  if (!card) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Tarjeta no disponible</h2>
          <p className="text-slate-400">Esta tarjeta no existe o no está publicada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Debug Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-2 rounded text-xs">
          <div>Slug: {cardSlug}</div>
          <div>Card ID: {card.id}</div>
          <div>Published: {card.isPublished ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Refresh Button for live cards */}
      <button
        onClick={handleRefresh}
        className="fixed top-4 left-4 z-40 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
        title="Actualizar datos"
      >
        <RefreshCw className="w-5 h-5" />
      </button>

      {/* Card Preview in Live Mode */}
      <CardPreview
        card={card}
        mode="live"
        language={language}
      />
    </div>
  );
};

export default ExternalCardView;