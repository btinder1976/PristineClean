export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json()
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
      notes: String(data.notes || ''),
      createdAt: new Date().toISOString()
    }

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO booking_requests (id, name, email, phone, address, service, preferred_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(booking.id, booking.name, booking.email, booking.phone, booking.address, booking.service, booking.preferredDate, `${booking.homeSize}\n${booking.preferredTime}\n${booking.notes}`, booking.createdAt).run()
    }

    return json({ ok: true, bookingId: booking.id })
  } catch (error) {
    return json({ ok: false, message: 'Unable to save request yet.' }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
