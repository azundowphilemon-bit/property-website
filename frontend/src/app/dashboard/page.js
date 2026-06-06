"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/PropertyCard';
import ContactModal from '@/components/ContactModal';
import ComparisonDrawer from '@/components/ComparisonDrawer';
import styles from './dashboard.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';

const PROPERTY_CATEGORIES = [
  'Apartment',
  'House',
  'Land',
  'Commercial Shop',
  'Office Space',
  'Warehouse',
  'Townhouse',
  'Villa',
  'Studio',
  'Other',
];

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [mode, setMode] = useState(null); // 'buy' | 'sell'
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestPropertyId, setInterestPropertyId] = useState(null);

  // --- INQUIRIES STATE ---
  const [inquiries, setInquiries] = useState([]);
  const [receivedInquiries, setReceivedInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  
  // --- DISPUTES STATE ---
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeInqId, setDisputeInqId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputesData, setDisputesData] = useState({});

  // --- BUY STATE ---
  const [cities, setCities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [filters, setFilters] = useState({
    city_id: '',
    property_type: 'Buy',
    category: '',
    max_price: '',
  });

  // --- SELL STATE ---
  const [sellCities, setSellCities] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    price: '',
    type: 'Buy',
    category: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1200,
    city_id: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('currentUser');
    if (!token || !stored) {
      router.push('/login');
      return;
    }
    try {
      setCurrentUser(JSON.parse(stored));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Fetch cities once
  useEffect(() => {
    fetch(`${API}/api/cities`)
      .then(r => r.json())
      .then(data => {
        setCities(data);
        setSellCities(data);
        // Auto-select preferred city
        const pref = localStorage.getItem('preferred_city_id');
        if (pref && pref !== 'null') {
          setFilters(prev => ({ ...prev, city_id: pref }));
          setNewProperty(prev => ({ ...prev, city_id: pref }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch properties when buy mode is active or filters change
  useEffect(() => {
    if (mode === 'buy') fetchProperties();
  }, [mode, filters]);

  // Fetch inquiries
  useEffect(() => {
    if (mode === 'inquiries') fetchInquiries();
    if (mode === 'received_inquiries') fetchReceivedInquiries();
  }, [mode]);

  const fetchMessages = async (inqId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/inquiries/${inqId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMessages(prev => ({ ...prev, [inqId]: data }));
  };

  const fetchDisputes = async (inqId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/inquiries/${inqId}/disputes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setDisputesData(prev => ({ ...prev, [inqId]: data }));
  };

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/inquiries/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInquiries(data);
      data.forEach(inq => {
        fetchMessages(inq.id);
        if (inq.status === 'dispute') fetchDisputes(inq.id);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const fetchReceivedInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/inquiries/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReceivedInquiries(data);
      data.forEach(inq => {
        fetchMessages(inq.id);
        if (inq.status === 'dispute') fetchDisputes(inq.id);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleSendMessage = async (inqId) => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/inquiries/${inqId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: newMessage })
    });
    setNewMessage('');
    fetchMessages(inqId);
  };

  const handleUploadSellerDoc = async (inqId, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('files', file);
    await fetch(`${API}/api/inquiries/${inqId}/seller-document`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    fetchReceivedInquiries();
  };

  const handleUploadPaymentProof = async (inqId, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('files', file);
    await fetch(`${API}/api/inquiries/${inqId}/payment-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    fetchInquiries();
  };

  const handleSellerConfirmPayment = async (inqId) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/inquiries/${inqId}/seller-confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchReceivedInquiries();
  };

  const handleRequestViewing = async (inqId) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/inquiries/${inqId}/request-viewing`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Viewing requested. An admin will assign an agent shortly.");
    fetchInquiries();
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/inquiries/${disputeInqId}/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: disputeReason })
    });
    setDisputeModalOpen(false);
    setDisputeReason('');
    fetchInquiries();
    fetchReceivedInquiries();
  };

  const handleUploadEvidence = async (disputeId, file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('files', file);
    await fetch(`${API}/api/disputes/${disputeId}/evidence`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    // refresh disputes
    fetchInquiries();
    fetchReceivedInquiries();
  };

  const renderTimeline = (status) => {
    const stages = [
      { id: 'pending', label: 'Request Sent', icon: '📩' },
      { id: 'verified', label: 'Verified', icon: '🛡️' },
      { id: 'approved', label: 'Approved', icon: '👍' },
      { id: 'viewing_scheduled', label: 'Viewing', icon: '📅' },
      { id: 'documents_held', label: 'Docs Held', icon: '📁' },
      { id: 'payment_submitted', label: 'Escrow Pay', icon: '💰' },
      { id: 'payment_confirmed', label: 'Pay Confirmed', icon: '✅' },
      { id: 'completed', label: 'Completed', icon: '🔑' },
    ];
    
    let isDispute = status === 'dispute';
    let currentIndex = stages.findIndex(s => s.id === status);
    if (currentIndex === -1 && !isDispute) currentIndex = 0;

    // Calculate progress line percentage (connector width)
    const progressPercent = isDispute 
      ? 0 
      : currentIndex === stages.length - 1 
        ? 100 
        : (currentIndex / (stages.length - 1)) * 100;

    return (
      <div className={styles.timelineContainer}>
        <div className={styles.timelineTitle}>
          <span>⚖️ Escrow Transaction Tracker</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
            (Secure Platform Escrow)
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <div className={styles.stepConnector}>
            <div 
              className={styles.stepConnectorProgress} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.stepperWrapper}>
            {stages.map((stage, i) => {
              const isCompleted = !isDispute && i < currentIndex;
              const isActive = !isDispute && i === currentIndex;
              
              let stepClass = styles.stepNode;
              if (isCompleted) stepClass += ` ${styles.stepNodeCompleted}`;
              if (isActive) stepClass += ` ${styles.stepNodeActive}`;

              let circleClass = styles.stepCircle;
              if (isCompleted) circleClass += ` ${styles.stepCircleCompleted}`;
              if (isActive) circleClass += ` ${styles.stepCircleActive}`;

              let labelClass = styles.stepLabel;
              if (isCompleted) labelClass += ` ${styles.stepLabelCompleted}`;
              if (isActive) labelClass += ` ${styles.stepLabelActive}`;

              return (
                <div key={stage.id} className={stepClass}>
                  <div className={circleClass}>
                    {isCompleted ? '✓' : stage.icon}
                  </div>
                  <div className={labelClass}>{stage.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        {isDispute && (
          <div className={styles.disputeBanner}>
            <div className={styles.disputeIcon}>!</div>
            <span>TRANSACTION FROZEN: A dispute has been raised. Platform agents are currently investigating.</span>
          </div>
        )}
      </div>
    );
  };

  const renderMessaging = (inqId, role) => {
    const msgs = messages[inqId] || [];
    return (
      <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '12px' }}>Admin Chat (Mediated)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
          {msgs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No messages yet.</p> : 
            msgs.map(m => (
              <div key={m.id} style={{ 
                alignSelf: m.sender_role === role ? 'flex-end' : 'flex-start',
                background: m.sender_role === role ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                padding: '8px 12px', borderRadius: '8px', maxWidth: '80%'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '4px' }}>{m.sender_role.toUpperCase()}</div>
                <div>{m.message}</div>
              </div>
            ))
          }
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" className="input-field" placeholder="Send a message to the Admin..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
          <button className="btn-primary" onClick={() => handleSendMessage(inqId)}>Send</button>
        </div>
      </div>
    );
  };

  const renderDisputes = (inqId) => {
    const disputes = disputesData[inqId];
    if (!disputes || disputes.length === 0) return null;
    return (
      <div style={{ marginTop: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h4 style={{ color: '#ef4444', marginBottom: '12px' }}>Active Dispute</h4>
        {disputes.map(d => (
          <div key={d.id} style={{ marginBottom: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
            <p><strong>Status:</strong> {d.status.toUpperCase()}</p>
            <p><strong>Raised By:</strong> {d.raised_by.toUpperCase()}</p>
            <p><strong>Reason:</strong> {d.reason}</p>
            {d.resolution && <p style={{ color: '#22c55e', marginTop: '8px' }}><strong>Admin Resolution:</strong> {d.resolution}</p>}
            
            <div style={{ marginTop: '12px' }}>
              <strong>Evidence:</strong>
              {d.evidence.length > 0 ? (
                <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                  {d.evidence.map(e => <li key={e.id}><a href={e.file_url} target="_blank" style={{ color: '#3b82f6' }}>View File</a></li>)}
                </ul>
              ) : <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No evidence uploaded yet.</p>}
              
              {d.status !== 'resolved' && d.status !== 'rejected' && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Upload Additional Evidence:</label>
                  <input type="file" onChange={e => { if(e.target.files[0]) handleUploadEvidence(d.id, e.target.files[0]) }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };



  const fetchProperties = async () => {
    setLoadingProps(true);
    try {
      let url = `${API}/api/properties?property_type=${filters.property_type}`;
      if (filters.city_id) url += `&city_id=${filters.city_id}`;
      if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
      if (filters.max_price) url += `&max_price=${filters.max_price}`;
      const res = await fetch(url);
      const data = await res.json();
      setProperties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProps(false);
    }
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.length > 5 ? files.slice(0, 5) : files;
    setSelectedFiles(validFiles);

    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!newProperty.city_id) return alert('Please select a city.');
    setUploading(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));

      let urls = [];
      if (selectedFiles.length > 0) {
        const uploadRes = await fetch(`${API}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        urls = uploadData.urls;
      }

      const res = await fetch(`${API}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newProperty,
          price: parseFloat(newProperty.price) || 0,
          bedrooms: parseInt(newProperty.bedrooms) || 0,
          bathrooms: parseInt(newProperty.bathrooms) || 0,
          area_sqft: parseInt(newProperty.area_sqft) || 0,
          city_id: parseInt(newProperty.city_id),
          image_urls: urls,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Property listed successfully!');
        setNewProperty({ title: '', description: '', price: '', type: 'Buy', category: 'Apartment', bedrooms: 2, bathrooms: 2, area_sqft: 1200, city_id: '' });
        setSelectedFiles([]);
        setPreviewUrls([]);
      } else {
        const d = await res.json();
        alert(d.detail || 'Failed to post property');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/properties/${propertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  if (!currentUser) return null;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Welcome Banner */}
        <div className={styles.welcome}>
          <h1>Welcome back, <span className="gradient-text">{currentUser.full_name?.split(' ')[0]}</span> 👋</h1>
          <p>What would you like to do today?</p>
        </div>

        {/* Mode Selector */}
        {!mode && (
          <div className={styles.modeGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <button className={styles.modeCard} onClick={() => setMode('buy')}>
              <div className={styles.modeIcon}>🏠</div>
              <h2>Buy / Rent Property</h2>
              <p>Browse properties across all regions in Ghana. Filter by location, type, and price.</p>
              <span className={styles.modeBtn}>Start Browsing →</span>
            </button>
            <button className={styles.modeCard} onClick={() => setMode('sell')}>
              <div className={styles.modeIcon}>📋</div>
              <h2>Sell / List Property</h2>
              <p>Post your property for sale or rent. Add photos, details, and reach thousands of buyers.</p>
              <span className={styles.modeBtn}>List a Property →</span>
            </button>
            <button className={styles.modeCard} onClick={() => setMode('inquiries')}>
              <div className={styles.modeIcon}>📤</div>
              <h2>Sent Inquiries (Buyer)</h2>
              <p>Track properties you are interested in buying or renting.</p>
              <span className={styles.modeBtn}>View Sent →</span>
            </button>
            <button className={styles.modeCard} onClick={() => setMode('received_inquiries')}>
              <div className={styles.modeIcon}>📥</div>
              <h2>Received Inquiries (Seller)</h2>
              <p>Manage offers and inquiries on your listed properties.</p>
              <span className={styles.modeBtn}>View Received →</span>
            </button>
          </div>
        )}

        {/* BUY MODE */}
        {mode === 'buy' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <button className={styles.backBtn} onClick={() => setMode(null)}>← Back</button>
              <h2>Browse Properties</h2>
            </div>

            {/* Filters */}
            <div className={`${styles.filterBar} glass`}>
              <div className={styles.filterGroup}>
                <label>Region / City</label>
                <select className={styles.select} value={filters.city_id} onChange={e => setFilters({ ...filters, city_id: e.target.value })}>
                  <option value="">All Regions</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.region}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Listing Type</label>
                <select className={styles.select} value={filters.property_type} onChange={e => setFilters({ ...filters, property_type: e.target.value })}>
                  <option value="Buy">For Sale</option>
                  <option value="Rent">For Rent</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Category</label>
                <select className={styles.select} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                  <option value="">All Categories</option>
                  {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Max Price (GHS)</label>
                <select className={styles.select} value={filters.max_price} onChange={e => setFilters({ ...filters, max_price: e.target.value })}>
                  <option value="">Any Price</option>
                  <option value="500000">Up to 500k</option>
                  <option value="1000000">Up to 1M</option>
                  <option value="5000000">Up to 5M</option>
                  <option value="10000000">Up to 10M</option>
                </select>
              </div>
              <button className={styles.searchBtn} onClick={fetchProperties}>Search</button>
            </div>

            {/* Results */}
            {loadingProps ? (
              <div className={styles.loading}>Loading properties...</div>
            ) : properties.length > 0 ? (
              <>
                <p className={styles.resultCount}>{properties.length} properties found</p>
                <div className={styles.grid}>
                  {properties.map(p => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      cities={cities}
                      currentUser={currentUser}
                      browseMode={true}
                      onDelete={handleDeleteProperty}
                      onInterest={(prop) => {
                        const city = cities.find(c => c.id === prop.city_id)?.name || 'Unknown Location';
                        setInterestMessage(`I am interested in the property: "${prop.title}" (ID: ${prop.id}) listed at GHS ${prop.price.toLocaleString()} in ${city}. Please provide more details.`);
                        setInterestPropertyId(prop.id);
                        setContactModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.empty}>
                <h3>No properties found</h3>
                <p>Try changing your filters or selecting a different region.</p>
              </div>
            )}
          </div>
        )}

        {/* SELL MODE */}
        {mode === 'sell' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <button className={styles.backBtn} onClick={() => setMode(null)}>← Back</button>
              <h2>List Your Property</h2>
            </div>

            <div className={styles.formCard}>
              {successMsg && <div className={styles.success}>{successMsg}</div>}
              <form className={styles.form} onSubmit={handleSell}>

                <div className={styles.formGroup}>
                  <label>Property Title *</label>
                  <input className={styles.input} type="text" placeholder="e.g. 3-Bedroom House in East Legon" value={newProperty.title} onChange={e => setNewProperty({ ...newProperty, title: e.target.value })} required />
                </div>

                <div className={styles.formGroup}>
                  <label>Price (GHS) *</label>
                  <input className={styles.input} type="number" placeholder="e.g. 250000" value={newProperty.price} onChange={e => setNewProperty({ ...newProperty, price: e.target.value })} required />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description *</label>
                  <textarea className={styles.textarea} placeholder="Describe the property — location, features, nearby amenities..." value={newProperty.description} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })} required />
                </div>

                <div className={styles.formGroup}>
                  <label>City / Location *</label>
                  <select className={styles.select} value={newProperty.city_id} onChange={e => setNewProperty({ ...newProperty, city_id: e.target.value })} required>
                    <option value="" disabled>Select a city</option>
                    {sellCities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.region}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Listing Type *</label>
                  <select className={styles.select} value={newProperty.type} onChange={e => setNewProperty({ ...newProperty, type: e.target.value })}>
                    <option value="Buy">For Sale</option>
                    <option value="Rent">For Rent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Property Category *</label>
                  <select className={styles.select} value={newProperty.category} onChange={e => setNewProperty({ ...newProperty, category: e.target.value })}>
                    {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Bedrooms</label>
                  <input className={styles.input} type="number" min="0" value={newProperty.bedrooms} onChange={e => setNewProperty({ ...newProperty, bedrooms: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Bathrooms</label>
                  <input className={styles.input} type="number" min="0" value={newProperty.bathrooms} onChange={e => setNewProperty({ ...newProperty, bathrooms: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Area (sqft)</label>
                  <input className={styles.input} type="number" min="0" value={newProperty.area_sqft} onChange={e => setNewProperty({ ...newProperty, area_sqft: e.target.value })} />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Property Photos (up to 5)</label>
                  <div className={styles.fileUpload}>
                    <label className={styles.fileLabel}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <span>Click to upload photos</span>
                      <span className={styles.fileHint}>{selectedFiles.length} file(s) selected</span>
                      <input type="file" multiple accept="image/*" className={styles.fileInput} onChange={handleFileChange} />
                    </label>
                  </div>
                  {previewUrls.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
                      {previewUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`preview-${index}`}
                          width="120"
                          height="120"
                          style={{ objectFit: "cover", borderRadius: "8px", border: "2px solid var(--glass-border, rgba(255,255,255,0.2))" }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={uploading}>
                  {uploading ? 'Publishing...' : 'Publish Listing'}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* SENT INQUIRIES MODE (BUYER) */}
        {mode === 'inquiries' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <button className={styles.backBtn} onClick={() => setMode(null)}>← Back</button>
              <h2>Sent Inquiries</h2>
            </div>
            
            {loadingInquiries ? (
              <div className={styles.loading}>Loading inquiries...</div>
            ) : inquiries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inquiries.map(inq => (
                  <div key={inq.id} className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{inq.property_title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {inq.status !== 'completed' && inq.status !== 'dispute' && (
                          <button onClick={() => { setDisputeInqId(inq.id); setDisputeModalOpen(true); }} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Report Issue</button>
                        )}
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: inq.status === 'dispute' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: inq.status === 'dispute' ? '#ef4444' : '#3b82f6'
                        }}>
                          {inq.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {renderTimeline(inq.status)}

                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      {inq.status === 'pending' && <p style={{ color: 'var(--text-muted)' }}>Waiting for admin verification. We'll get back to you shortly.</p>}
                      {inq.status === 'verified' && <p style={{ color: '#3b82f6' }}>Property verified! Admin is reviewing your buyer profile.</p>}
                      {inq.status === 'approved' && (
                        <div>
                          <p style={{ color: '#22c55e', marginBottom: '12px' }}>Approved! Waiting for the seller to securely deposit documents with us.</p>
                          <button className="btn-primary" onClick={() => handleRequestViewing(inq.id)}>Request Property Viewing</button>
                        </div>
                      )}
                      {inq.status === 'viewing_scheduled' && <p style={{ color: '#a855f7' }}>A platform agent will meet you for the viewing. Check messages for details.</p>}
                      
                      {inq.status === 'documents_held' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Seller documents are secured. Please proceed with payment.</p>
                          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                            <h4 style={{ marginBottom: '8px' }}>Payment Instructions</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              Transfer the required amount to our corporate escrow account.<br/><br/>
                              <strong>Bank:</strong> Ghana Commercial Bank (GCB)<br/>
                              <strong>Account Name:</strong> Falibaripro Escrow<br/>
                              <strong>Reference:</strong> INQ-{inq.id}
                            </p>
                            <div style={{ marginTop: '16px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Upload Payment Proof:</label>
                              <input type="file" onChange={(e) => { if(e.target.files[0]) handleUploadPaymentProof(inq.id, e.target.files[0]) }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {inq.status === 'payment_submitted' && <p style={{ color: '#eab308' }}>Payment proof submitted! Waiting for Admin & Seller confirmation.</p>}
                      {inq.status === 'payment_confirmed' && <p style={{ color: '#22c55e' }}>Payment confirmed! Admin will release documents shortly.</p>}
                      {inq.status === 'completed' && (
                        <div>
                          <p style={{ color: '#a855f7', fontWeight: 'bold' }}>Transaction Complete! Documents Released.</p>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            {inq.seller_document_url && (
                              <a href={inq.seller_document_url} target="_blank" className="btn-primary" style={{ textDecoration: 'none' }}>Download Ownership Documents</a>
                            )}
                            <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => window.open(`${API}/api/inquiries/${inq.id}/report`, '_blank')}>
                              Download Official PDF Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {inq.status === 'dispute' && renderDisputes(inq.id)}

                    {renderMessaging(inq.id, 'buyer')}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h3>No sent inquiries found</h3>
                <p>When you show interest in a property, it will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* RECEIVED INQUIRIES MODE (SELLER) */}
        {mode === 'received_inquiries' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <button className={styles.backBtn} onClick={() => setMode(null)}>← Back</button>
              <h2>Received Inquiries</h2>
            </div>
            
            {loadingInquiries ? (
              <div className={styles.loading}>Loading inquiries...</div>
            ) : receivedInquiries.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {receivedInquiries.map(inq => (
                  <div key={inq.id} className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{inq.property_title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {inq.status !== 'completed' && inq.status !== 'dispute' && (
                          <button onClick={() => { setDisputeInqId(inq.id); setDisputeModalOpen(true); }} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Report Issue</button>
                        )}
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          background: inq.status === 'dispute' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                          color: inq.status === 'dispute' ? '#ef4444' : '#a855f7'
                        }}>
                          {inq.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {renderTimeline(inq.status)}

                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      {['pending', 'verified'].includes(inq.status) && <p style={{ color: 'var(--text-muted)' }}>Admin is reviewing this buyer's inquiry.</p>}
                      
                      {inq.status === 'approved' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ color: '#ef4444', fontWeight: 'bold' }}>ACTION REQUIRED: Please securely upload property ownership documents to proceed.</p>
                          <input type="file" onChange={(e) => { if(e.target.files[0]) handleUploadSellerDoc(inq.id, e.target.files[0]) }} />
                        </div>
                      )}

                      {inq.status === 'viewing_scheduled' && <p style={{ color: '#3b82f6' }}>A viewing has been scheduled with a platform agent.</p>}
                      {inq.status === 'documents_held' && <p style={{ color: '#22c55e' }}>Documents secured. Waiting for buyer to transfer funds.</p>}

                      {inq.status === 'payment_submitted' && !inq.seller_confirmed_payment && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ color: '#eab308', fontWeight: 'bold' }}>Buyer submitted payment proof. Please confirm if funds are received in your account.</p>
                          <button className="btn-primary" onClick={() => handleSellerConfirmPayment(inq.id)}>Confirm Funds Received</button>
                        </div>
                      )}
                      
                      {inq.status === 'payment_submitted' && inq.seller_confirmed_payment && (
                        <p style={{ color: '#22c55e' }}>You confirmed funds. Waiting for Admin final approval.</p>
                      )}

                      {inq.status === 'payment_confirmed' && <p style={{ color: '#22c55e' }}>Transaction verified. Admin finalizing release.</p>}
                      {inq.status === 'completed' && (
                        <div>
                          <p style={{ color: '#a855f7', fontWeight: 'bold' }}>Transaction Complete! Deal closed.</p>
                          <button className="btn-primary" style={{ background: '#10b981', marginTop: '12px' }} onClick={() => window.open(`${API}/api/inquiries/${inq.id}/report`, '_blank')}>
                            Download Official PDF Report
                          </button>
                        </div>
                      )}
                    </div>

                    {inq.status === 'dispute' && renderDisputes(inq.id)}

                    {renderMessaging(inq.id, 'seller')}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h3>No received inquiries found</h3>
                <p>Offers on your properties will appear here.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
        defaultMessage={interestMessage} 
        propertyId={interestPropertyId}
      />

      {/* DISPUTE MODAL */}
      {disputeModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Report an Issue / Raise Dispute</h3>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Filing a dispute will instantly freeze the transaction. A platform administrator will review your claim.</p>
            <textarea 
              className="input-field" 
              placeholder="Describe the issue in detail..." 
              value={disputeReason} 
              onChange={e => setDisputeReason(e.target.value)}
              style={{ minHeight: '120px', marginBottom: '16px', width: '100%', padding: '12px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleRaiseDispute}>Submit Dispute</button>
              <button className="btn-secondary" onClick={() => { setDisputeModalOpen(false); setDisputeReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ComparisonDrawer cities={cities} />
    </>
  );
}
