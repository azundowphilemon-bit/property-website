"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContactModal from '@/components/ContactModal';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function PropertyDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [property, setProperty] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    } else {
      // Must be logged in to view details
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const cityRes = await fetch(`${API}/api/cities`);
        const cityData = await cityRes.json();
        setCities(cityData);

        const propRes = await fetch(`${API}/api/properties/${id}`);
        if (!propRes.ok) throw new Error("Property not found");
        const propData = await propRes.json();
        setProperty(propData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, currentUser]);

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className={styles.loading}>Loading property details...</div>
      </main>
    );
  }

  if (!property) {
    return (
      <main>
        <Navbar />
        <div className={styles.loading}>Property not found.</div>
      </main>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: 'https://picsum.photos/1200/600' }];

  const nextImg = () => setCurrentImgIndex((prev) => (prev + 1) % images.length);
  const prevImg = () => setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);

  const city = cities.find(c => c.id === property.city_id)?.name || 'Unknown Location';

  const handleInterest = () => {
    setInterestMessage(`I am interested in the property: "${property.title}" (ID: ${property.id}) listed at GHS ${property.price.toLocaleString()} in ${city}. Please provide more details.`);
    setContactModalOpen(true);
  };

  return (
    <main>
      <Navbar />
      <div className={styles.container}>
        
        {/* Image Gallery */}
        <div className={styles.gallery}>
          {images.length > 1 && (
            <>
              <button className={`${styles.navButton} ${styles.prev}`} onClick={prevImg}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button className={`${styles.navButton} ${styles.next}`} onClick={nextImg}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <div className={styles.badge}>{currentImgIndex + 1} / {images.length}</div>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentImgIndex].image_url.startsWith('http') ? images[currentImgIndex].image_url : `${API}${images[currentImgIndex].image_url}`}
            alt={property.title}
            className={styles.mainImage}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://picsum.photos/1200/600'; }}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.mainInfo}>
            {property.is_demo === 1 && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 'bold' }}>
                  ⚠️ SAMPLE LISTING / DEMO ONLY
                </span>
              </div>
            )}
            <div className={styles.header}>
              <h1 className={styles.title}>{property.title}</h1>
              <div className={styles.location}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                {city}
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bedrooms</span>
                <span className={styles.detailValue}>{property.bedrooms}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Bathrooms</span>
                <span className={styles.detailValue}>{property.bathrooms}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Area (sqft)</span>
                <span className={styles.detailValue}>{property.area_sqft}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Category</span>
                <span className={styles.detailValue}>{property.category || 'N/A'}</span>
              </div>
            </div>

            <h2>Description</h2>
            <div className={styles.description}>
              {property.description.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.contactCard}>
              <span className={`${styles.typeBadge} ${property.type === 'Rent' ? styles.rent : styles.sale}`}>
                {property.type === 'Rent' ? 'For Rent' : 'For Sale'}
              </span>
              <div className={styles.price}>GHS {property.price.toLocaleString()}</div>
              
              {property.is_demo === 1 ? (
                <button 
                  className={styles.contactButton} 
                  style={{ background: '#4b5563', cursor: 'not-allowed', opacity: 0.8 }} 
                  onClick={() => alert("This is a sample/demo property. Inquiries are disabled.")}
                >
                  Demo Listing (Inquiries Disabled)
                </button>
              ) : (
                <button className={styles.contactButton} onClick={handleInterest}>
                  I'm Interested
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        defaultMessage={interestMessage} 
        propertyId={property.id}
      />
    </main>
  );
}
