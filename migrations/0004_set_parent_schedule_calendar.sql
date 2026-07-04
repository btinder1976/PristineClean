-- Sets the initial parent Google Calendar account for the primary cleaner.
-- The live booking function still reads GOOGLE_CALENDAR_ID from Cloudflare environment variables.
-- Set GOOGLE_CALENDAR_ID=pristine.clean.schedule@gmail in Cloudflare Pages.

UPDATE cleaners
SET calendar_id = 'pristine.clean.schedule@gmail',
    email = 'pristine.clean.schedule@gmail',
    updated_at = datetime('now')
WHERE id = 'primary-cleaner';
