-- Stripe's portal may schedule cancel_at without cancel_at_period_end.
ALTER TABLE billing_subscriptions ADD COLUMN cancel_at INTEGER NOT NULL DEFAULT 0;
