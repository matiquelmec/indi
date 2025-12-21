import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server';
import { connectDatabase } from '../src/config/database';

// Initialize DB connection for serverless environment
// Note: Supabase client is stateless but we might need this for sanity checks
connectDatabase().catch(console.error);

export default app;