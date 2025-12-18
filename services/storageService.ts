import { DigitalCard } from '../types';
import { INITIAL_CARD } from '../constants';

// Generate a proper UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Changed key to force load of new default psychologist data
const STORAGE_KEY = 'indi_cards_v2_psy';

/**
 * Cleans up corrupted data and fixes common issues
 * - Replaces via.placeholder.com images with reliable alternatives
 * - Ensures all required fields are present
 * - Fixes malformed social links
 */
const cleanupCorruptedDataInternal = (cards: DigitalCard[]): DigitalCard[] => {
  const reliableAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=150&h=150&q=80';

  return cards.map(card => {
    const cleanedCard = { ...card };

    // Fix problematic avatar URLs
    if (!cleanedCard.avatarUrl ||
      cleanedCard.avatarUrl.includes('via.placeholder.com') ||
      cleanedCard.avatarUrl.includes('placeholder')) {
      cleanedCard.avatarUrl = reliableAvatar;
      console.log(`🧹 Fixed corrupted avatar for card: ${card.firstName} ${card.lastName}`);
    }

    // Ensure required fields exist
    if (!cleanedCard.firstName) cleanedCard.firstName = 'Usuario';
    if (!cleanedCard.lastName) cleanedCard.lastName = 'Anónimo';
    if (!cleanedCard.title) cleanedCard.title = '';
    if (!cleanedCard.company) cleanedCard.company = '';
    if (!cleanedCard.bio) cleanedCard.bio = '';
    if (!cleanedCard.email) cleanedCard.email = '';
    if (!cleanedCard.phone) cleanedCard.phone = '';
    if (!cleanedCard.socialLinks) cleanedCard.socialLinks = [];
    if (!cleanedCard.themeConfig) cleanedCard.themeConfig = { layout: 'centered', atmosphere: 'clean', brandColor: '#1e40af' };

    return cleanedCard;
  });
};

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
    const rawCards = JSON.parse(stored);

    // Automatically clean up corrupted data
    const cleanedCards = cleanupCorruptedDataInternal(rawCards);

    // If cleanup changed anything, save the cleaned version
    if (JSON.stringify(rawCards) !== JSON.stringify(cleanedCards)) {
      console.log('🧹 Cleaned up corrupted card data');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedCards));
    }

    return cleanedCards;
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


/**
 * Force cleanup of all stored data - removes all corrupted entries
 * Use this if you need to completely reset user data
 */
export const forceCleanupStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Clear the current storage
    localStorage.removeItem(STORAGE_KEY);

    // Also clear any old storage keys that might have corrupted data
    const oldKeys = ['indi-cards', 'indi_cards_v1', 'indi_cards_v2_psy_old'];
    oldKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 Force cleaned all storage - fresh start');
  } catch (error) {
    console.error('Error during force cleanup:', error);
  }
};

export const createNewCardTemplate = (): DigitalCard => {
  const uuid = generateUUID();
  // Robust implementation:
  // We strictly spread INITIAL_CARD to ensure all fields (Bio, Photo, Links) are populated
  // and only override the ID and publication status.
  return {
    ...INITIAL_CARD,
    id: uuid,
    isPublished: true,
    publishedUrl: undefined,
    // Business Logic: New cards start with a 7-day trial
    subscriptionStatus: 'trialing',
    trialEndsAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 Days from now
  };
};