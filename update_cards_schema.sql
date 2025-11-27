-- =================================================================
-- MIGRATION: Add Subscription Fields to Cards Table
-- Execute this in your Supabase SQL Editor to update the schema
-- =================================================================

-- Add subscription_status column
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';

-- Add trial_ends_at column
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add plan_type column
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_cards_subscription ON cards(subscription_status);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cards' 
AND column_name IN ('subscription_status', 'trial_ends_at', 'plan_type');
