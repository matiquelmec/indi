import { useState, useCallback, useRef, useEffect } from 'react';
import { DigitalCard } from '../types';
import { createNewCardTemplate, getStoredCards, saveCardToStorage, deleteCardFromStorage } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

interface UseCardManagerReturn {
    cards: DigitalCard[];
    setCards: React.Dispatch<React.SetStateAction<DigitalCard[]>>;
    isSaving: boolean;
    lastSaveTime: Date | null;
    createCard: () => Promise<DigitalCard | null>;
    saveCard: (card: DigitalCard, immediate?: boolean) => Promise<DigitalCard>;
    deleteCard: (id: string, isDeleting?: boolean) => Promise<boolean>;
    fetchCards: () => Promise<void>;
    fetchCardBySlugOrId: (idOrSlug: string) => Promise<DigitalCard | null>;
}

export function useCardManager(): UseCardManagerReturn {
    const { user, session, isAuthenticated } = useAuth();
    const [cards, setCards] = useState<DigitalCard[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

    // Refs for debouncing
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingCardRef = useRef<DigitalCard | null>(null);

    // Initialize cards from storage or backend
    const fetchCards = useCallback(async () => {
        if (isAuthenticated && session?.access_token) {
            try {
                const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/cards`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                if (response.ok) {
                    const backendCards = await response.json();
                    setCards(backendCards);
                    return;
                }
            } catch (error) {
                console.error('Failed to fetch cards from backend:', error);
            }
        }
        // Fallback to local storage
        setCards(getStoredCards());
    }, [isAuthenticated, session]);

    // Initial fetch
    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    // --- CORE ACTIONS ---

    // 1. CREATE (Immediate Persistence)
    const createCard = async (): Promise<DigitalCard | null> => {
        const template = createNewCardTemplate();

        // Auto-fill user data
        if (isAuthenticated && user) {
            const u = user as any;
            template.firstName = u.user_metadata?.first_name || user.firstName || '';
            template.lastName = u.user_metadata?.last_name || user.lastName || '';
            template.email = user.email || '';
        }

        // Immediately save to backend if authenticated
        if (isAuthenticated && session?.access_token) {
            setIsSaving(true);
            try {
                console.log('✨ Creating persistent card for user:', user?.email);
                const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ ...template, isNew: false, isTemporary: false })
                });

                if (response.ok) {
                    const data = await response.json();
                    const newCard = data.card || data; // Handle wrapped response
                    console.log('✅ Card created on backend:', newCard.id);
                    setCards(prev => [...prev, newCard]);
                    setLastSaveTime(new Date());
                    return newCard;
                } else {
                    console.error('❌ Failed to create card on backend');
                }
            } catch (error) {
                console.error('❌ Creation error:', error);
            } finally {
                setIsSaving(false);
            }
        }

        // Fallback: Local temporary card
        const tempCard = { ...template, isTemporary: true };
        setCards(prev => [...prev, tempCard]);
        return tempCard;
    };

    // 2. SAVE (Debounced or Immediate)
    const saveCardToBackend = async (cardToSave: DigitalCard): Promise<DigitalCard> => {
        try {
            const isNew = cardToSave.isNew || cardToSave.isTemporary; // Re-evaluate if truly new based on ID presence? No, rely on flags.

            // If authenticated, always sync to backend
            if (isAuthenticated && session?.access_token) {
                const endpoint = isNew
                    ? `${(import.meta as any).env.VITE_API_URL}/cards`
                    : `${(import.meta as any).env.VITE_API_URL}/cards/${cardToSave.id}`;

                const method = isNew ? 'POST' : 'PUT';

                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ ...cardToSave, isNew: false, isTemporary: false })
                });

                if (response.ok) {
                    const data = await response.json();
                    const saved = data.card || data; // Handle wrapped response
                    console.log(`✅ Saved (${method}) success:`, saved.id);
                    return { ...saved, isTemporary: false, isNew: false };
                }
            }

            // Fallback to local storage
            saveCardToStorage(cardToSave);
            return cardToSave;
        } catch (error) {
            console.error('Save error:', error);
            saveCardToStorage(cardToSave);
            return cardToSave;
        }
    };

    const forceSave = async (card: DigitalCard): Promise<DigitalCard> => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setIsSaving(true);
        try {
            const saved = await saveCardToBackend(card);
            setCards(prev => prev.map(c => c.id === saved.id ? saved : c));
            setLastSaveTime(new Date());
            return saved;
        } finally {
            setIsSaving(false);
        }
    };

    const debouncedSave = useCallback((card: DigitalCard) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        pendingCardRef.current = card;

        debounceTimerRef.current = setTimeout(async () => {
            const cardToSave = pendingCardRef.current;
            if (!cardToSave) return;

            setIsSaving(true);
            try {
                const saved = await saveCardToBackend(cardToSave);
                setCards(prev => prev.map(c => c.id === saved.id ? saved : c));
                setLastSaveTime(new Date());
            } finally {
                setIsSaving(false);
                pendingCardRef.current = null;
            }
        }, 800);
    }, [isAuthenticated, session]);

    const saveCard = async (card: DigitalCard, immediate = false): Promise<DigitalCard> => {
        // Optimistic update
        setCards(prev => prev.map(c => c.id === card.id ? card : c));

        if (immediate) {
            return forceSave(card);
        } else {
            debouncedSave(card);
            return card;
        }
    };

    // 3. DELETE
    const deleteCard = async (id: string, isDeleting = false): Promise<boolean> => {
        if (isDeleting) return false;

        try {
            if (isAuthenticated && session?.access_token) {
                const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/cards/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                if (!response.ok) throw new Error('Backend delete failed');
            }

            // Local cleanup
            setCards(prev => prev.filter(c => c.id !== id));
            deleteCardFromStorage(id);
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    };

    // 4. FETCH SINGLE
    const fetchCardBySlugOrId = async (idOrSlug: string): Promise<DigitalCard | null> => {
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
            const endpoint = isUUID
                ? `${(import.meta as any).env.VITE_API_URL}/cards/${idOrSlug}/public` // Public endpoint usually preferred for viewing
                : `${(import.meta as any).env.VITE_API_URL}/cards/slug/${idOrSlug}`;

            const response = await fetch(endpoint);
            if (response.ok) {
                return await response.json();
            }
            return null; // Not found
        } catch (error) {
            console.error('Fetch single error:', error);
            return null;
        }
    };

    return {
        cards,
        setCards,
        isSaving,
        lastSaveTime,
        createCard,
        saveCard,
        deleteCard,
        fetchCards,
        fetchCardBySlugOrId
    };
}
