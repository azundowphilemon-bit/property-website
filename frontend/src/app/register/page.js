"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '../auth.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    mobile: '',
    registration_message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(result.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network Error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={`${styles.authCard} animate-fade-in`} style={{ marginTop: '4rem' }}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Falibari Estate today</p>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.error} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.2)' }}>{success}</div>}

          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                className={styles.input}
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input 
                type="email" 
                className={styles.input}
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
              <input 
                type="tel" 
                className={styles.input}
                placeholder="+233 XX XXX XXXX"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Password</label>
              <input 
                type="password" 
                className={styles.input}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>How did you hear about us?</label>
              <select 
                className={styles.input}
                value={formData.registration_message}
                onChange={(e) => setFormData({...formData, registration_message: e.target.value})}
                required
              >
                <option value="" disabled>Select an option</option>
                <option value="Social Media">Social Media (Facebook, Instagram, etc.)</option>
                <option value="Friend/Family">From a Friend or Family member</option>
                <option value="Google Search">Google Search</option>
                <option value="Radio/TV">Radio / TV Advertisement</option>
                <option value="Real Estate Blog">Real Estate Blog or News</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className={styles.footer}>
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </main>
    </>
  );
}
