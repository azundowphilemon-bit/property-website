"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import styles from './contact.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatusMsg({ 
          type: 'success', 
          text: 'Inquiry securely submitted! Falibari Administration has received your request and logged it to our Google Sheets monitoring system. An email copy has been dispatched.' 
        });
        setFormData({ name: '', email: '', mobile: '', message: '' });
      } else {
        const errData = await res.json();
        setStatusMsg({ 
          type: 'error', 
          text: errData.detail || 'Failed to submit inquiry. Please verify your connection.' 
        });
      }
    } catch {
      setStatusMsg({ 
        type: 'error', 
        text: 'Network error. Is the backend server running?' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Header Block */}
        <section className={`${styles.header} animate-fade-in`}>
          <span className={styles.badge}>ADMINISTRATIVE BOARD MEDIATION</span>
          <h1 className={styles.title}>
            Contact <span className="gradient-text">Falibari Board</span>
          </h1>
          <p className={styles.subtitle}>
            In compliance with our uncompromised escrow protection model, we do not expose direct agent contact numbers. All inquiries are securely funneled and mediated by Falibari Corporate Administration.
          </p>
        </section>

        {/* Content Layout */}
        <section className={styles.contentGrid}>
          {/* Glass Form Card */}
          <div className={`${styles.formCard} glass animate-fade-in`}>
            <h2>Secure Inquiry Form</h2>
            <p className={styles.formSub}>Your submission will be instantly logged in our corporate ledger and reviewed by the CEO Board.</p>
            
            {statusMsg.text && (
              <div className={`${styles.alert} ${statusMsg.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {statusMsg.type === 'success' ? '✓ ' : '⚠ '}
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  className="input-field"
                  placeholder="e.g. +233 24 000 0000"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="message">Detailed Message *</label>
                <textarea
                  id="message"
                  name="message"
                  className="input-field"
                  style={{ minHeight: '140px', resize: 'vertical' }}
                  placeholder="State your property request, listing intention, or corporate inquiry..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className={`${styles.submitBtn} btn-primary`} disabled={submitting}>
                {submitting ? 'Submitting Ledger Record...' : 'Submit Secure Inquiry'}
              </button>
            </form>
          </div>

          {/* Platform Security Information Card */}
          <div className={`${styles.infoCard} glass animate-fade-in`}>
            <div className={styles.securityIcon}>🔐</div>
            <h3>Why is contact mediated?</h3>
            <p>
              By ensuring all communications flow through Falibari Admin, we protect buyers from predatory solicitation and sellers from unverified accounts.
            </p>
            
            <div className={styles.infoDivider}></div>

            <div className={styles.infoDetails}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>CORPORATE CORRESPONDENCE</div>
                <div className={styles.infoValue}>falibari@yahoo.com</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>LEADERSHIP HEADQUARTERS</div>
                <div className={styles.infoValue}>Accra Metropolitan Area, Ghana</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>OFFICIAL LEDGER MONITORING</div>
                <div className={styles.infoValue}>Active (Google Sheets Webhook Sync)</div>
              </div>
            </div>

            <div className={styles.securitySeal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.sealIcon}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>100% Escrow Mediated Gateway</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
