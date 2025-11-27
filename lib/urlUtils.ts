/**
 * Utility functions for URL generation and normalization
 */

/**
 * Normalizes a string for URL usage by removing accents and special characters
 * Examples:
 * - "Matías Rodríguez" → "matias-rodriguez"
 * - "José María" → "jose-maria"
 * - "François Müller" → "francois-muller"
 */
export const normalizeStringForUrl = (str: string): string => {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres acentuados (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Elimina las marcas de acento (´, ¨, etc.)
    .replace(/[ñ]/g, 'n') // Maneja específicamente la ñ
    .replace(/[æ]/g, 'ae') // Maneja æ
    .replace(/[ø]/g, 'o') // Maneja ø
    .replace(/[ß]/g, 'ss') // Maneja ß alemana
    .replace(/\s+/g, '-') // Convierte espacios en guiones
    .replace(/[^a-z0-9-]/g, '') // Solo permite letras, números y guiones
    .replace(/--+/g, '-') // Múltiples guiones consecutivos → uno solo
    .replace(/^-|-$/g, ''); // Elimina guiones al inicio/final
};

/**
 * Generates a clean URL slug from first and last names
 */
export const generateUserSlug = (firstName: string, lastName: string): string => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return normalizeStringForUrl(fullName.replace(/\s+/g, '-'));
};

/**
 * Validates if a URL slug is valid (not empty and has minimum length)
 */
export const isValidSlug = (slug: string): boolean => {
  return slug && slug.length > 1 && /^[a-z0-9-]+$/.test(slug);
};

/**
 * Generates a complete profile URL
 */
export const generateProfileUrl = (firstName: string, lastName: string, cardId: string, baseUrl: string = window.location.origin): string => {
  const slug = generateUserSlug(firstName, lastName);

  if (isValidSlug(slug)) {
    return `${baseUrl}/u/${slug}`;
  }

  // Fallback to card ID if name can't create valid slug
  return `${baseUrl}/card/${cardId}`;
};

// Examples for testing
/*
console.log(normalizeStringForUrl("Matías Rodríguez")); // "matias-rodriguez"
console.log(normalizeStringForUrl("José María")); // "jose-maria"
console.log(normalizeStringForUrl("François Müller")); // "francois-muller"
console.log(normalizeStringForUrl("Andrés José")); // "andres-jose"
console.log(generateUserSlug("María", "González")); // "maria-gonzalez"
*/