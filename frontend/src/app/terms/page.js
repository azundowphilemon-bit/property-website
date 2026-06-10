"use client";

import Navbar from '@/components/Navbar';
import styles from './terms.module.css';

export default function TermsAndConditions() {
  const lastUpdated = "June 10, 2026";

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.card} animate-fade-in`}>
          <h1 className={styles.title}>
            Terms & <span className="gradient-text">Conditions</span>
          </h1>
          <p className={styles.subtitle}>
            Please read these Terms and Conditions carefully. They govern your use of the Falibari Real Estate platform, escrow services, and legal rights.
          </p>
          <div className={styles.lastUpdated}>Last Updated: {lastUpdated}</div>

          <div className={styles.termsContent}>
            <section className={styles.section}>
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing, browsing, or registering on the Falibari Real Estate Platform (the "Platform"), you agree to be bound by these Terms and Conditions of Service. If you do not agree to these terms, you must immediately cease all access and utilization of our services.
              </p>
            </section>

            <section className={styles.section}>
              <h2>2. User Roles & Account Eligibility</h2>
              <p>
                The Platform provides distinct user interfaces and authorization roles (Buyers, Tenants, Owners, Builders, and Agents).
              </p>
              <ul>
                <li><strong>Registration:</strong> All users must register with authentic details, including a valid email address and active mobile number.</li>
                <li><strong>Owners/Sellers/Builders:</strong> By posting listings, you warrant that you are the legal owner of the property or possess an exclusive, valid written mandate from the legal owner to sell or lease the property.</li>
                <li><strong>Verification:</strong> Platform administrators reserve the right to request proof of identity or property title deeds at any time. Accounts providing false verification data will be permanently suspended.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>3. Property Listing & Neighborhood Representation</h2>
              <p>
                We require high standards of listing integrity to protect buyers and tenants from real estate fraud.
              </p>
              <ul>
                <li><strong>Accuracy:</strong> All listings must reflect true prices, correct category labels, accurate bedroom/bathroom counts, and exact square footage.</li>
                <li><strong>Location & Area Specification:</strong> Listing creators must select the correct Region/City from the dropdown menu and explicitly write the true, specific **Area / Neighborhood** name (e.g., "Airport Residential" or "East Legon" inside Accra). Deliberate misrepresentation of property locations to attract higher valuations is strictly prohibited.</li>
              </ul>
            </section>

            <section id="escrow" className={styles.section}>
              <h2>4. Secured Transaction Escrow Services</h2>
              <p>
                Falibari Real Estate operates a secure, multi-stage escrow system designed to eliminate financial risks in property purchase and rental:
              </p>
              <ol>
                <li>
                  <strong>Listing Verification:</strong> Once an inquiry is initiated, administrators review the listing parameters.
                </li>
                <li>
                  <strong>Document Holding:</strong> The seller must securely upload and deposit original ownership documents (such as land titles, structural permits, or leases) with Falibari administration.
                </li>
                <li>
                  <strong>Escrow Payment:</strong> The buyer transfers the agreed funds to the Falibari Corporate Escrow Account at Ghana Commercial Bank (GCB). Direct payments between buyers and sellers bypassing our escrow system are strictly prohibited and nullify all platform transaction protections.
                </li>
                <li>
                  <strong>Completion:</strong> Upon clearing of GCB payment and mutual confirmation, the platform releases the ownership deeds to the buyer and releases the escrow balance (minus platform service commissions) to the seller.
                </li>
              </ol>
            </section>

            <section id="disputes" className={styles.section}>
              <h2>5. Dispute Policy & Transaction Freezes</h2>
              <p>
                If a dispute arises prior to the completion of a transaction (e.g. issues with document authenticity, physical defects found during a viewing, or breach of contract):
              </p>
              <ul>
                <li><strong>Freeze:</strong> Raising a dispute immediately freezes all escrow funds and halts document transfers.</li>
                <li><strong>Evidence:</strong> Both parties must submit proof (receipts, lease drafts, inspection reports) to our administrators within five (5) business days.</li>
                <li><strong>CEO Verdict:</strong> The CEO of Falibari Real Estate, Philemon Azundow, or designated arbiters, will review the evidence and issue a binding resolution within ten (10) business days. Escrow funds will be returned or disbursed strictly in accordance with this verdict.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>6. Prohibited Conduct</h2>
              <p>
                Users are strictly prohibited from submitting copy-pasted images, manipulating property price indices, scraping data without written consent, or contacting users directly to bypass the corporate escrow system.
              </p>
            </section>

            <section className={styles.section}>
              <h2>7. Limitation of Liability & Indemnification</h2>
              <p>
                Falibari Real Estate operates as a secured marketplace directory and transaction escrow mediator. We do not accept liability for structural defects, tenant behavior, or market fluctuations. You agree to indemnify Falibari Real Estate and its executives, including Philemon Azundow (CEO), from any claims, actions, or losses arising from your use of the Platform or breaches of these Terms.
              </p>
            </section>

            <section className={styles.section}>
              <h2>8. Contact & Legal Inquiry</h2>
              <p>
                For questions regarding these Terms, or to report listing violations, please contact our Legal Compliance Department at <a href="mailto:falibari@yahoo.com">falibari@yahoo.com</a> or visit our corporate headquarters in Accra.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
