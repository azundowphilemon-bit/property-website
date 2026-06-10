"use client";

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandSection}>
          <Link href="/" className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#footerGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" />
                </linearGradient>
              </defs>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Falibari <span>Estate</span>
          </Link>
          <p className={styles.description}>
            Discover luxury living spaces and secure property investments across Ghana. Managed with trust, backed by secure transaction escrow.
          </p>
        </div>

        <div className={styles.linksSection}>
          <h4>Quick Links</h4>
          <ul className={styles.linkList}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/dashboard">Portal Dashboard</Link></li>
          </ul>
        </div>

        <div className={styles.legalSection}>
          <h4>Legal & Security</h4>
          <ul className={styles.linkList}>
            <li><Link href="/terms">Terms & Conditions</Link></li>
            <li><Link href="/terms#escrow">Escrow Security</Link></li>
            <li><Link href="/terms#disputes">Dispute Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© {currentYear} Falibari Real Estate. All rights reserved.</p>
      </div>
    </footer>
  );
}
