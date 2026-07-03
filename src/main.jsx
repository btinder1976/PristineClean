import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarCheck, CheckCircle2, CreditCard, Home, Mail, MapPin, Phone, ShieldCheck, Sparkles, Star, Users, Wand2 } from 'lucide-react'
import './styles.css'

const contact = {
  phone: '530-762-9826',
  phoneHref: 'tel:15307629826',
  email: 'brandon.tinder@gmail.com',
  emailHref: 'mailto:brandon.tinder@gmail.com',
  city: 'Sacramento, CA',
  url: 'https://pristineclean.pages.dev'
}

const services = [
  ['Standard Cleaning', 'Maintenance cleaning for kitchens, bathrooms, bedrooms, living areas, dusting, floors, and high-touch surfaces.', 'Great for weekly, biweekly, or monthly upkeep.'],
  ['Deep Cleaning', 'Extra detail for buildup, baseboards, cabinet fronts, appliance exteriors, tubs, showers, and overlooked areas.', 'Best for first-time cleans or homes that need a reset.'],
  ['Move-In / Move-Out', 'A thorough clean for homes, apartments, rentals, and turnovers before moving in or after moving out.', 'Helpful for landlords, renters, buyers, and sellers.'],
  ['Recurring Cleaning', 'Reliable repeat cleaning that keeps the home fresh without having to start over every visit.', 'Weekly, biweekly, and monthly options.'],
  ['Kitchen & Bathroom Detail', 'Focused cleaning for the rooms customers notice most: sinks, counters, fixtures, showers, tubs, toilets, and floors.', 'A strong choice before guests or events.'],
  ['Apartment & Small Office', 'Simple cleaning support for apartments, home offices, and small local businesses.', 'Available as a custom request.']
]

const process = [
  ['Request', 'Send the form with your home details, preferred date, and cleaning needs.'],
  ['Confirm', 'We follow up to confirm timing, scope, and any special instructions.'],
  ['Clean', 'Your cleaner arrives prepared, follows the checklist, and focuses on the details.'],
  ['Pay', 'Pay securely through Stripe or at the time of cleaning once payment options are finalized.']
]

const faqs = [
  ['What areas does Pristine Clean serve?', 'Pristine Clean is starting in the Sacramento area, with service planned for nearby communities such as Orangevale, Citrus Heights, Roseville, and Folsom.'],
  ['What cleaning services can I request?', 'You can request standard cleaning, deep cleaning, move-in or move-out cleaning, recurring cleaning, kitchen and bathroom detail cleaning, apartment cleaning, and small office cleaning.'],
  ['Is Pristine Clean Filipina-run?', 'Yes. Pristine Clean is a Filipina-run cleaning business built around hospitality, careful work, reliability, and attention to detail.'],
  ['Can I schedule online?', 'Yes. The form on this site collects the cleaning request and prepares the information needed to confirm the appointment.'],
  ['Can I pay online?', 'Stripe payment support is being connected for deposits, full cleaning payments, and future invoices. For now, the payment button is ready for Stripe configuration.'],
  ['Do you offer recurring cleaning?', 'Yes. Customers can request weekly, biweekly, or monthly cleaning. Recurring scheduling and reminders are planned in the next update.']
]

function App() {
  const [status, setStatus] = useState('')
  const [payStatus, setPayStatus] = useState('')

  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${contact.url}/#business`,
        name: 'Pristine Clean',
        url: contact.url,
        description: 'Filipina-run house cleaning business serving Sacramento-area homes with detail-focused standard cleaning, deep cleaning, move-in and move-out cleaning, and recurring cleaning.',
        telephone: '+1-530-762-9826',
        email: contact.email,
        address: { '@type': 'PostalAddress', addressLocality: 'Sacramento', addressRegion: 'CA', addressCountry: 'US' },
        areaServed: ['Sacramento CA', 'Orangevale CA', 'Citrus Heights CA', 'Roseville CA', 'Folsom CA'],
        priceRange: '$$'
      },
      {
        '@type': 'Service',
        '@id': `${contact.url}/#services`,
        name: 'Residential house cleaning services',
        provider: { '@id': `${contact.url}/#business` },
        areaServed: 'Sacramento, CA',
        serviceType: services.map(([name]) => name)
      },
      {
        '@type': 'FAQPage',
        '@id': `${contact.url}/#faq`,
        mainEntity: faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }))
      }
    ]
  }), [])

  async function submitSchedule(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setStatus('Sending your request...')

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('API not ready')
      setStatus('Request received. We will follow up to confirm your cleaning.')
      form.reset()
    } catch {
      const subject = encodeURIComponent(`Cleaning request from ${data.name || 'website visitor'}`)
      const body = encodeURIComponent(`Name: ${data.name || ''}\nPhone: ${data.phone || ''}\nEmail: ${data.email || ''}\nAddress/City: ${data.address || ''}\nService: ${data.service || ''}\nPreferred date: ${data.preferredDate || ''}\nPreferred time: ${data.preferredTime || ''}\nHome size: ${data.homeSize || ''}\nNotes: ${data.notes || ''}`)
      window.location.href = `${contact.emailHref}?subject=${subject}&body=${body}`
      setStatus('Your email app should open with the cleaning request ready to send.')
    }
  }

  async function startPayment() {
    setPayStatus('Opening secure Stripe checkout...')
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST' })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else throw new Error('Stripe not configured')
    } catch {
      setPayStatus('Stripe is connected, but the live checkout key/price still needs to be added in Cloudflare. For now, customers can request service and pay at cleaning.')
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="site-header">
        <a href="/" className="logo">Pristine<span>Clean</span></a>
        <nav>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
          <a href="#schedule">Book</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="nav-call" href={contact.phoneHref}>{contact.phone}</a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Filipina-run cleaning care in Sacramento</p>
            <h1>A happier, cleaner home without losing your weekend.</h1>
            <p className="lead">Pristine Clean helps busy families enjoy a brighter home with careful house cleaning, warm service, and detail-focused work that makes every room feel reset.</p>
            <div className="actions">
              <a className="button" href="#schedule"><CalendarCheck size={18}/> Request Cleaning</a>
              <a className="button ghost" href={contact.phoneHref}><Phone size={18}/> Call {contact.phone}</a>
            </div>
            <div className="hero-badges">
              <span><ShieldCheck size={16}/> Secure payment ready</span>
              <span><Sparkles size={16}/> Detail-focused</span>
              <span><MapPin size={16}/> Sacramento area</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/assets/hero-clean-home.svg" alt="Bright clean home after Pristine Clean service" />
            <div className="quote-card"><Star size={18}/><strong>Built for trust.</strong><span>Clear requests, secure payments, and a professional cleaning experience.</span></div>
          </div>
        </section>

        <section className="trust-strip">
          <span>Standard cleaning</span><span>Deep cleaning</span><span>Move-in / move-out</span><span>Recurring service</span>
        </section>

        <section id="services" className="section">
          <p className="eyebrow">Services</p>
          <h2>Cleaning services customers can book now</h2>
          <p className="section-intro">Start with a request today. Pricing can be confirmed after the home size, condition, and cleaning level are reviewed.</p>
          <div className="cards">
            {services.map(([title, body, note]) => <article className="card" key={title}><CheckCircle2/><h3>{title}</h3><p>{body}</p><small>{note}</small></article>)}
          </div>
        </section>

        <section id="about" className="section split warm">
          <div>
            <p className="eyebrow">About us</p>
            <h2>A Filipina-run business built on care, pride, and attention to detail.</h2>
            <p>Pristine Clean was created to bring the feeling of a fresh, peaceful home to Sacramento-area families. The service reflects Filipino hospitality: careful work, respect for the home, and a desire to make life easier for the customer.</p>
            <p>This first production version is ready for customer requests now, and the platform will continue growing with scheduling, customer accounts, cleaner dashboards, payments, and business reporting.</p>
          </div>
          <div className="owner-panel">
            <Home/><h3>What customers should feel</h3><ul><li>A home that feels lighter and more peaceful</li><li>Clear communication before the visit</li><li>Detail-focused cleaning in high-use spaces</li><li>A local business they can trust and rebook</li></ul></div>
        </section>

        <section className="section process">
          <p className="eyebrow">How it works</p>
          <h2>Simple enough to start using today</h2>
          <div className="steps">{process.map(([title, body], index) => <article key={title}><span>{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
        </section>

        <section id="schedule" className="section booking">
          <div>
            <p className="eyebrow">Book or request a quote</p>
            <h2>Tell us what you need cleaned.</h2>
            <p>Use this request form today. If the backend is not fully connected yet, it automatically opens an email with all details filled in so no lead is lost.</p>
            <div className="contact-grid"><a href={contact.phoneHref}><Phone/> {contact.phone}</a><a href={contact.emailHref}><Mail/> {contact.email}</a><span><MapPin/> {contact.city}</span></div>
          </div>
          <form onSubmit={submitSchedule} className="form">
            <label>Name<input name="name" autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
            <label>Address or city<input name="address" required /></label>
            <label>Service<select name="service" required><option value="">Choose a service</option>{services.map(([title]) => <option key={title}>{title}</option>)}</select></label>
            <label>Home size<select name="homeSize"><option>Not sure yet</option><option>Apartment / condo</option><option>1-2 bedrooms</option><option>3 bedrooms</option><option>4+ bedrooms</option><option>Small office</option></select></label>
            <label>Preferred date<input name="preferredDate" type="date" /></label>
            <label>Preferred time<select name="preferredTime"><option>Flexible</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
            <label className="full">Notes<textarea name="notes" rows="4" placeholder="Bedrooms, bathrooms, pets, special areas, parking, gate code, or timing details." /></label>
            <button className="button full" type="submit"><CalendarCheck size={18}/> Send Cleaning Request</button>
            <p className="status">{status}</p>
          </form>
        </section>

        <section id="payment" className="section payment">
          <div><p className="eyebrow">Payments</p><h2>Stripe-ready secure payment flow</h2><p>Customers can request a cleaning now. Stripe Checkout is planned for deposits, full payments, and future invoices once the live Stripe environment values are added in Cloudflare.</p></div>
          <div className="payment-card"><CreditCard/><h3>Payment options for Phase 1</h3><p>Pay at the cleaning today, then add Stripe deposits or full checkout when pricing is finalized.</p><button className="button" onClick={startPayment}>Test Stripe Checkout</button><p className="status">{payStatus}</p></div>
        </section>

        <section id="reviews" className="section reviews">
          <p className="eyebrow">Trust builders</p><h2>Designed to earn repeat customers</h2>
          <div className="cards three"><article className="card"><Star/><h3>Detail matters</h3><p>Small details in kitchens, bathrooms, floors, and surfaces make the whole home feel better.</p></article><article className="card"><Users/><h3>Family-friendly</h3><p>A warm, respectful cleaning experience for busy households and working families.</p></article><article className="card"><Wand2/><h3>Ready to grow</h3><p>This site will expand with customer accounts, cleaner schedules, reminders, and admin tools.</p></article></div>
        </section>

        <section id="faq" className="section faq">
          <p className="eyebrow">FAQ</p><h2>House cleaning questions customers ask</h2>
          {faqs.map(([q,a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </section>
      </main>

      <footer className="site-footer"><strong>Pristine Clean</strong><p>Filipina-run house cleaning for Sacramento-area homes.</p><p><a href={contact.phoneHref}>{contact.phone}</a> · <a href={contact.emailHref}>{contact.email}</a> · {contact.city}</p></footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
