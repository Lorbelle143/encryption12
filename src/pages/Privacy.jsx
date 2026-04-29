import React from 'react';
import { useHistory } from 'react-router-dom';
import nbscLogo from '../assets/nbsc-logo.png';
import './Privacy.css';

function Privacy() {
  const history = useHistory();

  return (
    <div className="privacy-root">

      {/* NAV */}
      <nav className="privacy-nav">
        <div className="privacy-nav-inner">
          <button className="privacy-back-btn" onClick={() => history.push('/')}>
            ← Back to Home
          </button>
          <div className="privacy-nav-brand">
            <img src={nbscLogo} alt="NBSC" className="privacy-nav-logo" />
            <span>NBSC GCO — DMS</span>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="privacy-main">
        <div className="privacy-inner">

          <div className="privacy-header">
            <div className="privacy-icon">🔒</div>
            <h1>Privacy Policy</h1>
            <p className="privacy-effective">Effective Date: January 1, 2025</p>
            <p className="privacy-intro">
              This Privacy Policy explains how the NBSC Guidance Counseling Office Document
              Management System ("the System") collects, uses, and protects information. By
              accessing the System, you agree to the practices described below.
            </p>
          </div>

          <div className="privacy-sections">

            <section className="privacy-section">
              <h2>1. Who This System Is For</h2>
              <p>
                This System is an internal tool exclusively for authorized personnel of the
                Guidance Counseling Office of Northern Bukidnon State College (NBSC). It is
                not a public-facing service and is not intended for use by students, external
                parties, or the general public.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. Information We Store</h2>
              <p>The System stores the following types of data:</p>
              <ul>
                <li>
                  <strong>Uploaded documents</strong> — PDF files and images uploaded by
                  authorized administrators. These may include office forms and internal records.
                </li>
                <li>
                  <strong>Folder metadata</strong> — folder names, classification levels, notes,
                  and file counts stored in the database.
                </li>
                <li>
                  <strong>Audit log entries</strong> — records of actions performed within the
                  System (e.g., uploads, downloads, views, deletions) including timestamps.
                  No personal identity is attached to these logs beyond the action type.
                </li>
                <li>
                  <strong>Session data</strong> — a temporary session token stored in your
                  browser's localStorage to maintain your login state. This expires after 24 hours.
                </li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. How We Use Your Information</h2>
              <p>Data stored in the System is used solely for:</p>
              <ul>
                <li>Organizing and retrieving office documents securely</li>
                <li>Maintaining an audit trail for accountability purposes</li>
                <li>Enforcing access control and session management</li>
              </ul>
              <p>
                We do not use any stored data for marketing, analytics, profiling, or any
                purpose outside of the System's core document management function.
              </p>
            </section>

            <section className="privacy-section">
              <h2>4. Data Storage & Third-Party Services</h2>
              <p>The System uses the following third-party infrastructure:</p>
              <ul>
                <li>
                  <strong>Supabase</strong> — used for database storage (folder metadata,
                  audit logs, settings) and as a fallback file storage provider. Supabase
                  processes data in accordance with their{' '}
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong>Cloudinary</strong> — used as the primary file storage provider for
                  uploaded documents. Files are stored on Cloudinary's servers. Cloudinary
                  processes data in accordance with their{' '}
                  <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>.
                </li>
              </ul>
              <p>
                No data is sold, shared, or transferred to any other third party.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Security Measures</h2>
              <p>The System implements the following security controls:</p>
              <ul>
                <li>Master key authentication with SHA-256 hashing — plaintext passwords are never stored</li>
                <li>Per-folder password protection with SHA-256 hashed passwords</li>
                <li>Brute-force lockout after 5 failed login attempts (15-minute cooldown)</li>
                <li>Session expiry after 24 hours with automatic logout</li>
                <li>All data transmitted over HTTPS</li>
                <li>Files stored in private Supabase Storage buckets (not publicly accessible)</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>6. Data Retention</h2>
              <p>
                Documents and folder records are retained until explicitly deleted by an
                authorized administrator. Archived items are soft-deleted and can be
                permanently removed at the administrator's discretion. Audit log entries
                are retained indefinitely for accountability purposes.
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. Access Control</h2>
              <p>
                Access to the System is restricted to individuals who possess the master key.
                There is no self-registration or public sign-up. The master key is managed
                exclusively by the Guidance Counseling Office administrator.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Cookies & Local Storage</h2>
              <p>
                The System does not use cookies. It uses browser <code>localStorage</code> to
                store your session token and a local copy of recent audit log entries. This
                data is stored only on your device and is cleared when you log out or when
                your session expires.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Changes to This Policy</h2>
              <p>
                This Privacy Policy may be updated from time to time. The effective date at
                the top of this page will reflect the most recent revision. Continued use of
                the System after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. Contact</h2>
              <p>
                For questions or concerns regarding this Privacy Policy, please contact the
                Guidance Counseling Office of Northern Bukidnon State College directly.
              </p>
            </section>

          </div>

          <div className="privacy-footer-note">
            <p>© {new Date().getFullYear()} NBSC Guidance Counseling Office. All rights reserved.</p>
            <button className="privacy-back-link" onClick={() => history.push('/')}>
              ← Back to Home
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Privacy;
