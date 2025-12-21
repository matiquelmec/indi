import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server';
import { database } from '../src/config/database';

// Initialize DB connection for serverless environment
// The singleton constructor handles init, but we test connection here
database.testConnection().then(success => {
  if (!success) console.error('❌ DB Connection failed in Vercel function');
}).catch(console.error);

export default app;