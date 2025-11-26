import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
}

class Database {
  private supabase!: SupabaseClient;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    };

    this.validateConfig();
    this.initializeClient();
  }

  private validateConfig(): void {
    const { supabaseUrl, supabaseServiceKey } = this.config;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase configuration. Please check your environment variables:\n' +
        `SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}\n` +
        `SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`
      );
    }

    console.log('🔧 Database configuration loaded');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
  }

  private initializeClient(): void {
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Supabase client initialized');
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to query a system table to test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = relation does not exist (expected if tables not created)
        console.error('❌ Database connection failed:', error.message);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
  }

  /**
   * User operations
   */
  async createUser(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: userData.passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Card operations
   */
  async createCard(cardData: any) {
    const { data, error } = await this.supabase
      .from('cards')
      .insert(cardData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCardsByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') throw error;
    return data || [];
  }

  async getCardById(id: string) {
    const { data, error } = await this.supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateCard(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCard(id: string) {
    const { error } = await this.supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Session operations
   */
  async createSession(sessionData: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        user_id: sessionData.userId,
        refresh_token: sessionData.refreshToken,
        expires_at: sessionData.expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionByRefreshToken(refreshToken: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async deleteSession(refreshToken: string) {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', refreshToken);

    if (error) throw error;
    return true;
  }

  /**
   * Analytics operations
   */
  async trackEvent(eventData: {
    cardId: string;
    eventType: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }) {
    const { data, error } = await this.supabase
      .from('analytics_events')
      .insert({
        card_id: eventData.cardId,
        event_type: eventData.eventType,
        metadata: eventData.metadata || {},
        ip_address: eventData.ipAddress,
        user_agent: eventData.userAgent,
        referrer: eventData.referrer,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCardAnalytics(cardId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('analytics_events')
      .select('*')
      .eq('card_id', cardId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') throw error;
    return data || [];
  }
}

// Export singleton instance
export const database = new Database();
export default database;