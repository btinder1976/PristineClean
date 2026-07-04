import React, { useEffect, useState } from 'react'
import { CalendarCheck, Camera, CreditCard, DollarSign, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import './admin.css'

const money = cents => `$${((Number(cents || 0)) / 100).toFixed(2)}`
const toCents = value => Math.round(Number(value || 0) * 100)

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('pc_admin_key') || '')
  const [data, setData] = useState({ requests: [], services: [], jobs: [], photos: [] })
  const [status, setStatus] = useState('Enter admin key and load dashboard.')
  const [drafts, setDrafts] = useState({})

  async function load() {
    setStatus('Loading admin dashboard...')
    const res = await fetch('/api/admin/data', { headers: { 'x-admin-key': adminKey } })
    const json = await res.json()
    if (!json.ok) { setStatus(json.message || 'Could not load admin data.'); return }
    localStorage.setItem('pc_admin_key', adminKey)
    setData(json)
    setStatus('Dashboard loaded.')
  }

  async function action(payload, success = 'Saved.') {
    setStatus('Saving...')
    const res = await fetch('/api/admin/data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (!json.ok) { setStatus(json.message || 'Unable to save.'); return }
    setStatus(json.message || success)
    await load()
  }

  function updateDraft(id, field, value) { setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } })) }
  function draft(id, field, fallback = '') { return drafts[id]?.[field] ?? fallback ?? '' }

  useEffect(() => { if (adminKey) load() }, [])

  return <section className="screen admin-screen">
    <div className="page-intro"><p className="eyebrow">Admin Dashboard</p><h1>Run Pristine Clean from one place.</h1><p>Manage quote requests, update cleaning prices, prepare jobs, and approve before/after photos for showcase use.</p></div>
    <div className="app-card admin-login-card"><label>Admin key<input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="Cloudflare ADMIN_KEY" /></label><button className="button slim" onClick={load}><RefreshCw size={16}/> Load Dashboard</button><p className="status">{status}</p></div>
    <div className="admin-stats"><div className="app-card"><ShieldCheck/><strong>{data.requests.length}</strong><span>Requests</span></div><div className="app-card"><CalendarCheck/><strong>{data.jobs.length}</strong><span>Jobs</span></div><div className="app-card"><DollarSign/><strong>{data.services.length}</strong><span>Services</span></div><div className="app-card"><Camera/><strong>{data.photos.filter(p => p.is_showcase).length}</strong><span>Showcase Photos</span></div></div>
    <h2 className="admin-section-title">Quote Requests</h2><div className="admin-list">{data.requests.map(req => <article className="app-card admin-item" key={req.id}><div><h3>{req.name}</h3><p>{req.service} • {req.phone} • {req.email}</p><p>{req.address}</p><small>{req.created_at}</small></div><label>Status<select value={draft(req.id, 'status', req.status || 'new')} onChange={e => updateDraft(req.id, 'status', e.target.value)}><option>new</option><option>contacted</option><option>quote_sent</option><option>scheduled</option><option>completed</option><option>cancelled</option></select></label><label>Quote amount<input type="number" step="0.01" value={draft(req.id, 'amount', (Number(req.quoted_amount_cents || 0) / 100).toFixed(2))} onChange={e => updateDraft(req.id, 'amount', e.target.value)} /></label><label className="wide">Quote notes<textarea rows="3" value={draft(req.id, 'notes', req.quote_notes || '')} onChange={e => updateDraft(req.id, 'notes', e.target.value)} /></label><div className="admin-actions"><button className="button slim" onClick={() => action({ action: 'updateRequest', id: req.id, status: draft(req.id, 'status', req.status), quotedAmountCents: toCents(draft(req.id, 'amount', 0)), quoteNotes: draft(req.id, 'notes', '') })}><Save size={16}/> Save</button><button className="button slim ghost" onClick={() => action({ action: 'markQuoteSent', id: req.id, quotedAmountCents: toCents(draft(req.id, 'amount', 0)), quoteNotes: draft(req.id, 'notes', '') }, 'Quote marked sent.')}>Mark Quote Sent</button></div></article>)}</div>
    <h2 className="admin-section-title">Cleanings & Prices</h2><div className="admin-list">{data.services.map(svc => <article className="app-card admin-item" key={svc.id}><label>Name<input value={draft(svc.id, 'name', svc.name)} onChange={e => updateDraft(svc.id, 'name', e.target.value)} /></label><label>Base price<input type="number" step="0.01" value={draft(svc.id, 'price', (Number(svc.base_price_cents || 0) / 100).toFixed(2))} onChange={e => updateDraft(svc.id, 'price', e.target.value)} /></label><label>Pricing type<select value={draft(svc.id, 'pricingType', svc.pricing_type || 'quote')} onChange={e => updateDraft(svc.id, 'pricingType', e.target.value)}><option>quote</option><option>fixed</option><option>starting_at</option></select></label><label className="wide">Description<textarea rows="3" value={draft(svc.id, 'description', svc.description || '')} onChange={e => updateDraft(svc.id, 'description', e.target.value)} /></label><button className="button slim" onClick={() => action({ action: 'saveService', id: svc.id, name: draft(svc.id, 'name', svc.name), description: draft(svc.id, 'description', svc.description), basePriceCents: toCents(draft(svc.id, 'price', 0)), pricingType: draft(svc.id, 'pricingType', svc.pricing_type), isActive: svc.is_active, sortOrder: svc.sort_order })}><Save size={16}/> Save Service</button></article>)}</div>
    <h2 className="admin-section-title">Jobs & Photo Showcase</h2><div className="admin-list">{data.jobs.map(job => <article className="app-card admin-item" key={job.id}><h3>{job.service_name || 'Cleaning Job'}</h3><p>Status: {job.status} • Quote: {money(job.quoted_amount_cents)} • Final: {money(job.final_amount_cents)}</p><p>Scheduled: {job.scheduled_date} {job.scheduled_time}</p><small>Job ID: {job.id}</small></article>)}{data.photos.map(photo => <article className="app-card admin-item" key={photo.id}><h3>{photo.photo_type} photo</h3><p>{photo.caption}</p><p>{photo.image_url}</p><button className="button slim" onClick={() => action({ action: 'savePhoto', id: photo.id, jobId: photo.job_id, photoType: photo.photo_type, imageUrl: photo.image_url, caption: photo.caption, isShowcase: photo.is_showcase ? 0 : 1 })}>{photo.is_showcase ? 'Remove from Showcase' : 'Approve Showcase'}</button></article>)}</div>
    <div className="app-card admin-note"><CreditCard/><div><h2>Stripe payment flow ready for next phase</h2><p>After a cleaning is completed, the customer payment page can call <code>/api/pay-job</code>, allow a tip, and ask whether to save the card for future service.</p></div></div>
  </section>
}
