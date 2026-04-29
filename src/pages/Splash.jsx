import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import nbscLogo from '../assets/nbsc-logo.png';
import gcoLogo from '../assets/gco-logo.png';
import './Splash.css';

const SESSION_DURATION = 24 * 60 * 60 * 1000;

function Splash() {
  const history = useHistory();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authTime = localStorage.getItem('authTime');
    if (isAuthenticated === 'true' && authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      if (elapsed < SESSION_DURATION) {
        history.replace('/dashboard');
      }
    }
  }, [history]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-root">

      {/* NAV */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <img src={gcoLogo} alt="GCO" className="lp-nav-logo" />
            <span className="lp-nav-name">GCO — DMS</span>
          </div>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => history.push('/about')}>About</button>
            <button className="lp-nav-link" onClick={() => history.push('/contact')}>Contact</button>
          </div>
          <button className="lp-nav-btn" onClick={() => history.push('/login')}>
            Sign In
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-glow lp-hero-glow--1" />
        <div className="lp-hero-glow lp-hero-glow--2" />

        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Secure · Encrypted · Organized
          </div>

          <div className="lp-hero-logos">
            <img src={nbscLogo} alt="NBSC" className="lp-hero-logo" />
            <div className="lp-hero-logo-divider" />
            <img src={gcoLogo} alt="GCO" className="lp-hero-logo" />
          </div>

          <h1 className="lp-hero-title">
            Guidance Counseling Office<br />
            <span className="lp-hero-title-accent">Document Management System</span>
          </h1>

          <p className="lp-hero-desc">
            A secure, password-protected platform for managing confidential office documents
            at Northern Bukidnon State College.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => history.push('/login')}>
              Access System
              <span className="lp-btn-arrow">→</span>
            </button>
            <a href="#features" className="lp-btn-ghost">Learn more ↓</a>
          </div>
        </div>

        <div className="lp-hero-scroll-hint">
          <div className="lp-scroll-dot" />
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="lp-stats">
        <div className="lp-stats-inner">
          {[
            { icon: '🔒', label: 'End-to-end encrypted' },
            { icon: '📁', label: 'Password-protected folders' },
            { icon: '🏷️', label: '4 classification levels' },
            { icon: '☁️', label: 'Cloud-backed storage' },
          ].map((s, i) => (
            <div key={i} className="lp-stat-item">
              <span className="lp-stat-icon">{s.icon}</span>
              <span className="lp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-tag">Features</span>
            <h2 className="lp-section-title">Everything you need to manage documents securely</h2>
            <p className="lp-section-sub">Built specifically for the NBSC Guidance Counseling Office workflow.</p>
          </div>

          <div className="lp-features-grid">
            {[
              {
                icon: '🔐',
                title: 'Folder Password Protection',
                desc: 'Each folder is secured with its own SHA-256 hashed password. Only authorized personnel can access the contents.',
              },
              {
                icon: '🏷️',
                title: 'Classification Levels',
                desc: 'Organize documents as Public, Internal, Confidential, or Restricted — matching standard document security practices.',
              },
              {
                icon: '☁️',
                title: 'Dual Cloud Storage',
                desc: 'Files upload to Cloudinary first for fast delivery. Automatically falls back to Supabase Storage when needed.',
              },
              {
                icon: '🗄️',
                title: 'Archive & Restore',
                desc: 'Soft-delete folders and individual files. Nothing is permanently lost until you choose to delete it.',
              },
              {
                icon: '👁️',
                title: 'In-Browser Preview',
                desc: 'View PDFs and images directly in the browser without downloading. Supports ZIP download for bulk exports.',
              },
              {
                icon: '📋',
                title: 'Persistent Audit Log',
                desc: 'Every action — uploads, views, downloads, deletions — is logged to the database for accountability.',
              },
            ].map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-tag">How it works</span>
            <h2 className="lp-section-title">Simple, secure, three steps</h2>
          </div>

          <div className="lp-steps">
            {[
              { num: '01', title: 'Sign in with master key', desc: 'Access is protected by a master key with brute-force lockout after 5 failed attempts.' },
              { num: '02', title: 'Upload & organize', desc: 'Create folders with classification levels, set folder passwords, and upload PDF or image files.' },
              { num: '03', title: 'Access & manage', desc: 'Preview, download, rename, archive, or export files as ZIP — all from one secure interface.' },
            ].map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to get started?</h2>
          <p className="lp-cta-sub">Sign in with your master key to access the document management system.</p>
          <button className="lp-btn-primary lp-btn-large" onClick={() => history.push('/login')}>
            Access System
            <span className="lp-btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src={nbscLogo} alt="NBSC" className="lp-footer-logo" />
            <div>
              <div className="lp-footer-name">Northern Bukidnon State College</div>
              <div className="lp-footer-office">Guidance Counseling Office</div>
            </div>
          </div>
          <div className="lp-footer-right">
            <div className="lp-footer-nav-links">
              <button className="lp-footer-privacy" onClick={() => history.push('/about')}>About Us</button>
              <button className="lp-footer-privacy" onClick={() => history.push('/contact')}>Contact</button>
              <button className="lp-footer-privacy" onClick={() => history.push('/privacy')}>Privacy Policy</button>
            </div>
            <div className="lp-footer-copy">
              © {new Date().getFullYear()} NBSC Guidance Counseling Office. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Splash;
