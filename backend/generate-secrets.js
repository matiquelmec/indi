const crypto = require('crypto');

console.log('🔐 Generando secrets criptográficamente seguros...\n');

// Generar JWT secret de 64 bytes
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

// Generar encryption key de 32 bytes  
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generar session secret de 32 bytes
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 SECRETS GENERADOS PARA PRODUCCIÓN:');
console.log('=====================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('=====================================');
console.log('\n⚠️  IMPORTANTE: Guarda estos secrets de forma segura!');
console.log('❗ NUNCA los subas a Git!');
console.log('✅ Úsalos en tu archivo .env.production\n');