import { Pool } from 'pg';
// import sqlite3 from 'sqlite3';
// import { Database, open } from 'sqlite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let pool: Pool | null = null;
let sqliteDb: any | null = null;
let supabase: SupabaseClient | null = null;
const dbType = process.env.DB_TYPE || 'sqlite';

export const connectDatabase = async () => {
  try {
    if (dbType === 'supabase') {
      console.log('🔌 Connecting to Supabase...');

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase URL or Service Key in environment variables');
      }

      supabase = createClient(supabaseUrl, supabaseKey);

      // Test the connection
      const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1);

      if (error && !error.message.includes('relation "information_schema.tables" does not exist')) {
        throw error;
      }

      console.log('✅ Supabase database connected successfully');
      console.log('🌐 Supabase URL:', supabaseUrl);

    } else if (dbType === 'sqlite') {
      console.log('🔌 Connecting to SQLite database...');

      // Crear directorio si no existe
      const dbPath = process.env.DB_PATH || './database/indi_dev.sqlite';
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // SQLite temporarily disabled for production build
      // sqliteDb = await open({
      //   filename: dbPath,
      //   driver: sqlite3.Database
      // });
      throw new Error('SQLite support temporarily disabled. Use Supabase instead.');

      // Test the connection
      const result = await sqliteDb.get('SELECT datetime() as now');
      console.log('✅ SQLite database connected successfully');
      console.log('🕒 Database time:', result.now);

    } else {
      console.log('🔌 Connecting to PostgreSQL...');

      pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      console.log('✅ PostgreSQL database connected successfully');
      console.log('🕒 Database time:', result.rows[0].now);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (dbType === 'supabase' && supabase) {
    console.log('🔌 Disconnecting from Supabase...');
    // Supabase client doesn't need explicit disconnection
    supabase = null;
  } else if (dbType === 'sqlite' && sqliteDb) {
    console.log('🔌 Disconnecting from SQLite database...');
    await sqliteDb.close();
    sqliteDb = null;
  } else if (pool) {
    console.log('🔌 Disconnecting from PostgreSQL database...');
    await pool.end();
    pool = null;
  }
  return true;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  if (dbType === 'supabase') {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Call connectDatabase first.');
    }

    // For Supabase, we'll need to handle queries through the REST API
    // This is a simplified implementation for basic queries
    console.log('🔍 Supabase query:', text, params);

    // For now, return a basic success response for DDL queries
    if (text.toLowerCase().includes('create table') || text.toLowerCase().includes('insert into') || text.toLowerCase().includes('update') || text.toLowerCase().includes('delete')) {
      return { rows: [], changes: 1 };
    }

    // For SELECT queries, return empty result for now
    return { rows: [] };

  } else if (dbType === 'sqlite') {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized. Call connectDatabase first.');
    }

    // Convertir query de PostgreSQL a SQLite si es necesario
    let sqliteQuery = text;

    // Reemplazar parámetros de PostgreSQL ($1, $2) por ? para SQLite
    if (params && params.length > 0) {
      let paramIndex = 1;
      sqliteQuery = text.replace(/\$\d+/g, () => {
        return '?';
      });
    }

    if (text.toLowerCase().includes('select')) {
      const rows = await sqliteDb.all(sqliteQuery, params);
      return { rows };
    } else {
      const result = await sqliteDb.run(sqliteQuery, params);
      return { rows: [], lastID: result.lastID, changes: result.changes };
    }

  } else {
    if (!pool) {
      throw new Error('PostgreSQL database not initialized. Call connectDatabase first.');
    }

    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
};

// Export the Supabase client for direct usage
export const getSupabaseClient = (): SupabaseClient | null => {
  return supabase;
};