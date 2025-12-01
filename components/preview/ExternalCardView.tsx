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

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://indbackend.vercel.app/api'
  : 'http://localhost:5001/api';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Cargando tarjeta</h2>
          <p className="text-slate-400">
            {retryCount > 0 ? `Reintentando... (${retryCount}/3)` : 'Obteniendo información...'}
          </p>
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