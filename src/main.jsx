import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Sparkles, CalendarCheck, ShieldCheck, CreditCard, Home, Heart, CheckCircle2, LogIn, Users, ClipboardList } from 'lucide-react'
import './styles.css'

const services = [
  ['Standard Cleaning', 'Routine cleaning for living areas, bedrooms, kitchens, bathrooms, dusting, surfaces, and floors.'],
  ['Deep Cleaning', 'A detailed clean for buildup, baseboards, cabinet faces, appliance exteriors, bathrooms, and hard-to-reach spots.'],
  ['Move-In / Move-Out Cleaning', 'Cleaning for homes, rentals, apartments, and turnovers before or after moving.'],
  ['Kitchen Cleaning', 'Counters, sinks, stovetops, appliance exteriors, cabinet fronts, floors, and crumb-prone areas.'],
  ['Bathroom Cleaning', 'Showers, tubs, toilets, sinks, mirrors, fixtures, floors, and high-touch surfaces.'],
  ['Recurring Cleaning', 'Weekly, biweekly, or monthly service options for families who want a consistently fresh home.']
]

const faqs = [
  ['What house cleaning services does Pristine Clean offer?', 'Pristine Clean offers standard house cleaning, deep cleaning, move-in and move-out cleaning, kitchen cleaning, bathroom cleaning, and recurring cleaning.'],
  ['Is Pristine Clean a Filipina-run cleaning business?', 'Yes. Pristine Clean is a Filipina-run cleaning business built around careful service, hospitality, reliability, and attention to detail.'],
  ['Can I schedule a cleaning online?', 'Yes. You can request a cleaning using the online form. The site is prepared for customer accounts, Stripe payments, and future booking management.'],
  ['Do you offer recurring house cleaning?', 'Yes. Customers can request weekly, biweekly, or monthly cleaning.'],
  ['Do customers pay before or at the time of cleaning?', 'The site is prepared for Stripe payments. Payments can be set up as deposits, full checkout, or payment at the time of cleaning.']
]

function App() {
  const [status, setStatus] = useState('')
  const [payStatus, setPayStatus] = useState('')

  async function submitSchedule(e) {
    e.preventDefault()
    setStatus('Sending request...')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('Request received. We will follow up to confirm details.')
      e.currentTarget.reset()
    } catch {
      setStatus('The form is ready, but the backend needs to be deployed/configured first.')
    }
  }

  async function startPayment() {
    setPayStatus('Opening secure checkout...')
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL')
    } catch {
      setPayStatus('Stripe is ready to connect. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare first.')
    }
  }

  return (
    <>
      <header className="site-header">
        <a href="/" className="logo">Pristine<span>Clean</span></a>
        <nav>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#schedule">Schedule</a>
          <a href="#faq">FAQ</a>
          <a className="nav-cta" href="#schedule">Book Now</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Filipina-run • Sacramento area • Detail-focused</p>
            <h1>A cleaner home, a calmer day, and details done right.</h1>
            <p>Pristine Clean helps busy families enjoy a fresh, peaceful home with careful cleaning, warm service, and a strong eye for the little things that make a room feel truly finished.</p>
            <div className="actions">
              <a className="button" href="#schedule">Schedule a Cleaning</a>
              <a className="button ghost" href="#services">View Services</a>
            </div>
          </div>
          <div className="hero-card">
            <img src="/assets/hero-clean-home.svg" alt="Clean sunlit living room" />
          </div>
        </section>

        <section className="trust-strip">
          <span><Sparkles size={18}/> Attentive details</span>
          <span><Heart size={18}/> Happy home feel</span>
          <span><ShieldCheck size={18}/> Secure client portal planned</span>
          <span><CreditCard size={18}/> Stripe-ready</span>
        </section>

        <section id="services" className="section">
          <p className="eyebrow">Cleaning services</p>
          <h2>Services customers can request</h2>
          <p className="section-intro">This first version clearly explains what Pristine Clean offers now while leaving room for more services, pricing, and booking automation later.</p>
          <div className="cards">
            {services.map(([title, body]) => (
              <article className="card" key={title}>
                <CheckCircle2 />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="section split">
          <div>
            <p className="eyebrow">About Pristine Clean</p>
            <h2>A Filipina-run cleaning business built on care, pride, and detail.</h2>
            <p>Pristine Clean reflects warmth, hospitality, careful service, and a genuine desire to help people feel comfortable in their homes.</p>
            <p>Whether the job is a basic refresh or a deeper clean, the goal is simple: leave the home looking better, feeling lighter, and ready for real life.</p>
          </div>
          <div className="feature-box"><Home /><h3>Designed for busy families</h3><p>Professional cleaning with a personal touch, clear communication, and a focus on homes that feel peaceful and welcoming.</p></div>
        </section>

        <section id="schedule" className="section booking">
          <div>
            <p className="eyebrow">Schedule online</p>
            <h2>Request a cleaning</h2>
            <p>This form posts to a Cloudflare Worker route. Later it can store bookings in D1, email the owner, create customer accounts, and connect to cleaner schedules.</p>
          </div>
          <form onSubmit={submitSchedule} className="form">
            <label>Name <input name="name" autoComplete="name" required /></label>
            <label>Email <input name="email" type="email" autoComplete="email" required /></label>
            <label>Phone <input name="phone" type="tel" autoComplete="tel" /></label>
            <label>Address or city <input name="address" /></label>
            <label>Service<select name="service" required><option value="">Choose a service</option>{services.map(([title]) => <option key={title}>{title}</option>)}</select></label>
            <label>Preferred date <input name="preferredDate" type="date" /></label>
            <label>Notes <textarea name="notes" rows="4" placeholder="Bedrooms, bathrooms, pets, special areas, timing, etc." /></label>
            <button className="button" type="submit"><CalendarCheck size={18}/> Send Request</button>
            <p className="status">{status}</p>
          </form>
        </section>

        <section className="section roadmap">
          <p className="eyebrow">Business platform foundation</p>
          <h2>Built to grow beyond a basic website</h2>
          <div className="cards three">
            <article className="card"><LogIn/><h3>Client accounts</h3><p>Prepared for customer login, saved cleaning history, addresses, booking requests, and secure customer details.</p></article>
            <article className="card"><Users/><h3>Cleaner dashboard</h3><p>Future cleaner schedules, job details, checklists, income, expenses, and mileage tracking.</p></article>
            <article className="card"><ClipboardList/><h3>Operations tools</h3><p>Future admin dashboard for jobs, recurring customers, payments, supplies, reports, reminders, and business metrics.</p></article>
          </div>
          <button className="button" onClick={startPayment}>Test Stripe Payment</button>
          <p className="status">{payStatus}</p>
        </section>

        <section id="faq" className="section faq">
          <p className="eyebrow">FAQ</p>
          <h2>House cleaning questions customers ask</h2>
          {faqs.map(([q,a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </section>
      </main>

      <footer className="site-footer"><p><strong>Pristine Clean</strong> — Filipina-run house cleaning for happy homes.</p><p>Sacramento, CA • <a href="tel:15307629826">530-762-9826</a> • <a href="mailto:brandon.tinder@gmail.com">brandon.tinder@gmail.com</a></p></footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
