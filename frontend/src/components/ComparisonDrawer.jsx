"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ComparisonDrawer.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function ComparisonDrawer({ cities }) {
  const [compareList, setCompareList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateList = () => {
      const list = JSON.parse(localStorage.getItem('compareList') || '[]');
      setCompareList(list);
    };
    updateList();
    window.addEventListener('compareListUpdated', updateList);
    return () => window.removeEventListener('compareListUpdated', updateList);
  }, []);

  const handleRemove = (id, e) => {
    e.stopPropagation();
    const updated = compareList.filter(p => p.id !== id);
    localStorage.setItem('compareList', JSON.stringify(updated));
    window.dispatchEvent(new Event('compareListUpdated'));
  };

  const handleClear = () => {
    localStorage.setItem('compareList', '[]');
    window.dispatchEvent(new Event('compareListUpdated'));
    setIsModalOpen(false);
  };

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Drawer */}
      <div className={`${styles.drawer} ${compareList.length > 0 ? styles.drawerActive : ''}`}>
        <div className={styles.leftSection}>
          <div className={styles.title}>Compare ({compareList.length}/3)</div>
          <div className={styles.thumbnails}>
            {compareList.map(p => {
              const mainImg = p.images && p.images.length > 0 
                ? p.images[0].image_url 
                : 'https://picsum.photos/600/400';
              const imgUrl = mainImg.startsWith('http') ? mainImg : `${API}${mainImg}`;

              return (
                <div key={p.id} className={styles.thumbnailWrapper}>
                  <img src={imgUrl} alt={p.title} className={styles.thumbnail} />
                  <button className={styles.removeThumbBtn} onClick={(e) => handleRemove(p.id, e)}>×</button>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.compareBtn} onClick={() => setIsModalOpen(true)}>Compare Now</button>
          <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
        </div>
      </div>

      {/* Comparison Modal Overlay */}
      <div className={`${styles.overlay} ${isModalOpen ? styles.overlayActive : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <h2>⚖️ Property Comparison Matrix</h2>
            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className={styles.content}>
            <table className={styles.table}>
              <tbody>
                {/* Images, Title, Price */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Overview</td>
                  {compareList.map(p => {
                    const mainImg = p.images && p.images.length > 0 
                      ? p.images[0].image_url 
                      : 'https://picsum.photos/600/400';
                    const imgUrl = mainImg.startsWith('http') ? mainImg : `${API}${mainImg}`;

                    return (
                      <td key={p.id} className={styles.tdValue}>
                        <div className={styles.propCard}>
                          <img src={imgUrl} alt={p.title} className={styles.propImage} />
                          <div className={styles.propTitle} title={p.title}>{p.title}</div>
                          <div className={styles.propPrice}>GHS {p.price.toLocaleString()}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Location */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Location</td>
                  {compareList.map(p => {
                    const cityName = cities?.find(c => c.id === p.city_id)?.name || 'Unknown Location';
                    return (
                      <td key={p.id} className={styles.tdValue}>
                        📍 {p.area ? `${p.area}, ${cityName}` : cityName}
                      </td>
                    );
                  })}
                </tr>

                {/* Category & Listing Type */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Type</td>
                  {compareList.map(p => (
                    <td key={p.id} className={styles.tdValue}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: p.type === 'Rent' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: p.type === 'Rent' ? '#fb923c' : '#4ade80'
                      }}>
                        {p.type === 'Rent' ? 'For Rent' : 'For Sale'}
                      </span>
                      {p.category && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>({p.category})</span>}
                    </td>
                  ))}
                </tr>

                {/* Bedrooms & Bathrooms */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Beds & Baths</td>
                  {compareList.map(p => (
                    <td key={p.id} className={styles.tdValue}>
                      🛏️ {p.bedrooms} Bedrooms <br />
                      🛁 {p.bathrooms} Bathrooms
                    </td>
                  ))}
                </tr>

                {/* Size Area */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Area Size</td>
                  {compareList.map(p => (
                    <td key={p.id} className={styles.tdValue}>
                      📐 {p.area_sqft} sqft
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Description</td>
                  {compareList.map(p => (
                    <td key={p.id} className={styles.tdValue} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {p.description}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Action</td>
                  {compareList.map(p => (
                    <td key={p.id} className={styles.tdValue}>
                      <button 
                        className={styles.inquireBtn} 
                        onClick={() => {
                          const storedUser = localStorage.getItem('currentUser');
                          if (!storedUser) {
                            router.push('/login');
                          } else {
                            router.push(`/properties/${p.id}`);
                          }
                        }}
                      >
                        View Full Details
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
