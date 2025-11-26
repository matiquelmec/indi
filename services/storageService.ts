import { DigitalCard } from '../types';
import { INITIAL_CARD } from '../constants';

// Changed key to force load of new default psychologist data
const STORAGE_KEY = 'indi_cards_v2_psy';

export const getStoredCards = (): DigitalCard[] => {
  if (typeof window === 'undefined') return [INITIAL_CARD];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with demo card if empty
      // Ensure the initial card has subscription logic if needed, though for the demo constant it might be cleaner to add it dynamically
      const initialWithSub: DigitalCard = {
         ...INITIAL_CARD,
         subscriptionStatus: 'trialing',
         trialEndsAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      const initialData = [initialWithSub];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse cards from storage", e);
    return [INITIAL_CARD];
  }
};

export const saveCardToStorage = (card: DigitalCard): DigitalCard[] => {
  const cards = getStoredCards();
  const index = cards.findIndex(c => String(c.id) === String(card.id));
  
  let newCards;
  if (index >= 0) {
    // Update existing
    newCards = [...cards];
    newCards[index] = card;
  } else {
    // Add new
    newCards = [card, ...cards];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  return newCards;
};

export const deleteCardFromStorage = (cardId: string): DigitalCard[] => {
  console.log(`Deleting card with ID: ${cardId}`);
  const cards = getStoredCards();
  // Ensure strict string comparison to match types safely
  const newCards = cards.filter(c => String(c.id) !== String(cardId));
  console.log('Cards remaining after delete:', newCards.length);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
  return newCards;
};

export const createNewCardTemplate = (): DigitalCard => {
  const timestamp = Date.now().toString();
  // Robust implementation:
  // We strictly spread INITIAL_CARD to ensure all fields (Bio, Photo, Links) are populated
  // and only override the ID and publication status.
  return {
    ...INITIAL_CARD,
    id: timestamp,
    isPublished: false,
    publishedUrl: undefined,
    // Business Logic: New cards start with a 7-day trial
    subscriptionStatus: 'trialing',
    trialEndsAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 Days from now
  };
};