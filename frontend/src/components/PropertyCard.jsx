"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PropertyCard.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function PropertyCard({ property, cities, currentUser, onDelete, onInterest, guestMode, browseMode }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isCompared, setIsCompared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkCompareList = () => {
      const list = JSON.parse(localStorage.getItem('compareList') || '[]');
      setIsCompared(list.some(p => p.id === property.id));
    };
    checkCompareList();
    window.addEventListener('compareListUpdated', checkCompareList);
    return () => window.removeEventListener('compareListUpdated', checkCompareList);
  }, [property.id]);

  const handleCompareClick = (e) => {
    e.stopPropagation();
    const list = JSON.parse(localStorage.getItem('compareList') || '[]');
    const isAlreadyAdded = list.some(p => p.id === property.id);
    let newList = [];
    if (isAlreadyAdded) {
      newList = list.filter(p => p.id !== property.id);
    } else {
      if (list.length >= 3) {
        alert("You can compare up to 3 properties at a time.");
        return;
      }
      newList = [...list, property];
    }
    localStorage.setItem('compareList', JSON.stringify(newList));
    window.dispatchEvent(new Event('compareListUpdated'));
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: 'https://picsum.photos/600/400' }];

  const nextImg = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isOwner = currentUser && (Number(currentUser.id) === Number(property.user_id));
  const isAdmin = currentUser && (currentUser.role === 'Admin');
  // canDelete is false in browseMode — users browsing to buy/rent cannot delete others' listings
  const canDelete = !browseMode && (isOwner || isAdmin);

  const city = cities?.find(c => c.id === property.city_id)?.name || 'Unknown Location';

  const handleCardClick = () => {
    if (guestMode) {
      router.push('/login');
    } else {
      router.push(`/properties/${property.id}`);
    }
  };

  return (
    <div
      className={`${styles.card} glass ${guestMode ? styles.guestCard : ''}`}
      onClick={handleCardClick}
    >
      {canDelete && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this property?")) {
              if (typeof onDelete === 'function') {
                onDelete(property.id);
              } else {
                console.error("onDelete is not a function");
              }
            }
          }}
        >
          DELETE
        </button>
      )}

      <div className={styles.imageContainer}>
        <button
          className={`${styles.compareBtn} ${isCompared ? styles.compareBtnActive : ''}`}
          onClick={handleCompareClick}
          title="Compare Property"
        >
          ⚖️
        </button>
        {images.length > 1 && (
          <>
            <button className={`${styles.navButton} ${styles.prev}`} onClick={prevImg}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button className={`${styles.navButton} ${styles.next}`} onClick={nextImg}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <div className={styles.badge}>{currentImgIndex + 1} / {images.length}</div>
          </>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentImgIndex].image_url.startsWith('http') ? images[currentImgIndex].image_url : `${API}${images[currentImgIndex].image_url}`}
          alt={property.title}
          className={styles.image}
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://picsum.photos/600/400'; }}
        />

        {/* Guest overlay — login prompt */}
        {guestMode ? (
          <div className={styles.guestOverlay}>
            <div className={styles.guestOverlayContent}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span>Login to View Details</span>
            </div>
          </div>
        ) : (
          <div className={styles.interestOverlay}>
            {property.is_demo === 1 ? (
              <button
                className={styles.interestButton}
                style={{ background: '#4b5563', cursor: 'not-allowed', opacity: 0.8 }}
                onClick={(e) => { e.stopPropagation(); alert("This is a sample/demo property. Inquiries are disabled."); }}
              >
                Demo Property
              </button>
            ) : (
              <button
                className={styles.interestButton}
                onClick={(e) => { e.stopPropagation(); onInterest(property); }}
              >
                I'm Interested
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.priceRow}>
          <div className={styles.price}>GHS {property.price.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {property.is_demo === 1 && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 'bold' }} title="This is a design sample property. No actual inquiries can be made.">Demo / Sample</span>
            )}
            <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }} title="Admin Approved & Verified">✓ Verified</span>
            <span className={`${styles.typeBadge} ${property.type === 'Rent' ? styles.rent : styles.sale}`}>
              {property.type === 'Rent' ? 'For Rent' : 'For Sale'}
            </span>
          </div>
        </div>

        <h3 className={styles.title} title={property.title}>{property.title}</h3>

        <div className={styles.location}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          {property.area ? `${property.area}, ${city}` : city}
          {property.category && (
            <span className={styles.categoryBadge}>{property.category}</span>
          )}
        </div>

        <p className={styles.desc}>{property.description}</p>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" /><path d="M12 3v6" /></svg>
            {property.bedrooms} Beds
          </div>
          <div className={styles.detailItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><line x1="10" x2="8" y1="5" y2="7" /><line x1="2" x2="22" y1="12" y2="12" /><line x1="7" x2="7" y1="19" y2="21" /><line x1="17" x2="17" y1="19" y2="21" /></svg>
            {property.bathrooms} Baths
          </div>
          <div className={styles.detailItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 14v1" /><path d="M9 19v2" /><path d="M9 3v2" /><path d="M9 9v1" /></svg>
            {property.area_sqft} sqft
          </div>
        </div>
      </div>
    </div>
  );
}
