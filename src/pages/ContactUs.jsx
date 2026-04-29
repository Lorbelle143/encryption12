import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import gcoLogo from '../assets/gco-logo.png';
import nbscLogo from '../assets/nbsc-logo.png';
import './ContactUs.css';

function ContactUs() {
  const history = useHistory();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Opens default mail client with pre-filled content
    const mailto = `mailto:guidance@nbsc.edu.ph?subject=${encodeURIComponent(form.subject || 'Inquiry — GCO DMS')}&body=${encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )}`;
    window.location.href = mailto;
    setSubmitted(true);
  };

  return (
    <div className="contact-root">

      {/* NAV */}
      <nav className="contact-nav">
        <div className="contact-nav-inner">
          <button className="contact-back-btn" onClick={() => history.push('/')}>
            ← Back to Home
          </button>
          <div className="contact-nav-brand">
            <img src={gcoLogo} alt="GCO" className="contact-nav-logo" />
            <span>NBSC GCO — DMS</span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-glow" />
        <div className="contact-hero-inner">
          <span className="contact-tag">Contact Us</span>
          <h1>Get in Touch</h1>
          <p>
            Have a question, concern, or need assistance? Reach out to the
            NBSC Guidance Counseling Office.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="contact-main">
        <div className="contact-main-inner">

          {/* INFO CARDS */}
          <div className="contact-info-col">
            <h2 className="contact-info-title">Contact Information</h2>

            <div className="contact-info-cards">
              <div className="contact-info-card">
                <div className="contact-info-icon">📍</div>
                <div>
                  <div className="contact-info-label">Address</div>
                  <div className="contact-info-value">
                    Northern Bukidnon State College<br />
                    Manolo Fortich, Bukidnon<br />
                    Philippines
                  </div>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">📧</div>
                <div>
                  <div className="contact-info-label">Email</div>
                  <a href="mailto:guidance@nbsc.edu.ph" className="contact-info-value contact-link">
                    guidance@nbsc.edu.ph
                  </a>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">🕐</div>
                <div>
                  <div className="contact-info-label">Office Hours</div>
                  <div className="contact-info-value">
                    Monday – Friday<br />
                    8:00 AM – 5:00 PM
                  </div>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-info-icon">🏫</div>
                <div>
                  <div className="contact-info-label">Office</div>
                  <div className="contact-info-value">
                    Guidance Counseling Office<br />
                    Main Building, Ground Floor
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-nbsc-row">
              <img src={nbscLogo} alt="NBSC" className="contact-nbsc-logo" />
              <div>
                <div className="contact-nbsc-name">Northern Bukidnon State College</div>
                <div className="contact-nbsc-sub">Guidance Counseling Office</div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="contact-form-col">
            <h2 className="contact-form-title">Send a Message</h2>
            <p className="contact-form-sub">
              Fill out the form below and it will open your email client with the details pre-filled.
            </p>

            {submitted ? (
              <div className="contact-success">
                <div className="contact-success-icon">✅</div>
                <h3>Email client opened!</h3>
                <p>Your message details have been pre-filled. Please send the email from your mail app.</p>
                <button className="contact-btn-ghost" onClick={() => setSubmitted(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows="6"
                    required
                  />
                </div>

                <button type="submit" className="contact-btn-submit">
                  Open Email Client →
                </button>

                <p className="contact-form-note">
                  * This will open your default email app with the message pre-filled.
                </p>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="contact-footer">
        <div className="contact-footer-inner">
          <div className="contact-footer-links">
            <button onClick={() => history.push('/')}>Home</button>
            <button onClick={() => history.push('/about')}>About Us</button>
            <button onClick={() => history.push('/privacy')}>Privacy Policy</button>
          </div>
          <p>© {new Date().getFullYear()} NBSC Guidance Counseling Office. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default ContactUs;
