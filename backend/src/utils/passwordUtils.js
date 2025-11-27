const bcrypt = require('bcrypt');

/**
 * Password hashing utilities using bcrypt
 * Provides secure password hashing and comparison
 */

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Hash a plaintext password using bcrypt
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(password) {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password must be less than 128 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error.message);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plaintext password with a hashed password
 * @param {string} password - The plaintext password
 * @param {string} hashedPassword - The hashed password from database
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function comparePassword(password, hashedPassword) {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
      return false;
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error.message);
    return false;
  }
}

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} - Validation result with isValid and errors
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak patterns
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a random secure password
 * @param {number} length - The desired password length (default: 16)
 * @returns {string} - A randomly generated secure password
 */
function generateSecurePassword(length = 16) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if a password needs to be rehashed (e.g., if salt rounds changed)
 * @param {string} hashedPassword - The hashed password to check
 * @returns {boolean} - True if password needs rehashing, false otherwise
 */
function needsRehashing(hashedPassword) {
  try {
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds !== SALT_ROUNDS;
  } catch (error) {
    // If we can't determine rounds, assume it needs rehashing
    return true;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePassword,
  generateSecurePassword,
  needsRehashing,
  SALT_ROUNDS
};