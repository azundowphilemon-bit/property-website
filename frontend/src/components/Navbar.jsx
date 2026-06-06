"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Client-side only
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    window.location.href = '/'; // Redirect home
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Falibari <span>Estate</span>
        </Link>
        
        <div className={styles.links}>
          <Link href="/" className={styles.link} style={{ color: pathname === '/' ? 'var(--accent-primary)' : '' }}>Home</Link>
          <Link href="/about" className={styles.link} style={{ color: pathname === '/about' ? 'var(--accent-primary)' : '' }}>About Us</Link>
          <Link href="/contact" className={styles.link} style={{ color: pathname === '/contact' ? 'var(--accent-primary)' : '' }}>Contact</Link>
          {currentUser?.role === 'Admin' && (
            <Link href="/admin" className={styles.link} style={{ color: pathname === '/admin' ? 'var(--accent-primary)' : '' }}>Admin Dashboard</Link>
          )}
        </div>
        
        <div className={styles.actions}>
          {currentUser ? (
            <div className={styles.userMenu}>
              <div className={styles.greeting}>
                Hello, <span>{currentUser.full_name?.split(' ')[0] || 'User'}</span>
              </div>
              <button onClick={handleLogout} className={styles.authButton}>
                Logout
              </button>
              {pathname !== '/admin' && (
                <>
                  <Link href="/dashboard" className={styles.authButton} style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
                    Buy Property
                  </Link>
                  <Link href="/dashboard" className={styles.primaryButton}>
                    Sell Property
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {pathname !== '/admin' && (
                <>
                  <Link href="/login" className={styles.authButton}>
                    Login
                  </Link>
                  <Link href="/register" className={styles.primaryButton}>
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
