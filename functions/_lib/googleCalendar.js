const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

function b64url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let binary = ''
  bytes.forEach(byte => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function pemToArrayBuffer(pem) {
  const normalized = String(pem || '').replace(/\\n/g, '\n')
  const body = normalized.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function signJwt(env) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: env.GOOGLE_CLIENT_EMAIL,
    scope: GOOGLE_CALENDAR_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  }
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const key = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(env.GOOGLE_PRIVATE_KEY), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${b64url(signature)}`
}

export async function getGoogleAccessToken(env) {
  if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) throw new Error('Google service account env vars are missing')
  const assertion = await signJwt(env)
  const body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  const response = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error_description || data.error || 'Google auth failed')
  return data.access_token
}

export function parseBookingWindow(data, env) {
  const date = String(data.preferredDate || '').trim()
  const time = String(data.preferredTime || '').trim()
  const duration = Math.max(30, Math.min(720, Number(data.estimatedDuration || data.estimatedDurationMinutes || 120)))
  if (!date || !time || time === 'Flexible') throw new Error('Please choose an exact preferred date and time.')
  const start = new Date(`${date}T${time}:00`)
  if (Number.isNaN(start.getTime())) throw new Error('Invalid preferred date or time.')
  const end = new Date(start.getTime() + duration * 60000)
  return { startIso: start.toISOString(), endIso: end.toISOString(), durationMinutes: duration, timeZone: env.BOOKING_TIMEZONE || 'America/Los_Angeles' }
}

export async function findCalendarConflicts(env, calendarId, startIso, endIso) {
  const token = await getGoogleAccessToken(env)
  const url = `https://www.googleapis.com/calendar/v3/freeBusy`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin: startIso, timeMax: endIso, items: [{ id: calendarId }] })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Google Calendar availability check failed')
  return data.calendars?.[calendarId]?.busy || []
}

export async function createPendingCalendarEvent(env, calendarId, booking, window) {
  const token = await getGoogleAccessToken(env)
  const event = {
    summary: `PENDING: Pristine Clean - ${booking.service || 'Cleaning'}`,
    location: booking.address || '',
    description: `Pending cleaning request\n\nCustomer: ${booking.name}\nPhone: ${booking.phone}\nEmail: ${booking.email}\nService: ${booking.service}\nDuration: ${window.durationMinutes} minutes\n\nNotes:\n${booking.notes || ''}`,
    start: { dateTime: window.startIso, timeZone: window.timeZone },
    end: { dateTime: window.endIso, timeZone: window.timeZone },
    attendees: booking.email ? [{ email: booking.email }] : [],
    reminders: { useDefault: true }
  }
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Google Calendar event creation failed')
  return data
}
