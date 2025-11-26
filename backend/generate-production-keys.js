#!/usr/bin/env node

/**
 * Script to generate secure keys for production
 * Run: node generate-production-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating secure keys for production...\n');

// Generate cryptographically secure random keys
const generateKey = (bytes) => crypto.randomBytes(bytes).toString('hex');

// Generate all required keys
const keys = {
  JWT_SECRET: generateKey(64),
  JWT_REFRESH_SECRET: generateKey(64),
  ENCRYPTION_KEY: generateKey(32),
  SESSION_SECRET: generateKey(32),
};

// Display generated keys
console.log('✅ Generated Keys (Copy these to your .env.production file):\n');
console.log('# JWT Secrets (Keep these absolutely secret!)');
console.log(`JWT_SECRET=${keys.JWT_SECRET}`);
console.log(`JWT_REFRESH_SECRET=${keys.JWT_REFRESH_SECRET}\n`);

console.log('# Security Keys');
console.log(`ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}`);
console.log(`SESSION_SECRET=${keys.SESSION_SECRET}\n`);

// Create a secure .env.production template
const envTemplate = `# Production Environment Variables
# Generated on ${new Date().toISOString()}
# SECURITY WARNING: Keep this file secret and NEVER commit to version control!

# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database Configuration - Supabase
DB_TYPE=supabase
SUPABASE_URL=# Add your Supabase URL
SUPABASE_ANON_KEY=# Add your Supabase anon key
SUPABASE_SERVICE_KEY=# Add your Supabase service key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Secrets (Generated - DO NOT SHARE!)
JWT_SECRET=${keys.JWT_SECRET}
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=${keys.JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRE=7d

# Security Keys (Generated - DO NOT SHARE!)
ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}
SESSION_SECRET=${keys.SESSION_SECRET}

# Google Gemini API
GEMINI_API_KEY=# Add your Gemini API key

# Stripe Payment (Production keys)
STRIPE_SECRET_KEY=# Add your Stripe secret key
STRIPE_WEBHOOK_SECRET=# Add your webhook secret
STRIPE_PRICE_ID=# Add your price ID

# Email Service - SendGrid
SENDGRID_API_KEY=# Add your SendGrid API key
EMAIL_FROM=noreply@your-domain.com

# Production Flags
MOCK_DATABASE=false
MOCK_REDIS=false
MOCK_STRIPE=false
DATABASE_SSL=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
`;

// Save to file if requested
const args = process.argv.slice(2);
if (args.includes('--save')) {
  const envPath = path.join(__dirname, '.env.production.generated');
  fs.writeFileSync(envPath, envTemplate);
  console.log(`📄 Template saved to: ${envPath}`);
  console.log('⚠️  Remember to:\n');
  console.log('   1. Fill in the missing values (marked with #)');
  console.log('   2. Rename to .env.production');
  console.log('   3. NEVER commit this file to version control');
} else {
  console.log('💡 Tip: Run with --save to create a .env.production.generated file');
}

console.log('\n🔒 Security Reminders:');
console.log('   • Store these keys in a secure password manager');
console.log('   • Use environment variables or secrets management in production');
console.log('   • Rotate keys regularly');
console.log('   • Never share or expose these keys');
console.log('   • Add .env.production to .gitignore');