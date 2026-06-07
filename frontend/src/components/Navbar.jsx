"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
    window.location.href = '/'; // Redirect home
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} onClick={() => setIsOpen(false)}>
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
        
        <button 
          className={styles.hamburger} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        <div className={`${styles.menuContainer} ${isOpen ? styles.menuOpen : ''}`}>
          <div className={styles.links}>
            <Link href="/" onClick={() => setIsOpen(false)} className={styles.link} style={{ color: pathname === '/' ? 'var(--accent-primary)' : '' }}>Home</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className={styles.link} style={{ color: pathname === '/about' ? 'var(--accent-primary)' : '' }}>About Us</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className={styles.link} style={{ color: pathname === '/contact' ? 'var(--accent-primary)' : '' }}>Contact</Link>
            {currentUser?.role === 'Admin' && (
              <Link href="/admin" onClick={() => setIsOpen(false)} className={styles.link} style={{ color: pathname === '/admin' ? 'var(--accent-primary)' : '' }}>Admin Dashboard</Link>
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
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className={styles.authButton} style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
                      Buy Property
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className={styles.primaryButton}>
                      Sell Property
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                {pathname !== '/admin' && (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)} className={styles.authButton}>
                      Login
                    </Link>
                    <Link href="/register" onClick={() => setIsOpen(false)} className={styles.primaryButton}>
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
