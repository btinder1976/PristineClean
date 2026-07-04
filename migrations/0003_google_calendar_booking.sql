-- Google Calendar booking integration foundation

ALTER TABLE booking_requests ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 120;
ALTER TABLE booking_requests ADD COLUMN cleaner_id TEXT;
ALTER TABLE booking_requests ADD COLUMN calendar_event_id TEXT;
ALTER TABLE booking_requests ADD COLUMN calendar_status TEXT DEFAULT 'pending';
ALTER TABLE booking_requests ADD COLUMN conflict_checked_at TEXT;

CREATE TABLE IF NOT EXISTS cleaners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  calendar_id TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  service_areas TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

INSERT OR IGNORE INTO cleaners (id, name, email, calendar_id, active, service_areas, created_at, updated_at)
VALUES ('primary-cleaner', 'Primary Cleaner', '', 'env:GOOGLE_CALENDAR_ID', 1, 'Sacramento, Orangevale, Citrus Heights, Roseville, Folsom', datetime('now'), datetime('now'));

CREATE INDEX IF NOT EXISTS idx_cleaners_active ON cleaners(active);
CREATE INDEX IF NOT EXISTS idx_booking_requests_calendar_event ON booking_requests(calendar_event_id);
