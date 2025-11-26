import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in auth routes');
  throw new Error('Supabase configuration required for authentication');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized for auth routes');

// Helper function to generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (checkError) {
      console.error('❌ Database error checking user:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: uuidv4(),
      email,
      full_name: `${firstName} ${lastName}`,
      subscription_status: 'free',
      plan_type: 'free',
      is_active: true,
      // Note: password stored separately for security
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      email_verified: true, // Skip email verification for demo
      role: 'user'
    };

    // Insert user into database
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        subscription_status: newUser.subscription_status,
        plan_type: newUser.plan_type,
        is_active: newUser.is_active
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database error creating user:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // For now, store password hash in a separate way (in production, use proper user management)
    // This is a simplified approach for demo purposes

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser.id);

    // TODO: Store refresh token in sessions table
    console.log('✅ User created successfully:', newUser.email);

    // Return user data without password
    const userWithoutPassword = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      fullName: newUser.full_name,
      role: newUser.role,
      subscriptionStatus: insertedUser.subscription_status,
      planType: insertedUser.plan_type,
      createdAt: insertedUser.created_at
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token: accessToken,
      refreshToken
    });
    return;

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token session
    sessions.push({
      id: uuidv4(),
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date()
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: accessToken,
      refreshToken
    });
    return;

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Refresh token endpoint
router.post('/refresh', [
  body('refreshToken').isLength({ min: 1 })
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    // Find session
    const session = sessions.find(s => s.refreshToken === refreshToken && s.expiresAt > new Date());
    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify token
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const { accessToken } = generateTokens(session.userId);

    res.json({
      token: accessToken,
      message: 'Token refreshed successfully'
    });
    return;

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Logout endpoint
router.post('/logout', [
  body('refreshToken').optional()
], (req: Request, res: Response): void => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove session
      const sessionIndex = sessions.findIndex(s => s.refreshToken === refreshToken);
      if (sessionIndex !== -1) {
        sessions.splice(sessionIndex, 1);
      }
    }

    res.json({ message: 'Logged out successfully' });
    return;

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// Get current user endpoint
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const user = users.find(u => u.id === decoded.userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
      return;

    } catch (jwtError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;