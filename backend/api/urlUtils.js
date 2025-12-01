/**
 * Backend URL utility functions for consistent slug generation
 * JavaScript version for the api/index.js file
 */

/**
 * Normalizes a string for URL usage by removing accents and special characters
 * Handles both proper UTF-8 and damaged encoding characters
 */
const normalizeStringForUrl = (str) => {
  if (!str) return '';

  return str
    .toLowerCase()
    // Handle damaged encoding characters first (common in HTTP transmission)
    .replace(/[âáàäãåā]/g, 'a')
    .replace(/[êéèëē]/g, 'e')
    .replace(/[îíìïī]/g, 'i')
    .replace(/[ôóòöõøō]/g, 'o')
    .replace(/[ûúùüū]/g, 'u')
    .replace(/[ÿýỳ]/g, 'y')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    // Then normalize properly with NFD
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    // Handle special European characters
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[ß]/g, 'ss')
    .replace(/[ð]/g, 'd')
    .replace(/[þ]/g, 'th')
    // Convert spaces to hyphens
    .replace(/\s+/g, '-')
    // Remove any remaining non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Clean up multiple consecutive hyphens
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
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