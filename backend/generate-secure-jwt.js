const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate secure JWT secret
 */
function generateSecureJWTSecret() {
  // Generate a 64-byte random string
  const secret = crypto.randomBytes(64).toString('hex');

  console.log('🔐 Generated secure JWT secret');
  console.log('Add this to your .env.development and .env.production files:');
  console.log(`\nJWT_SECRET=${secret}\n`);

  return secret;
}

// Generate and display the secret
const jwtSecret = generateSecureJWTSecret();

// Optionally update .env.development automatically
const envPath = path.join(__dirname, '.env.development');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if JWT_SECRET already exists
  if (envContent.includes('JWT_SECRET=')) {
    console.log('⚠️  JWT_SECRET already exists in .env.development');
    console.log('Please update it manually with the generated secret above');
  } else {
    // Add JWT_SECRET to the file
    envContent += `\n# Secure JWT Secret (generated)\nJWT_SECRET=${jwtSecret}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ JWT_SECRET added to .env.development');
  }
}

console.log('\n⚠️  Remember to:');
console.log('1. Add this secret to your production environment variables');
console.log('2. Never commit .env files with real secrets to git');
console.log('3. Restart your server after updating the environment variables');