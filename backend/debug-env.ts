import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

console.log('=== DEBUG ENV VARS ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[HIDDEN]' : 'UNDEFINED');
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length || 0);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('====================');