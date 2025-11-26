import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Mock cards storage (replace with database in production)
const cards: any[] = [];

// Get user's cards
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userCards = cards.filter(card => card.userId === userId);
    return res.json(userCards);
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card by ID
router.get('/:id', [
  param('id').isUUID()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const card = cards.find(c => c.id === id);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    return res.json(card);
  } catch (error) {
    console.error('Get card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card by slug (public)
router.get('/slug/:slug', [
  param('slug').isLength({ min: 1, max: 100 })
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { slug } = req.params;
    const card = cards.find(c => c.slug === slug && c.isPublished);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Increment view count
    card.viewsCount = (card.viewsCount || 0) + 1;
    card.updatedAt = new Date();

    return res.json(card);
  } catch (error) {
    console.error('Get card by slug error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new card
router.post('/', authMiddleware, [
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('company').trim().isLength({ min: 1, max: 200 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('email').optional().isEmail(),
  body('phone').optional().isLength({ max: 50 }),
  body('location').optional().isLength({ max: 200 }),
  body('themeId').optional().isLength({ min: 1, max: 50 }),
  body('themeConfig').optional().isObject(),
  body('socialLinks').optional().isArray()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const userId = (req as any).user.userId;
    const {
      firstName,
      lastName,
      title,
      company,
      bio = '',
      email = '',
      phone = '',
      location = '',
      avatarUrl = '',
      themeId = 'emerald',
      themeConfig = {},
      socialLinks = []
    } = req.body;

    // Generate slug
    const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;
    while (cards.find(c => c.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newCard = {
      id: uuidv4(),
      userId,
      slug,
      firstName,
      lastName,
      title,
      company,
      bio,
      email,
      phone,
      location,
      avatarUrl,
      themeId,
      themeConfig,
      socialLinks,
      isPublished: false,
      publishedUrl: null,
      viewsCount: 0,
      contactsSaved: 0,
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    cards.push(newCard);

    res.status(201).json({
      message: 'Card created successfully',
      card: newCard
    });

  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card
router.put('/:id', authMiddleware, [
  param('id').isUUID(),
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('company').optional().trim().isLength({ min: 1, max: 200 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('email').optional().isEmail(),
  body('phone').optional().isLength({ max: 50 }),
  body('location').optional().isLength({ max: 200 }),
  body('themeId').optional().isLength({ min: 1, max: 50 }),
  body('themeConfig').optional().isObject(),
  body('socialLinks').optional().isArray()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const cardIndex = cards.findIndex(c => c.id === id && c.userId === userId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Update card
    const updates = req.body;
    cards[cardIndex] = {
      ...cards[cardIndex],
      ...updates,
      updatedAt: new Date()
    };

    res.json({
      message: 'Card updated successfully',
      card: cards[cardIndex]
    });

  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete card
router.delete('/:id', authMiddleware, [
  param('id').isUUID()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const cardIndex = cards.findIndex(c => c.id === id && c.userId === userId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    cards.splice(cardIndex, 1);

    res.json({ message: 'Card deleted successfully' });

  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish card
router.post('/:id/publish', authMiddleware, [
  param('id').isUUID()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const cardIndex = cards.findIndex(c => c.id === id && c.userId === userId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const card = cards[cardIndex];
    const publishedUrl = `${process.env.FRONTEND_URL}/card/${card.slug}`;

    cards[cardIndex] = {
      ...card,
      isPublished: true,
      publishedUrl,
      updatedAt: new Date()
    };

    res.json({
      message: 'Card published successfully',
      card: cards[cardIndex]
    });

  } catch (error) {
    console.error('Publish card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unpublish card
router.post('/:id/unpublish', authMiddleware, [
  param('id').isUUID()
], (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const cardIndex = cards.findIndex(c => c.id === id && c.userId === userId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    cards[cardIndex] = {
      ...cards[cardIndex],
      isPublished: false,
      publishedUrl: null,
      updatedAt: new Date()
    };

    res.json({
      message: 'Card unpublished successfully',
      card: cards[cardIndex]
    });

  } catch (error) {
    console.error('Unpublish card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;