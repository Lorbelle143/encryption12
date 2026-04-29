import React from 'react';
import { useHistory } from 'react-router-dom';
import nbscLogo from '../assets/nbsc-logo.png';
import gcoLogo from '../assets/gco-logo.png';
import './AboutUs.css';

function AboutUs() {
  const history = useHistory();

  return (
    <div className="about-root">

      {/* NAV */}
      <nav className="about-nav">
        <div className="about-nav-inner">
          <button className="about-back-btn" onClick={() => history.push('/')}>
            ← Back to Home
          </button>
          <div className="about-nav-brand">
            <img src={gcoLogo} alt="GCO" className="about-nav-logo" />
            <span>NBSC GCO — DMS</span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-glow" />
        <div className="about-hero-inner">
          <span className="about-tag">About Us</span>
          <h1>Guidance Counseling Office</h1>
          <p className="about-hero-sub">Northern Bukidnon State College</p>
          <p className="about-hero-desc">
            Dedicated to the holistic development of every NBSC student through
            professional guidance, counseling, and support services.
          </p>
        </div>
      </section>

      {/* LOGOS */}
      <section className="about-logos-section">
        <div className="about-section-inner">
          <div className="about-logos-row">
            <div className="about-logo-card">
              <img src={nbscLogo} alt="NBSC Logo" className="about-logo-img" />
              <div className="about-logo-label">Northern Bukidnon State College</div>
            </div>
            <div className="about-logo-divider" />
            <div className="about-logo-card">
              <img src={gcoLogo} alt="GCO Logo" className="about-logo-img" />
              <div className="about-logo-label">Guidance Counseling Office</div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION VISION */}
      <section className="about-mv">
        <div className="about-section-inner">
          <div className="about-mv-grid">
            <div className="about-mv-card">
              <div className="about-mv-icon">🎯</div>
              <h2>Mission</h2>
              <p>
                To provide comprehensive, accessible, and professional guidance and
                counseling services that empower students to achieve their full academic,
                personal, and career potential in a safe and supportive environment.
              </p>
            </div>
            <div className="about-mv-card">
              <div className="about-mv-icon">🌟</div>
              <h2>Vision</h2>
              <p>
                A center of excellence in student development and well-being, fostering
                a community where every student is guided, supported, and equipped to
                thrive in an ever-changing world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT THE SYSTEM */}
      <section className="about-system">
        <div className="about-section-inner">
          <div className="about-system-inner">
            <div className="about-section-header">
              <span className="about-tag">The System</span>
              <h2>About This Document Management System</h2>
              <p>
                The GCO Document Management System (DMS) is a secure, web-based platform
                developed exclusively for the internal use of the NBSC Guidance Counseling
                Office. It was built to address the need for a centralized, organized, and
                secure way to manage confidential office documents.
              </p>
            </div>

            <div className="about-system-cards">
              {[
                {
                  icon: '🔐',
                  title: 'Built for Security',
                  desc: 'Every document is stored behind password-protected folders with SHA-256 encryption. Access is restricted to authorized administrators only.',
                },
                {
                  icon: '📂',
                  title: 'Organized by Classification',
                  desc: 'Documents are categorized as Public, Internal, Confidential, or Restricted — following standard document security practices.',
                },
                {
                  icon: '☁️',
                  title: 'Cloud-Backed Storage',
                  desc: 'Files are stored on Cloudinary with automatic fallback to Supabase Storage, ensuring reliability and availability.',
                },
                {
                  icon: '📋',
                  title: 'Full Audit Trail',
                  desc: 'Every action — uploads, views, downloads, and deletions — is logged persistently for accountability and transparency.',
                },
              ].map((c, i) => (
                <div key={i} className="about-sys-card">
                  <div className="about-sys-icon">{c.icon}</div>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <h2>Have questions or concerns?</h2>
          <p>Reach out to the Guidance Counseling Office directly.</p>
          <div className="about-cta-btns">
            <button className="about-btn-primary" onClick={() => history.push('/contact')}>
              Contact Us →
            </button>
            <button className="about-btn-ghost" onClick={() => history.push('/login')}>
              Access System
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="about-footer">
        <div className="about-footer-inner">
          <div className="about-footer-links">
            <button onClick={() => history.push('/')}>Home</button>
            <button onClick={() => history.push('/contact')}>Contact</button>
            <button onClick={() => history.push('/privacy')}>Privacy Policy</button>
          </div>
          <p>© {new Date().getFullYear()} NBSC Guidance Counseling Office. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default AboutUs;
