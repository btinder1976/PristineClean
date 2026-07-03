import Stripe from 'stripe'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    if (url.pathname === '/api/schedule' && request.method === 'POST') {
      return handleSchedule(request, env)
    }

    if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
      return handleStripe(env)
    }

    return env.ASSETS.fetch(request)
  }
}

async function handleSchedule(request, env) {
  const data = await request.json()
  const booking = {
    id: crypto.randomUUID(),
    name: String(data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    address: String(data.address || ''),
    service: String(data.service || ''),
    preferredDate: String(data.preferredDate || ''),
    notes: String(data.notes || ''),
    createdAt: new Date().toISOString()
  }

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO booking_requests (id, name, email, phone, address, service, preferred_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(booking.id, booking.name, booking.email, booking.phone, booking.address, booking.service, booking.preferredDate, booking.notes, booking.createdAt).run()
  }

  return json({ ok: true, bookingId: booking.id })
}

async function handleStripe(env) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    return json({ ok: false, message: 'Stripe environment variables are not configured yet.' }, 400)
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const siteUrl = env.SITE_URL || 'https://pristineclean.pages.dev'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${siteUrl}/?payment=success`,
    cancel_url: `${siteUrl}/?payment=cancelled`
  })

  return json({ ok: true, url: session.url })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}
