"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '../auth.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('password', formData.password);

      const response = await fetch(`${API}/api/auth/token`, {
        method: 'POST',
        body: data
      });

      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('role', result.role);
        
        const userData = { id: Number(result.user_id), role: result.role, full_name: result.full_name };
        localStorage.setItem('currentUser', JSON.stringify(userData));

        if (result.preferred_city_id) {
          localStorage.setItem('preferred_city_id', result.preferred_city_id);
        }
        
        router.push('/dashboard');
      } else {
        setError(result.detail || 'Authentication failed: Check your credentials');
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
        <div className={`${styles.authCard} animate-fade-in`}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to Falibari Estate</p>

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>Email or Mobile</label>
              <input 
                type="text" 
                className={styles.input}
                placeholder="Enter your email or mobile"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Password</label>
              <input 
                type="password" 
                className={styles.input}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.footer}>
            Don't have an account? <Link href="/register">Sign up</Link>
          </div>
        </div>
      </main>
    </>
  );
}
