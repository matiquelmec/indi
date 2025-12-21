import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';
import { createUniqueSlug } from '../utils/urlUtils';
import { database } from '../config/database';
import { toApiCard, toDbCard } from '../utils/formatters';

const router = express.Router();

// Get user's cards
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userCards = await database.getCardsByUserId(userId);

    // Map to API format
    const apiCards = userCards.map(toApiCard);

    return res.json(apiCards);
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card by ID
router.get('/:id', [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const card = await database.getCardById(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    return res.json(toApiCard(card));
  } catch (error) {
    console.error('Get card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card by slug (public)
router.get('/slug/:slug', [
  param('slug').isLength({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const slug = req.params.slug.toLowerCase();
    console.log(`🔍 [GET /slug/${slug}] Request received`);

    // Direct query for public slug
    const { data: card, error } = await database.getClient()
      .from('cards')
      .select('*')
      .eq('custom_slug', slug)
      .maybeSingle();

    if (error) {
      console.error(`❌ [GET /slug/${slug}] DB Error:`, error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!card) {
      console.warn(`⚠️ [GET /slug/${slug}] Card not found in DB`);
      return res.status(404).json({ error: 'Card not found' });
    }

    if (!card.is_published) {
      console.warn(`⚠️ [GET /slug/${slug}] Card found but NOT published (ID: ${card.id})`);
      return res.status(404).json({ error: 'Card not found or not published' });
    }

    console.log(`✅ [GET /slug/${slug}] Success -> ID: ${card.id}`);

    // Increment view count (fire and forget)
    database.getClient().rpc('increment_page_view', { page_id: card.id })
      .then(result => {
        if (result.error) {
          // If RPC fails or doesn't exist, try direct update
          database.updateCard(card.id, { views_count: (card.views_count || 0) + 1 });
        }
      });

    return res.json(toApiCard(card));
  } catch (error) {
    console.error('Get card by slug error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new card
router.post('/', authMiddleware, [
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
  // ... other validations can stay the same or be permissive
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const userId = (req as any).user.userId;
    const { firstName, lastName, isPublished = false } = req.body;

    // Generate unique slug
    // Fetch similar slugs to check uniqueness
    // We search for any custom_slug starting with the generated base
    // This is an approximation. Ideally we generate a candidate and check existence.
    // Let's use the 'generate candidate, checking db' approach loop for safety.

    // Base slug from names
    let baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let candidateSlug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data } = await database.getClient()
        .from('cards')
        .select('id')
        .eq('custom_slug', candidateSlug)
        .single(); // using single() returns null if not found (with maybeSingle ideally) or checks count

      // Actually .single() throws if 0 rows in some versions, maybeSingle() is better
      // Simpler: select count
      const { count } = await database.getClient()
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('custom_slug', candidateSlug);

      if (count === 0) {
        isUnique = true;
      } else {
        candidateSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Prepare DB object
    // Note: We use toDbCard to map most fields, but manually handle strict requirements
    const dbPayload = toDbCard({
      ...req.body,
      userId,
      customSlug: candidateSlug,
      // Ensure defaults
      isPublished: isPublished,
      isActive: true,
      viewsCount: 0
    });

    // Explicitly set ID if needed or let DB handle it? 
    // Schema says "id uuid NOT NULL DEFAULT gen_random_uuid()", so we can omit it.
    // However, the mock used uuidv4(). Providing it is safe.
    dbPayload.id = uuidv4();
    if (!dbPayload.theme_id) dbPayload.theme_id = 'emerald';

    const newCard = await database.createCard(dbPayload);

    return res.status(201).json({
      message: 'Card created successfully',
      card: toApiCard(newCard)
    });

  } catch (error) {
    console.error('Create card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card
router.put('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify ownership
    const { data: existing } = await database.getClient()
      .from('cards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Card not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    // Update
    // Enforce lowercase if updating customSlug
    if (req.body.customSlug) {
      req.body.customSlug = req.body.customSlug.toLowerCase();
    }

    const updates = toDbCard(req.body);
    const updatedCard = await database.updateCard(id, updates);

    return res.json({
      message: 'Card updated successfully',
      card: toApiCard(updatedCard)
    });

  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete card
router.delete('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify ownership
    const { data: existing } = await database.getClient()
      .from('cards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Card not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    await database.deleteCard(id);

    return res.json({ message: 'Card deleted successfully' });

  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DEBUG ENDPOINT: List all slugs (for diagnostics only)
router.get('/debug/slugs', async (req: Request, res: Response) => {
  try {
    const { data: slugs, error } = await database.getClient()
      .from('cards')
      .select('id, custom_slug, is_published, first_name, last_name')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return res.json({
      count: slugs?.length,
      slugs: slugs
    });
  } catch (error) {
    return res.status(500).json({ error: 'Debug error', details: error });
  }
});

export default router;