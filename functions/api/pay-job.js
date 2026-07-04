function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json()
    const jobId = String(body.jobId || '')
    const tipAmountCents = Number(body.tipAmountCents || 0)
    const saveCard = Boolean(body.saveCard)

    if (!env.DB) return json({ ok: false, message: 'Database not configured' }, 500)
    if (!env.STRIPE_SECRET_KEY) return json({ ok: false, message: 'Stripe secret key not configured' }, 500)
    if (!jobId) return json({ ok: false, message: 'Missing job id' }, 400)

    const job = await env.DB.prepare(`SELECT id, final_amount_cents, quoted_amount_cents, service_name FROM cleaning_jobs WHERE id = ?`).bind(jobId).first()
    if (!job) return json({ ok: false, message: 'Job not found' }, 404)

    const baseAmount = Number(job.final_amount_cents || job.quoted_amount_cents || 0)
    const totalAmount = Math.max(0, baseAmount + tipAmountCents)
    if (totalAmount < 50) return json({ ok: false, message: 'Amount must be at least 50 cents' }, 400)

    const siteUrl = env.SITE_URL || 'https://pristineclean.pages.dev'
    const params = new URLSearchParams()
    params.set('mode', 'payment')
    params.set('success_url', `${siteUrl}/?payment=success`)
    params.set('cancel_url', `${siteUrl}/?payment=cancelled`)
    params.set('line_items[0][price_data][currency]', 'usd')
    params.set('line_items[0][price_data][product_data][name]', `Pristine Clean - ${job.service_name || 'Cleaning Service'}`)
    params.set('line_items[0][price_data][unit_amount]', String(totalAmount))
    params.set('line_items[0][quantity]', '1')
    params.set('metadata[job_id]', jobId)
    params.set('metadata[tip_amount_cents]', String(tipAmountCents))
    if (saveCard) params.set('payment_intent_data[setup_future_usage]', 'off_session')

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
    const session = await response.json()
    if (!response.ok) return json({ ok: false, message: session.error?.message || 'Unable to create checkout session' }, 500)

    await env.DB.prepare(
      `INSERT INTO payment_records (id, job_id, stripe_session_id, amount_cents, tip_amount_cents, save_card, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(crypto.randomUUID(), jobId, session.id, totalAmount, tipAmountCents, saveCard ? 1 : 0, new Date().toISOString(), new Date().toISOString()).run()

    return json({ ok: true, url: session.url })
  } catch (error) {
    return json({ ok: false, message: error.message || 'Unable to start payment' }, 500)
  }
}
