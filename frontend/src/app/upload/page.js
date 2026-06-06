"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './upload.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

export default function UploadProperty() {
  const router = useRouter();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [prefCity, setPrefCity] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  
  const [newProperty, setNewProperty] = useState({
    title: '', 
    description: '', 
    price: '', 
    type: 'Buy',
    bedrooms: 2, 
    bathrooms: 2, 
    area_sqft: 1200, 
    city_id: ''
  });

  useEffect(() => {
    // Auth check
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setUserRole(role || '');
    if (!token || (role !== 'Admin' && role !== 'Owner')) {
      alert("Unauthorized: Only Admins or Owners can post properties.");
      router.push('/');
      return;
    }

    fetchCities();
    
    // Auto-select seller's preferred region if available
    const pref = localStorage.getItem('preferred_city_id');
    if (pref && pref !== 'null') {
      setPrefCity(pref);
      setNewProperty(prev => ({ ...prev, city_id: pref }));
    }
  }, [router]);

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API}/api/cities`);
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 5) {
        alert("You can only upload a maximum of 5 pictures.");
        setSelectedFiles(files.slice(0, 5));
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!newProperty.city_id) {
        alert('Please select a city.');
        setLoading(false);
        return;
      }

      if (selectedFiles.length === 0) {
        alert('Please select at least one image before publishing.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      
      // 1. Upload files first
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadRes.ok) {
        let errorMessage = 'File upload failed';
        try {
          const errorData = await uploadRes.json();
          errorMessage = errorData.detail || JSON.stringify(errorData) || errorMessage;
        } catch (jsonError) {
          const text = await uploadRes.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      const { urls } = await uploadRes.json();

      // 2. Create property
      const response = await fetch(`${API}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProperty,
          price: parseFloat(newProperty.price) || 0,
           bedrooms: parseInt(newProperty.bedrooms) || 0,
          bathrooms: parseInt(newProperty.bathrooms) || 0,
          area_sqft: parseInt(newProperty.area_sqft) || 0,
          city_id: parseInt(newProperty.city_id),
          image_urls: urls,
          is_demo: isDemo ? 1 : 0
        })
      });

      if (response.ok) {
        alert('Property published successfully!');
        router.push('/');
      } else {
        const data = await response.json();
        alert(data.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={`${styles.card} animate-fade-in`}>
          <h1 className={styles.title}>Post a <span className="gradient-text">Property</span></h1>
          <p className={styles.subtitle}>Fill in the details below to list your property on Falibari Estate.</p>

          <form className={styles.form} onSubmit={handleUpload}>
            <div className={styles.formGroup}>
              <label>Property Title</label>
              <input 
                type="text" 
                className={styles.input}
                placeholder="e.g. Modern Villa in Airport Residential"
                value={newProperty.title}
                onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Price (GHS)</label>
              <input 
                type="number" 
                className={styles.input}
                placeholder="e.g. 500000"
                value={newProperty.price}
                onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                required
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Description</label>
              <textarea 
                className={styles.textarea}
                placeholder="Describe the property features, neighborhood, etc."
                value={newProperty.description}
                onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>City/Location</label>
              <select 
                className={styles.select}
                value={newProperty.city_id}
                onChange={(e) => setNewProperty({...newProperty, city_id: e.target.value})}
                required
              >
                <option value="" disabled>Select a city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Property Type</label>
              <select 
                className={styles.select}
                value={newProperty.type}
                onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
              >
                <option value="Buy">For Sale</option>
                <option value="Rent">For Rent</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Bedrooms</label>
              <input 
                type="number" 
                className={styles.input}
                value={newProperty.bedrooms}
                onChange={(e) => setNewProperty({...newProperty, bedrooms: e.target.value})}
                min="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Bathrooms</label>
              <input 
                type="number" 
                className={styles.input}
                value={newProperty.bathrooms}
                onChange={(e) => setNewProperty({...newProperty, bathrooms: e.target.value})}
                min="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Area (sqft)</label>
              <input 
                type="number" 
                className={styles.input}
                value={newProperty.area_sqft}
                onChange={(e) => setNewProperty({...newProperty, area_sqft: e.target.value})}
                min="0"
                required
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Property Images</label>
              <div className={styles.fileUpload}>
                <label className={styles.fileLabel}>
                  <svg className={styles.fileIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span>Click to browse or drag and drop images</span>
                  <span style={{ fontSize: '0.8rem' }}>{selectedFiles.length} file(s) selected</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
            </div>

            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
              <input 
                type="checkbox" 
                id="is_demo" 
                checked={isDemo} 
                onChange={(e) => setIsDemo(e.target.checked)} 
                style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }}
              />
              <label htmlFor="is_demo" style={{ marginBottom: 0, cursor: 'pointer', color: '#6b7280', fontSize: '0.95rem' }}>Mark as Sample / Demo Listing (locks buy/rent actions for testing)</label>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Uploading Property...' : 'Publish Listing'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
