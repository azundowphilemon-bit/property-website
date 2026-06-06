"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import ContactModal from '@/components/ContactModal';
import ComparisonDrawer from '@/components/ComparisonDrawer';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    city_id: '',
    property_type: '',
    max_price: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    searchProperties();
  }, [searchParams]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API}/api/cities`);
      if (!response.ok) throw new Error();
      setCities(await response.json());
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const searchProperties = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/properties?`;
      if (searchParams.property_type) url += `property_type=${searchParams.property_type}&`;
      if (searchParams.city_id) url += `city_id=${searchParams.city_id}&`;
      if (searchParams.max_price) url += `max_price=${searchParams.max_price}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error();
      setProperties(await response.json());
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <Navbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className="animate-fade-in">
          <h1 className={styles.title}>
            Find Your Dream <span className="gradient-text">Property</span> in Ghana
          </h1>
          <p className={styles.subtitle}>
            Discover premium homes, apartments, and commercial spaces tailored to your lifestyle.
          </p>

          <div className={`${styles.searchBar} glass`}>
            <div className={styles.selectGroup}>
              <label>Location</label>
              <select
                className={styles.select}
                value={searchParams.city_id}
                onChange={(e) => setSearchParams({ ...searchParams, city_id: e.target.value })}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.selectGroup}>
              <label>Listing Type</label>
              <select
                className={styles.select}
                value={searchParams.property_type}
                onChange={(e) => setSearchParams({ ...searchParams, property_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Buy">For Sale</option>
                <option value="Rent">For Rent</option>
              </select>
            </div>

            <div className={styles.selectGroup}>
              <label>Max Price</label>
              <select
                className={styles.select}
                value={searchParams.max_price}
                onChange={(e) => setSearchParams({ ...searchParams, max_price: e.target.value })}
              >
                <option value="">Any Price</option>
                <option value="500000">Up to 500k GHS</option>
                <option value="1000000">Up to 1M GHS</option>
                <option value="5000000">Up to 5M GHS</option>
                <option value="10000000">Up to 10M GHS</option>
              </select>
            </div>

            <button className={styles.searchButton} onClick={searchProperties}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className={styles.propertiesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Properties</h2>
          <span style={{ color: 'var(--text-muted)' }}>{properties.length} listings</span>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading properties...</div>
        ) : properties.length > 0 ? (
          <div className={styles.grid}>
            {properties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                cities={cities}
                currentUser={currentUser}
                guestMode={!currentUser}
                onDelete={handleDelete}
                onInterest={(prop) => {
                  const city = cities.find(c => c.id === prop.city_id)?.name || 'Unknown Location';
                  setInterestMessage(`I am interested in the property: "${prop.title}" (ID: ${prop.id}) listed at GHS ${prop.price.toLocaleString()} in ${city}. Please provide more details.`);
                  setContactModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No properties found</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        )}
      </section>
      <ComparisonDrawer cities={cities} />
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        defaultMessage={interestMessage} 
      />
    </main>
  );
}
