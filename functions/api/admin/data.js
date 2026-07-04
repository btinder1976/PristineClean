function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function requireAdmin(request, env) {
  const configured = env.ADMIN_KEY || env.ADMIN_PASSWORD
  const provided = request.headers.get('x-admin-key') || ''
  return configured && provided === configured
}

async function ensureDb(env) {
  if (!env.DB) throw new Error('D1 database is not configured')
}

export async function onRequestGet({ request, env }) {
  try {
    if (!requireAdmin(request, env)) return json({ ok: false, message: 'Unauthorized' }, 401)
    await ensureDb(env)

    const requests = await env.DB.prepare(
      `SELECT id, name, email, phone, address, service, preferred_date, notes, status, home_size, preferred_time, estimated_duration_minutes, cleaner_id, calendar_event_id, calendar_status, conflict_checked_at, quoted_amount_cents, quote_notes, quote_sent_at, created_at, updated_at
       FROM booking_requests ORDER BY created_at DESC LIMIT 100`
    ).all()

    const services = await env.DB.prepare(
      `SELECT id, name, description, base_price_cents, pricing_type, is_active, sort_order, updated_at
       FROM service_catalog ORDER BY sort_order, name`
    ).all()

    const cleaners = await env.DB.prepare(
      `SELECT id, name, email, calendar_id, active, service_areas, created_at, updated_at
       FROM cleaners ORDER BY active DESC, name`
    ).all()

    const jobs = await env.DB.prepare(
      `SELECT id, booking_request_id, customer_id, service_name, scheduled_date, scheduled_time, status, quoted_amount_cents, final_amount_cents, tip_amount_cents, cleaner_notes, admin_notes, completed_at, created_at, updated_at
       FROM cleaning_jobs ORDER BY created_at DESC LIMIT 100`
    ).all()

    const photos = await env.DB.prepare(
      `SELECT id, job_id, photo_type, image_url, caption, is_showcase, created_at
       FROM job_photos ORDER BY created_at DESC LIMIT 100`
    ).all()

    return json({ ok: true, requests: requests.results || [], services: services.results || [], cleaners: cleaners.results || [], jobs: jobs.results || [], photos: photos.results || [] })
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to load admin data' }, 500)
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!requireAdmin(request, env)) return json({ ok: false, message: 'Unauthorized' }, 401)
    await ensureDb(env)
    const body = await request.json()
    const now = new Date().toISOString()

    if (body.action === 'updateRequest') {
      await env.DB.prepare(
        `UPDATE booking_requests SET status = ?, quoted_amount_cents = ?, quote_notes = ?, updated_at = ? WHERE id = ?`
      ).bind(String(body.status || 'new'), Number(body.quotedAmountCents || 0), String(body.quoteNotes || ''), now, String(body.id)).run()
      return json({ ok: true })
    }

    if (body.action === 'markQuoteSent') {
      await env.DB.prepare(
        `UPDATE booking_requests SET status = 'quote_sent', quoted_amount_cents = ?, quote_notes = ?, quote_sent_at = ?, updated_at = ? WHERE id = ?`
      ).bind(Number(body.quotedAmountCents || 0), String(body.quoteNotes || ''), now, now, String(body.id)).run()
      return json({ ok: true, message: 'Quote saved. Email sending is ready once an email provider key is added.' })
    }

    if (body.action === 'saveService') {
      const id = String(body.id || crypto.randomUUID())
      await env.DB.prepare(
        `INSERT INTO service_catalog (id, name, description, base_price_cents, pricing_type, is_active, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, base_price_cents = excluded.base_price_cents, pricing_type = excluded.pricing_type, is_active = excluded.is_active, sort_order = excluded.sort_order, updated_at = excluded.updated_at`
      ).bind(id, String(body.name || ''), String(body.description || ''), Number(body.basePriceCents || 0), String(body.pricingType || 'quote'), Number(body.isActive ?? 1), Number(body.sortOrder || 0), now).run()
      return json({ ok: true, id })
    }

    if (body.action === 'saveCleaner') {
      const id = String(body.id || crypto.randomUUID())
      await env.DB.prepare(
        `INSERT INTO cleaners (id, name, email, calendar_id, active, service_areas, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email, calendar_id = excluded.calendar_id, active = excluded.active, service_areas = excluded.service_areas, updated_at = excluded.updated_at`
      ).bind(id, String(body.name || ''), String(body.email || ''), String(body.calendarId || ''), Number(body.active ?? 1), String(body.serviceAreas || ''), now, now).run()
      return json({ ok: true, id })
    }

    if (body.action === 'createJob') {
      const id = crypto.randomUUID()
      await env.DB.prepare(
        `INSERT INTO cleaning_jobs (id, booking_request_id, service_name, scheduled_date, scheduled_time, status, quoted_amount_cents, final_amount_cents, admin_notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, String(body.bookingRequestId || ''), String(body.serviceName || ''), String(body.scheduledDate || ''), String(body.scheduledTime || ''), String(body.status || 'scheduled'), Number(body.quotedAmountCents || 0), Number(body.finalAmountCents || 0), String(body.adminNotes || ''), now, now).run()
      return json({ ok: true, id })
    }

    if (body.action === 'savePhoto') {
      const id = String(body.id || crypto.randomUUID())
      await env.DB.prepare(
        `INSERT INTO job_photos (id, job_id, photo_type, image_url, caption, is_showcase, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET photo_type = excluded.photo_type, image_url = excluded.image_url, caption = excluded.caption, is_showcase = excluded.is_showcase`
      ).bind(id, String(body.jobId || ''), String(body.photoType || 'after'), String(body.imageUrl || ''), String(body.caption || ''), Number(body.isShowcase || 0), now).run()
      return json({ ok: true, id })
    }

    return json({ ok: false, message: 'Unknown admin action' }, 400)
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to save admin change' }, 500)
  }
}
