export async function onRequestPost({ env }) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    return json({ ok: false, message: 'Stripe is not configured yet.' }, 400)
  }

  const siteUrl = env.SITE_URL || 'https://pristineclean.pages.dev'
  const body = new URLSearchParams()
  body.set('mode', 'payment')
  body.set('line_items[0][price]', env.STRIPE_PRICE_ID)
  body.set('line_items[0][quantity]', '1')
  body.set('success_url', `${siteUrl}/?payment=success`)
  body.set('cancel_url', `${siteUrl}/?payment=cancelled`)

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const session = await response.json()
  if (!response.ok) {
    return json({ ok: false, message: session.error?.message || 'Stripe checkout failed.' }, 400)
  }

  return json({ ok: true, url: session.url })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
