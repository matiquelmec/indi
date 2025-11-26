import axios, { AxiosError } from 'axios';
import { DigitalCard } from '../types';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Token management
let authToken: string | null = localStorage.getItem('authToken');

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, handle refresh or logout
      localStorage.removeItem('authToken');
      authToken = null;
      // Redirect to login if needed
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      authToken = token;
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Invalid credentials' };
    }
  },

  async register(email: string, password: string, firstName: string, lastName: string) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName
      });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      authToken = token;
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      authToken = null;
    }
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      authToken = token;
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  async verifyEmail(token: string) {
    return api.get(`/auth/verify-email?token=${token}`);
  },

  async resetPassword(email: string) {
    return api.post('/auth/reset-password', { email });
  },

  async updatePassword(token: string, newPassword: string) {
    return api.post('/auth/update-password', { token, newPassword });
  }
};

// Cards Service
export const cardsService = {
  async getMyCards() {
    try {
      const response = await api.get('/cards');
      return response.data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  },

  async getCard(id: string) {
    try {
      const response = await api.get(`/cards/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  },

  async getCardBySlug(slug: string) {
    try {
      const response = await api.get(`/cards/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching card by slug:', error);
      return null;
    }
  },

  async createCard(card: Partial<DigitalCard>) {
    try {
      const response = await api.post('/cards', card);
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  },

  async updateCard(id: string, updates: Partial<DigitalCard>) {
    try {
      const response = await api.put(`/cards/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  },

  async deleteCard(id: string) {
    try {
      await api.delete(`/cards/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  },

  async publishCard(id: string) {
    try {
      const response = await api.post(`/cards/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing card:', error);
      throw error;
    }
  },

  async unpublishCard(id: string) {
    try {
      const response = await api.post(`/cards/${id}/unpublish`);
      return response.data;
    } catch (error) {
      console.error('Error unpublishing card:', error);
      throw error;
    }
  }
};

// Analytics Service
export const analyticsService = {
  async trackEvent(cardId: string, eventType: string, metadata?: any) {
    try {
      await api.post('/analytics/track', {
        cardId,
        eventType,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  },

  async getCardAnalytics(cardId: string, period: string = '7d') {
    try {
      const response = await api.get(`/analytics/cards/${cardId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  async getDashboardAnalytics() {
    try {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return null;
    }
  }
};

// Payments Service
export const paymentsService = {
  async createCheckoutSession(priceId: string) {
    try {
      const response = await api.post('/payments/create-checkout', { priceId });
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async getSubscriptionStatus() {
    try {
      const response = await api.get('/payments/subscription');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  async cancelSubscription() {
    try {
      const response = await api.post('/payments/cancel-subscription');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
};

// AI Service (Moved to backend for security)
export const aiService = {
  async generateBio(title: string, company: string, keywords: string) {
    try {
      const response = await api.post('/ai/generate-bio', {
        title,
        company,
        keywords
      });
      return response.data.bio;
    } catch (error) {
      console.error('Error generating bio:', error);
      // Fallback to local generation if API fails
      return `${title} en ${company}. Especialista en ${keywords}.`;
    }
  }
};

// Upload Service
export const uploadService = {
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }
};

export default api;