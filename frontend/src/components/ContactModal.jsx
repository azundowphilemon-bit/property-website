"use client";

import { useState } from 'react';
import styles from './ContactModal.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function ContactModal({ isOpen, onClose, defaultMessage, propertyId }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      mobile: formData.get('mobile'),
      message: formData.get('message')
    };

    try {
      let endpoint = `${API}/api/contact`;
      let payload = data;
      let headers = { 'Content-Type': 'application/json' };
      
      const token = localStorage.getItem('token');
      if (token && propertyId) {
        endpoint = `${API}/api/inquiries`;
        payload = { property_id: propertyId, message: data.message };
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        alert("Failed to send message");
      }
    } catch (err) {
      alert("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        {success ? (
          <div className={styles.successState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h3>Message Sent!</h3>
            <p>Our team will contact you shortly.</p>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Contact Management</h2>
            <p className={styles.subtitle}>Directly reach our CEOs (Philemon, Albert, Tommy) regarding this property.</p>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.group}>
                  <label>Full Name</label>
                  <input type="text" name="name" required className="input-field" placeholder="John Doe" />
                </div>
                <div className={styles.group}>
                  <label>Email</label>
                  <input type="email" name="email" required className="input-field" placeholder="john@example.com" />
                </div>
              </div>
              
              <div className={styles.group}>
                <label>Mobile Number</label>
                <input type="tel" name="mobile" required className="input-field" placeholder="+233 XXX XXX XXXX" />
              </div>
              
              <div className={styles.group}>
                <label>Message</label>
                <textarea 
                  name="message" 
                  required 
                  className="input-field" 
                  rows="4" 
                  defaultValue={defaultMessage}
                  placeholder="How can we help you?"
                />
              </div>
              
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
