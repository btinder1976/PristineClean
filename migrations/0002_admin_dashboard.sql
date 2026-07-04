-- Admin dashboard foundation for Pristine Clean
-- Apply with Cloudflare D1 after 0001_initial.sql.

ALTER TABLE booking_requests ADD COLUMN status TEXT DEFAULT 'new';
ALTER TABLE booking_requests ADD COLUMN home_size TEXT;
ALTER TABLE booking_requests ADD COLUMN preferred_time TEXT;
ALTER TABLE booking_requests ADD COLUMN quoted_amount_cents INTEGER;
ALTER TABLE booking_requests ADD COLUMN quote_notes TEXT;
ALTER TABLE booking_requests ADD COLUMN quote_sent_at TEXT;
ALTER TABLE booking_requests ADD COLUMN updated_at TEXT;

CREATE TABLE IF NOT EXISTS service_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price_cents INTEGER DEFAULT 0,
  pricing_type TEXT DEFAULT 'quote',
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS cleaning_jobs (
  id TEXT PRIMARY KEY,
  booking_request_id TEXT,
  customer_id TEXT,
  service_name TEXT,
  scheduled_date TEXT,
  scheduled_time TEXT,
  status TEXT DEFAULT 'scheduled',
  quoted_amount_cents INTEGER DEFAULT 0,
  final_amount_cents INTEGER DEFAULT 0,
  tip_amount_cents INTEGER DEFAULT 0,
  cleaner_notes TEXT,
  admin_notes TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS job_photos (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_showcase INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  job_id TEXT,
  booking_request_id TEXT,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL,
  tip_amount_cents INTEGER DEFAULT 0,
  save_card INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

INSERT OR IGNORE INTO service_catalog (id, name, description, base_price_cents, pricing_type, sort_order, updated_at) VALUES
('standard-cleaning', 'Standard Cleaning', 'Reliable recurring or one-time cleaning for the rooms used every day.', 0, 'quote', 1, datetime('now')),
('deep-cleaning', 'Deep Cleaning', 'Detailed reset for buildup, baseboards, bathrooms, fixtures, and overlooked spaces.', 0, 'quote', 2, datetime('now')),
('move-cleaning', 'Move-In / Move-Out', 'Detailed empty-home cleaning before or after a move.', 0, 'quote', 3, datetime('now')),
('recurring-cleaning', 'Recurring Cleaning', 'Weekly, biweekly, or monthly cleaning with repeat checklists.', 0, 'quote', 4, datetime('now'));

CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON cleaning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_photos_showcase ON job_photos(is_showcase);
