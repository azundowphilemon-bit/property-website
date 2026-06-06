"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import styles from './admin.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8007';
console.log("API URL:", API);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('azundowphilemon@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRegion, setNewAgentRegion] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [messages, setMessages] = useState({});
  const [newMessages, setNewMessages] = useState({});
  const [viewingForm, setViewingForm] = useState({});
  
  // --- DISPUTES STATE ---
  const [disputes, setDisputes] = useState([]);
  const [resolutionText, setResolutionText] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'Admin') {
      setIsAuthenticated(true);
      loadAll();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token found, skipping loadAll");
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, usersRes, propsRes, inquiriesRes, agentsRes, disputesRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers }),
        fetch(`${API}/api/admin/users`, { headers }),
        fetch(`${API}/api/admin/properties`, { headers }),
        fetch(`${API}/api/admin/inquiries`, { headers }),
        fetch(`${API}/api/admin/agents`, { headers }),
        fetch(`${API}/api/admin/disputes`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (propsRes.ok) setProperties(await propsRes.json());
      if (inquiriesRes && inquiriesRes.ok) {
        const inqs = await inquiriesRes.json();
        setInquiries(inqs);
        inqs.forEach(i => fetchMessages(i.id));
      }
      if (agentsRes && agentsRes.ok) setAgents(await agentsRes.json());
      if (disputesRes && disputesRes.ok) setDisputes(await disputesRes.json());
    } catch (error) {
      console.warn("Network error during loadAll (likely backend offline):", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', adminEmail);
      formData.append('password', adminPassword);
      const res = await fetch(`${API}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role !== 'Admin') {
          setLoginError('Account does not have Admin privileges.');
          setIsLoggingIn(false);
          return;
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('currentUser', JSON.stringify({ full_name: data.full_name, role: data.role }));
        window.location.reload();
      } else {
        setLoginError('Backend admin account not found.');
      }
    } catch {
      setLoginError('Connection error. Is the backend running?');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSuspend = async (userId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/users/${userId}/suspend`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) loadAll();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user and all their listings?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) loadAll();
  };

  const handleDeleteProperty = async (propId) => {
    if (!window.confirm('Permanently delete this property listing?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/properties/${propId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) loadAll();
  };

  const updateInquiryStatus = async (id, action) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/admin/inquiries/${id}/${action}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) loadAll();
  };

  const fetchMessages = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/inquiries/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => ({ ...prev, [id]: data }));
    }
  };

  const handleSendMessage = async (id) => {
    const msg = newMessages[id];
    if (!msg?.trim()) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/inquiries/${id}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg })
    });
    setNewMessages(prev => ({ ...prev, [id]: '' }));
    fetchMessages(id);
  };

  const handleScheduleViewing = async (id) => {
    const form = viewingForm[id];
    if (!form?.agent_id || !form?.scheduled_time) return alert("Select an agent and time");
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/inquiries/${id}/schedule-viewing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    loadAll();
  };

  const handleResolveDispute = async (id, terminate) => {
    const resText = resolutionText[id];
    if (!resText?.trim()) return alert("Please enter a resolution note.");
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/disputes/${id}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resolution: resText, terminate_deal: terminate })
    });
    setResolutionText(prev => ({ ...prev, [id]: '' }));
    loadAll();
  };

  const handleRejectDispute = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/disputes/${id}/reject`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    loadAll();
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!newAgentName || !newAgentRegion || !newAgentPhone) return alert("Please fill all agent fields.");
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newAgentName, region: newAgentRegion, phone: newAgentPhone, email: newAgentEmail })
    });
    setNewAgentName('');
    setNewAgentRegion('');
    setNewAgentPhone('');
    setNewAgentEmail('');
    loadAll();
  };

  const handleDeleteAgent = async (id) => {
    if (!window.confirm("Delete this agent?")) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/admin/agents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    loadAll();
  };

  // --- Login Gate ---
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className={styles.loginWrap}>
          <div className={`${styles.loginCard} animate-fade-in`}>
            <div className={styles.loginIcon}>🔐</div>
            <h2 className={styles.loginTitle}>Admin <span className="gradient-text">Access</span></h2>
            <p className={styles.loginSub}>Enter your credentials to access the dashboard.</p>
            <form onSubmit={handleQuickLogin}>
              <input
                type="email"
                className={styles.loginInput}
                placeholder="Enter admin email..."
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className={styles.loginInput}
                placeholder="Enter admin password..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
              {loginError && <p className={styles.loginError}>{loginError}</p>}
              <button type="submit" className={styles.loginBtn} disabled={isLoggingIn}>
                {isLoggingIn ? 'Verifying...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin <span className="gradient-text">Dashboard</span></h1>
            <p className={styles.headerSub}>Manage users, listings, and platform activity</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statValue}>{stats.total_users}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
              <div className={styles.statIcon}>✅</div>
              <div className={`${styles.statValue} ${styles.green}`}>{stats.active_users}</div>
              <div className={styles.statLabel}>Active Users</div>
            </div>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
              <div className={styles.statIcon}>🚫</div>
              <div className={`${styles.statValue} ${styles.red}`}>{stats.suspended_users}</div>
              <div className={styles.statLabel}>Suspended</div>
            </div>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}>
              <div className={styles.statIcon}>🏘️</div>
              <div className={styles.statValue}>{stats.total_properties}</div>
              <div className={styles.statLabel}>Total Listings</div>
            </div>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}>
              <div className={styles.statIcon}>🏷️</div>
              <div className={`${styles.statValue} ${styles.green}`}>{stats.for_sale}</div>
              <div className={styles.statLabel}>For Sale</div>
            </div>
            <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('properties')}>
              <div className={styles.statIcon}>🔑</div>
              <div className={`${styles.statValue} ${styles.orange}`}>{stats.for_rent}</div>
              <div className={styles.statLabel}>For Rent</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`} onClick={() => setActiveTab('users')}>
            👥 Users ({users.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'properties' ? styles.tabActive : ''}`} onClick={() => setActiveTab('properties')}>
            🏘️ Listings ({properties.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'inquiries' ? styles.tabActive : ''}`} onClick={() => setActiveTab('inquiries')}>
            📩 Inquiries ({inquiries?.length || 0})
          </button>
          <button className={`${styles.tab} ${activeTab === 'disputes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('disputes')}>
            ⚠️ Disputes {Array.isArray(disputes) && disputes.filter(d => d.status === 'open').length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '4px' }}>{disputes.filter(d => d.status === 'open').length}</span>}
          </button>
          <button className={`${styles.tab} ${activeTab === 'agents' ? styles.tabActive : ''}`} onClick={() => setActiveTab('agents')}>
            👔 Agents ({agents?.length || 0})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={`${styles.card} animate-fade-in`}>
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : users.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td className={styles.bold}>{user.full_name || '—'}</td>
                        <td>{user.email}</td>
                        <td>{user.mobile || '—'}</td>
                        <td>
                          <span className={`${styles.badge} ${user.role === 'Admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.is_active ? (
                            <span className={styles.statusActive}>● Active</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspended</span>
                          )}
                        </td>
                        <td>
                          {user.role !== 'Admin' && (
                            <div className={styles.actions}>
                              <button className={`${styles.btnAction} ${styles.btnSuspend}`} onClick={() => handleSuspend(user.id)}>
                                {user.is_active ? 'Suspend' : 'Unsuspend'}
                              </button>
                              <button className={`${styles.btnAction} ${styles.btnDelete}`} onClick={() => handleDeleteUser(user.id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>No users found.</div>
              )}
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className={`${styles.card} animate-fade-in`}>
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : properties.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Price (GHS)</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td className={styles.bold}>{p.title}</td>
                        <td>{p.price?.toLocaleString()}</td>
                        <td>
                          <span className={`${styles.badge} ${p.type === 'Rent' ? styles.badgeRent : styles.badgeSale}`}>
                            {p.type === 'Rent' ? 'For Rent' : 'For Sale'}
                          </span>
                        </td>
                        <td>{p.category || '—'}</td>
                        <td>{p.city}, {p.region}</td>
                        <td>
                          <div>{p.owner_name}</div>
                          <div className={styles.subText}>{p.owner_email}</div>
                        </td>
                        <td>
                          <button className={`${styles.btnAction} ${styles.btnDelete}`} onClick={() => handleDeleteProperty(p.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>No listings found.</div>
              )}
            </div>
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className={`${styles.card} animate-fade-in`}>
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : inquiries.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Property</th>
                      <th>Buyer/User</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map(inq => (
                      <tr key={inq.id}>
                        <td>#{inq.id}</td>
                        <td className={styles.bold}>{inq.property_title}<br/><span className={styles.subText}>GHS {inq.property_price?.toLocaleString()}</span></td>
                        <td>{inq.user_name}<br/><span className={styles.subText}>{inq.user_email}</span></td>
                        <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inq.message}>{inq.message}</td>
                        <td style={{ verticalAlign: 'top', minWidth: '200px' }}>
                          <span className={styles.badge} style={{
                            background: inq.status === 'completed' ? 'rgba(168, 85, 247, 0.2)' : 
                                        inq.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: inq.status === 'completed' ? '#a855f7' : 
                                   inq.status === 'rejected' ? '#ef4444' : '#3b82f6',
                            marginBottom: '12px', display: 'inline-block'
                          }}>{inq.status.replace('_', ' ').toUpperCase()}</span>

                          <div className={styles.actions} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {inq.status === 'pending' && <button className={`${styles.btnAction}`} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => updateInquiryStatus(inq.id, 'verify')}>Verify Prop+Seller</button>}
                            
                            {inq.status === 'verified' && <button className={`${styles.btnAction}`} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => updateInquiryStatus(inq.id, 'approve')}>Approve Buyer</button>}
                            
                            {['pending', 'verified'].includes(inq.status) && <button className={`${styles.btnAction} ${styles.btnDelete}`} onClick={() => updateInquiryStatus(inq.id, 'reject')}>Reject</button>}

                            {inq.status === 'approved' && (
                              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '8px', width: '100%' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Schedule Viewing</p>
                                <select style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '4px' }} onChange={e => setViewingForm(prev => ({...prev, [inq.id]: {...prev[inq.id], agent_id: e.target.value}}))}>
                                  <option value="">Select Agent</option>
                                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.region})</option>)}
                                </select>
                                <input type="datetime-local" style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '4px' }} onChange={e => setViewingForm(prev => ({...prev, [inq.id]: {...prev[inq.id], scheduled_time: e.target.value}}))} />
                                <button className={`${styles.btnAction}`} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', width: '100%' }} onClick={() => handleScheduleViewing(inq.id)}>Assign Agent</button>
                              </div>
                            )}

                            {inq.status === 'payment_submitted' && (
                              <div style={{ marginTop: '8px', width: '100%' }}>
                                {inq.payment_proof_url && <a href={inq.payment_proof_url} target="_blank" style={{ display: 'block', fontSize: '0.8rem', color: '#3b82f6', marginBottom: '4px' }}>View Buyer Receipt</a>}
                                <p style={{ fontSize: '0.8rem', color: inq.seller_confirmed_payment ? '#22c55e' : '#ef4444' }}>Seller Confirmed: {inq.seller_confirmed_payment ? 'YES' : 'NO'}</p>
                                <button className={`${styles.btnAction}`} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }} onClick={() => updateInquiryStatus(inq.id, 'confirm-payment')}>Confirm Payment</button>
                              </div>
                            )}

                            {inq.status === 'payment_confirmed' && (
                              <button className={`${styles.btnAction}`} style={{ background: '#a855f7', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => updateInquiryStatus(inq.id, 'complete')}>Complete & Release Docs</button>
                            )}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', minWidth: '250px' }}>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                            {messages[inq.id]?.map(m => (
                              <div key={m.id} style={{ fontSize: '0.8rem', marginBottom: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                                <strong style={{ color: m.sender_role === 'admin' ? '#22c55e' : '#3b82f6' }}>{m.sender_role.toUpperCase()}:</strong> {m.message}
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                            <input type="text" placeholder="Reply..." style={{ width: '100%', padding: '4px' }} value={newMessages[inq.id] || ''} onChange={e => setNewMessages(prev => ({...prev, [inq.id]: e.target.value}))} />
                            <button onClick={() => handleSendMessage(inq.id)} style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>No inquiries found.</div>
              )}
            </div>
          </div>
        )}

        {/* DISPUTES TAB */}
        {activeTab === 'disputes' && (
          <div className={styles.tableCard}>
            <h2 className={styles.cardTitle}>Dispute Management</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Inquiry ID</th>
                    <th>Property</th>
                    <th>Raised By</th>
                    <th>Reason & Evidence</th>
                    <th>Resolution Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(disputes) && disputes.map(d => (
                    <tr key={d.id}>
                      <td>{d.inquiry_id}</td>
                      <td className={styles.bold}>{d.property_title}</td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                          {d.raised_by.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ minWidth: '300px' }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{d.reason}</p>
                        {d.evidence && d.evidence.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <strong>Evidence:</strong>
                            <ul style={{ paddingLeft: '20px', marginTop: '4px', fontSize: '0.8rem' }}>
                              {d.evidence.map(e => (
                                <li key={e.id}><a href={e.file_url} target="_blank" style={{ color: '#3b82f6' }}>View Document</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td style={{ minWidth: '250px' }}>
                        <span className={styles.badge} style={{
                          background: d.status === 'open' ? 'rgba(239, 68, 68, 0.2)' : 
                                      d.status === 'resolved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                          color: d.status === 'open' ? '#ef4444' : 
                                 d.status === 'resolved' ? '#22c55e' : '#aaa',
                          marginBottom: '12px', display: 'inline-block'
                        }}>{d.status.toUpperCase()}</span>

                        {d.status === 'open' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <textarea 
                              placeholder="Admin resolution note..."
                              style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                              value={resolutionText[d.id] || ''}
                              onChange={e => setResolutionText(prev => ({...prev, [d.id]: e.target.value}))}
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button className={styles.btnAction} style={{ background: '#22c55e', color: 'white', flex: 1 }} onClick={() => handleResolveDispute(d.id, false)}>Resolve & Unfreeze</button>
                              <button className={styles.btnAction} style={{ background: '#ef4444', color: 'white', flex: 1 }} onClick={() => handleResolveDispute(d.id, true)}>Resolve & Reject Deal</button>
                              <button className={styles.btnAction} style={{ background: 'transparent', border: '1px solid #aaa', color: '#aaa', width: '100%' }} onClick={() => handleRejectDispute(d.id)}>Dismiss Dispute (Spam)</button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#22c55e' }}>{d.resolution}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(disputes) || disputes.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No disputes found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className={`${styles.card} animate-fade-in`}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Agent Management</h2>
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Add New Agent</h3>
              <form onSubmit={handleCreateAgent} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Name" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', flex: 1 }} required />
                <input type="text" placeholder="Region (e.g. Accra)" value={newAgentRegion} onChange={e => setNewAgentRegion(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', flex: 1 }} required />
                <input type="text" placeholder="Phone Number" value={newAgentPhone} onChange={e => setNewAgentPhone(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', flex: 1 }} required />
                <input type="email" placeholder="Email Address" value={newAgentEmail} onChange={e => setNewAgentEmail(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', flex: 1 }} />
                <button type="submit" className={styles.btnAction} style={{ background: '#3b82f6', color: 'white' }}>Add Agent</button>
              </form>
            </div>

            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.emptyState}>Loading...</div>
              ) : agents.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Region</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.id}>
                        <td>#{a.id}</td>
                        <td className={styles.bold}>{a.name}</td>
                        <td>{a.region}</td>
                        <td>{a.phone}</td>
                        <td>{a.email || '—'}</td>
                        <td>
                          <button className={`${styles.btnAction} ${styles.btnDelete}`} onClick={() => handleDeleteAgent(a.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>No agents found. Add one above.</div>
              )}
            </div>
          </div>
        )}

      </main>
    </>
  );
}
