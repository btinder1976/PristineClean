import React from 'react'
import { CalendarCheck } from 'lucide-react'

const services = ['Standard Cleaning', 'Deep Cleaning', 'Move-In / Move-Out', 'Recurring Cleaning']

export default function ScheduleBookPage({ submitSchedule, status }) {
  return <section className="screen book-screen">
    <div className="page-intro">
      <p className="eyebrow">Book online</p>
      <h1>Request a cleaning with calendar availability.</h1>
      <p>Choose an exact time and estimated duration so Pristine Clean can check the parent Google Calendar before accepting the request.</p>
    </div>
    <form onSubmit={submitSchedule} className="app-card booking-form">
      <div className="form-section"><span>1</span><h3>Your contact</h3></div>
      <label>Name<input name="name" autoComplete="name" required /></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <div className="form-section"><span>2</span><h3>Your home</h3></div>
      <label>Address<input name="address" autoComplete="street-address" required /></label>
      <label>Home size<select name="homeSize"><option>Not sure yet</option><option>Apartment / condo</option><option>1-2 bedrooms</option><option>3 bedrooms</option><option>4+ bedrooms</option><option>Small office</option></select></label>
      <label>Service<select name="service" required><option value="">Choose a service</option>{services.map(service => <option key={service}>{service}</option>)}</select></label>
      <div className="form-section"><span>3</span><h3>Calendar request</h3></div>
      <label>Preferred date<input name="preferredDate" type="date" required /></label>
      <label>Preferred time<input name="preferredTime" type="time" required /></label>
      <label>Estimated duration<select name="estimatedDuration" defaultValue="120"><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option><option value="300">5 hours</option><option value="360">6 hours</option></select></label>
      <label className="wide">Notes<textarea name="notes" rows="4" placeholder="Bedrooms, bathrooms, pets, special areas, parking, gate code, or timing details." /></label>
      <button className="button wide" type="submit"><CalendarCheck size={18}/> Check Calendar & Request Cleaning</button>
      <p className="status wide">{status}</p>
    </form>
  </section>
}
