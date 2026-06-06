"use client";

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from './about.module.css';

export default function AboutUs() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        
        {/* Luxury Hero Section (Inspired by Sotheby's Elite Branding) */}
        <section className={`${styles.hero} animate-fade-in`}>
          <div className={styles.heroGlow}></div>
          <span className={styles.badge}>THE ART OF SECURE REAL ESTATE</span>
          <h1 className={styles.heroTitle}>
            Where Exquisite Living Meets <span className="gradient-text">Absolute Security</span>
          </h1>
          <p className={styles.heroSub}>
            Falibari Estate is West Africa's premier, fully-mediated property ecosystem. Combining the luxurious aspiration of global real estate with the rigorous data transparency of modern tech, we protect your legacy by eliminating all transaction risks.
          </p>
          <div className={styles.heroActions}>
            <Link href="/dashboard" className="btn-primary">
              Explore Curated Estates
            </Link>
            <Link href="/register" className="btn-secondary">
              Create Secure Profile
            </Link>
          </div>
        </section>

        {/* Dynamic Trust Stats Banner (Inspired by Zillow's Data Focus) */}
        <section className={styles.statsBanner}>
          <div className={`${styles.statsContainer} glass`}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Property Deed Verification</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>GHS 0</div>
              <div className={styles.statLabel}>Prepayment Risk Rate</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>16</div>
              <div className={styles.statLabel}>Ghanaian Regions Covered</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1:1</div>
              <div className={styles.statLabel}>Admin-Mediated Encryption</div>
            </div>
          </div>
        </section>

        {/* The Brand Narrative (Sotheby's Aspirational Storytelling Model) */}
        <section className={styles.missionSection}>
          <div className={`${styles.missionCard} glass`}>
            <div className={styles.missionAccent}></div>
            <span className={styles.sectionSubtitle}>OUR HERITAGE</span>
            <h2>Architecting a New Standard of Trust</h2>
            <p>
              In a rapidly growing property market, the greatest luxury is not Italian marble or infinity pools—**it is peace of mind.** For too long, families and builders in West Africa have faced systemic risks: untrusted anonymous agents, duplicate property sales, and unsecured pre-payments.
            </p>
            <p className={styles.accentText}>
              <strong>Falibari Estate was established to change this narrative.</strong> By combining state-of-the-art transaction monitoring with an offline, physical document escrow gate, we have created a flawless ecosystem. We take complete custody of the risk so that you can focus on the beauty of your investment.
            </p>
          </div>
        </section>

        {/* The Five Pillars of Uncompromised Security */}
        <section className={styles.servicesSection}>
          <span className={styles.sectionSubtitle}>THE FALIBARI PROMISE</span>
          <h2 className={styles.sectionTitle}>
            The Pillars of <span className="gradient-text">Bespoke Mediation</span>
          </h2>
          <p className={styles.sectionSub}>
            We have engineered a secure, escrow-style transaction model that handles every administrative layer automatically, leaving no room for side-deals, fraud, or buyer risk.
          </p>

          <div className={styles.servicesGrid}>
            {/* Pillar 1 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>🛡️</div>
              <h3>1. Secure Document Escrow</h3>
              <p>
                We serve as the trusted custodian of your transaction. Sellers are required to deposit physical deed papers and purchase contracts directly with Falibari administrators before any payments are authorized, eliminating document fraud.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>👔</div>
              <h3>2. Coordinated On-Site Viewings</h3>
              <p>
                To maintain absolute integrity, you never deal with off-platform agents. When a viewing is requested, a certified Falibari regional agent is dispatched automatically to meet you at the property. No direct contact details are exposed.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>💬</div>
              <h3>3. Mediated Chat Encryption</h3>
              <p>
                All communications between buyers, sellers, and coordinators are safely bridged inside our dynamic admin inbox. This prevents solicitation and outside negotiation, keeping all agreements legally and structurally binding.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>📈</div>
              <h3>4. Unified Progress Timelines</h3>
              <p>
                Transparency is key. Both the buyer and seller track the exact same status updates on a synchronized interactive timeline, accompanied by verified timestamps and official administrative reports.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>⚖️</div>
              <h3>5. Built-In Dispute Mediation</h3>
              <p>
                If any discrepancy is raised, either party can instantly halt the transaction. Our structured dispute panels allow you to securely upload evidence directly to administrators who will review, mediate, and resolve the conflict.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className={`${styles.serviceCard} glass`}>
              <div className={styles.serviceIcon}>📄</div>
              <h3>6. Legally Verified PDF Certificates</h3>
              <p>
                Once completed, both parties receive a branded, print-ready PDF certificate summarizing the verified terms, featuring admin signature lines and an embedded cryptographic QR code linking to our secure verification engine.
              </p>
            </div>
          </div>
        </section>

        {/* CEO Quote Profile (Inspired by Luxury Leadership Editorial Style) */}
        <section className={styles.ceoSection}>
          <div className={`${styles.ceoCard} glass`}>
            <div className={styles.ceoContent}>
              <span className={styles.ceoTitle}>A MESSAGE FROM OUR FOUNDER</span>
              <h2>"Security is not a feature. It is a promise."</h2>
              <blockquote className={styles.ceoQuote}>
                "At Falibari, we believe that purchasing property should be as secure and elegant as the home itself. We took the hard work of verifying land documents, coordinating regional viewing logistics, and protecting payments, and built a system where fraud is structurally impossible."
              </blockquote>
              <div className={styles.ceoDetails}>
                <strong>Philemon Azundow</strong>
                <span>Chief Executive Officer, Falibari Estate</span>
              </div>
            </div>
            <div className={styles.ceoImagePlaceholder}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={styles.ceoBadgeIcon}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div className={styles.ceoSignature}>Philemon Azundow</div>
            </div>
          </div>
        </section>

        {/* Elegant Call to Action */}
        <section className={styles.cta}>
          <div className={`${styles.ctaCard} glass`}>
            <h2>Enter the Future of Trusted Real Estate</h2>
            <p>Experience the uncompromised standard of premium escrow-backed property listings across West Africa.</p>
            <div className={styles.ctaActions}>
              <Link href="/register" className="btn-primary">
                Establish Your Profile
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                View Secured Listings
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
