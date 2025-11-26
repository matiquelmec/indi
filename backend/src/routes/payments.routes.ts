import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Mock subscription storage (replace with database in production)
const subscriptions: any[] = [];

// Create checkout session (Stripe integration would go here)
router.post('/create-checkout', authMiddleware, [
  body('priceId').isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const userId = (req as any).user.userId;
    const { priceId } = req.body;

    // Mock Stripe checkout session
    // In production, this would create an actual Stripe checkout session
    const checkoutSession = {
      id: `cs_mock_${uuidv4()}`,
      url: `https://checkout.stripe.com/mock/${uuidv4()}`,
      customer: userId,
      mode: 'subscription',
      priceId,
      status: 'open',
      created: Date.now()
    };

    res.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription status
router.get('/subscription', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Find user's subscription
    const subscription = subscriptions.find(s => s.userId === userId);

    if (!subscription) {
      // Return default trial status
      return res.json({
        planType: 'free',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      });
    }

    res.json(subscription);

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const subscriptionIndex = subscriptions.findIndex(s => s.userId === userId);
    
    if (subscriptionIndex === -1) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Update subscription to cancel at period end
    subscriptions[subscriptionIndex] = {
      ...subscriptions[subscriptionIndex],
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      message: 'Subscription will be canceled at the end of the current period',
      subscription: subscriptions[subscriptionIndex]
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for Stripe (mock)
router.post('/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  try {
    // In production, you would verify the webhook signature here
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Mock webhook event
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_mock_123',
          customer: 'user-id-123',
          subscription: 'sub_mock_123',
          status: 'complete'
        }
      }
    };

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        const session = event.data.object;
        
        // Create or update subscription
        const newSubscription = {
          id: uuidv4(),
          userId: session.customer,
          planType: 'pro',
          status: 'active',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        subscriptions.push(newSubscription);
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Create a test subscription (for development)
router.post('/test-subscription', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Remove existing subscription
    const existingIndex = subscriptions.findIndex(s => s.userId === userId);
    if (existingIndex !== -1) {
      subscriptions.splice(existingIndex, 1);
    }

    // Create test pro subscription
    const testSubscription = {
      id: uuidv4(),
      userId,
      planType: 'pro',
      status: 'active',
      stripeCustomerId: `cus_test_${userId}`,
      stripeSubscriptionId: `sub_test_${userId}`,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    subscriptions.push(testSubscription);

    res.json({
      message: 'Test subscription created',
      subscription: testSubscription
    });

  } catch (error) {
    console.error('Create test subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;