/**
 * Card field mappers for consistent data transformation
 * Maps between frontend (camelCase) and database (snake_case)
 * Ensures compatibility with the complete database schema
 */

/**
 * Map frontend card data to database format
 * @param {Object} frontendData - Data from frontend in camelCase
 * @param {string} userId - User ID to associate with the card
 * @returns {Object} Database-ready data in snake_case
 */
const mapCardToDatabase = (frontendData, userId = null) => {
  return {
    // Core identification
    user_id: userId || frontendData.userId || '23f71da9-1bac-4811-9456-50d5b7742567', // Demo user fallback

    // Personal information
    first_name: frontendData.firstName || '',
    last_name: frontendData.lastName || '',
    title: frontendData.title || '',
    company: frontendData.company || '',
    bio: frontendData.bio || '',

    // Contact information
    email: frontendData.email || '',
    phone: frontendData.phone || '',
    location: frontendData.location || '',
    website: frontendData.website || '',

    // Media
    avatar_url: frontendData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',

    // Theme and customization
    theme_id: frontendData.themeId || 'emerald',
    theme_config: frontendData.themeConfig || { brandColor: '#10b981' },

    // Social and contact links
    social_links: frontendData.socialLinks || [],

    // Publishing and URL
    is_published: frontendData.isPublished || false,
    published_url: frontendData.publishedUrl || null,
    custom_slug: frontendData.customSlug || null,

    // Analytics counters
    views_count: frontendData.viewsCount || 0,
    contacts_saved: frontendData.contactsSaved || 0,
    shares_count: frontendData.sharesCount || 0,

    // Status and plan
    is_active: frontendData.isActive !== undefined ? frontendData.isActive : true,
    plan_type: frontendData.planType || 'free',
    features: frontendData.features || {
      analytics: false,
      custom_domain: false,
      remove_branding: false
    },

    // Timestamps (handled by database defaults, but included if provided)
    published_at: frontendData.publishedAt || null
  };
};

/**
 * Map database card data to frontend format
 * @param {Object} dbData - Data from database in snake_case
 * @returns {Object} Frontend-ready data in camelCase
 */
const mapCardFromDatabase = (dbData) => {
  if (!dbData) return null;

  return {
    // Core identification
    id: dbData.id,
    userId: dbData.user_id,

    // Personal information
    firstName: dbData.first_name,
    lastName: dbData.last_name,
    title: dbData.title,
    company: dbData.company,
    bio: dbData.bio,

    // Contact information
    email: dbData.email,
    phone: dbData.phone,
    location: dbData.location,
    website: dbData.website,

    // Media
    avatarUrl: dbData.avatar_url,

    // Theme and customization
    themeId: dbData.theme_id,
    themeConfig: dbData.theme_config,

    // Social and contact links
    socialLinks: dbData.social_links || [],

    // Publishing and URL
    isPublished: dbData.is_published,
    publishedUrl: dbData.published_url,
    customSlug: dbData.custom_slug,

    // Analytics counters
    viewsCount: dbData.views_count,
    contactsSaved: dbData.contacts_saved,
    sharesCount: dbData.shares_count,

    // Status and plan
    isActive: dbData.is_active,
    planType: dbData.plan_type,
    features: dbData.features,

    // Timestamps
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
    publishedAt: dbData.published_at
  };
};

/**
 * Map multiple cards from database format
 * @param {Array} dbCards - Array of cards from database
 * @returns {Array} Array of frontend-ready cards
 */
const mapCardsFromDatabase = (dbCards) => {
  if (!dbCards || !Array.isArray(dbCards)) return [];
  return dbCards.map(mapCardFromDatabase);
};

/**
 * Prepare card data for update (exclude null/undefined values)
 * @param {Object} updateData - Update data from frontend
 * @returns {Object} Clean update data for database
 */
const prepareCardUpdate = (updateData) => {
  const mappedData = mapCardToDatabase(updateData, updateData.userId);

  // Remove null/undefined values to avoid overwriting with nulls
  Object.keys(mappedData).forEach(key => {
    if (mappedData[key] === null || mappedData[key] === undefined) {
      delete mappedData[key];
    }
  });

  // Don't update created_at timestamp
  delete mappedData.created_at;

  return mappedData;
};

/**
 * Generate a URL-safe slug from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} URL-safe slug
 */
const generateSlug = (firstName, lastName) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate published URL for a card
 * @param {string} slug - URL slug
 * @param {string} cardId - Card ID
 * @param {string} baseUrl - Base URL for the application
 * @returns {string} Complete published URL
 */
const generatePublishedUrl = (slug, cardId, baseUrl = 'https://indi-frontend.vercel.app') => {
  if (slug) {
    return `${baseUrl}/u/${slug}`;
  }
  return `${baseUrl}/card/${cardId}`;
};

module.exports = {
  mapCardToDatabase,
  mapCardFromDatabase,
  mapCardsFromDatabase,
  prepareCardUpdate,
  generateSlug,
  generatePublishedUrl
};