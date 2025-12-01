/**
 * Backend URL utility functions for consistent slug generation
 * JavaScript version for the api/index.js file
 */

/**
 * Normalizes a string for URL usage by removing accents and special characters
 */
const normalizeStringForUrl = (str) => {
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
const generateUserSlug = (firstName, lastName) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return normalizeStringForUrl(fullName);
};

/**
 * Validates if a URL slug is valid (not empty and has minimum length)
 */
const isValidSlug = (slug) => {
  return slug && slug.length > 1 && /^[a-z0-9-]+$/.test(slug);
};

/**
 * Creates a unique slug by checking against existing slugs and adding counter if needed
 */
const createUniqueSlug = (firstName, lastName, existingSlugs) => {
  const baseSlug = generateUserSlug(firstName, lastName);

  if (!isValidSlug(baseSlug)) {
    // If names can't create a valid slug, return empty (will use ID fallback)
    return '';
  }

  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = {
  normalizeStringForUrl,
  generateUserSlug,
  isValidSlug,
  createUniqueSlug
};