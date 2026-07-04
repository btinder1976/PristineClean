import { createPendingCalendarEvent, findCalendarConflicts, parseBookingWindow } from '../_lib/googleCalendar.js'

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json()
    const now = new Date().toISOString()
    const calendarId = env.GOOGLE_CALENDAR_ID
    const window = parseBookingWindow(data, env)

    if (!calendarId) return json({ ok: false, message: 'Booking calendar is not configured yet.' }, 500)

    const conflicts = await findCalendarConflicts(env, calendarId, window.startIso, window.endIso)
    if (conflicts.length > 0) {
      return json({ ok: false, conflict: true, message: 'That time is already booked. Please choose another time.' }, 409)
    }

    const booking = {
      id: crypto.randomUUID(),
      name: String(data.name || ''),
      email: String(data.email || ''),
      phone: String(data.phone || ''),
      address: String(data.address || ''),
      service: String(data.service || ''),
      homeSize: String(data.homeSize || ''),
      preferredDate: String(data.preferredDate || ''),
      preferredTime: String(data.preferredTime || ''),
      estimatedDuration: window.durationMinutes,
      notes: String(data.notes || ''),
      createdAt: now
    }

    const event = await createPendingCalendarEvent(env, calendarId, booking, window)

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO booking_requests (id, name, email, phone, address, service, preferred_date, notes, created_at, status, home_size, preferred_time, estimated_duration_minutes, cleaner_id, calendar_event_id, calendar_status, conflict_checked_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        booking.id,
        booking.name,
        booking.email,
        booking.phone,
        booking.address,
        booking.service,
        booking.preferredDate,
        booking.notes,
        booking.createdAt,
        'pending_calendar',
        booking.homeSize,
        booking.preferredTime,
        booking.estimatedDuration,
        'primary-cleaner',
        event.id,
        'pending',
        now,
        now
      ).run()
    }

    return json({ ok: true, bookingId: booking.id, calendarEventId: event.id, message: 'Request received and placed on the calendar as pending.' })
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to save request yet.' }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
