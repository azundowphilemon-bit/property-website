import { useState, useEffect, useRef } from 'react'
import './index.css'

const CanvasCaptcha = ({ onChange }) => {
  const canvasRef = useRef(null)

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let text = ''
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    onChange(text)
    drawCaptcha(text)
  }

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background noise
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dots
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16)
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 0.8, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.stroke()
    }

    // Text
    ctx.font = 'italic bold 26px "Courier New"'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < text.length; i++) {
      ctx.save()
      ctx.translate(20 + i * 25, canvas.height / 2)
      ctx.rotate((Math.random() - 0.5) * 0.5)
      ctx.fillStyle = '#111'
      ctx.fillText(text[i], 0, 0)
      ctx.restore()
    }
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  return (
    <div className="captcha-container-ui" style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <canvas ref={canvasRef} width="170" height="50" style={{ border: '2px dashed #bbb', borderRadius: '4px', background: '#fff' }} onClick={generateCaptcha} title="Click to refresh" />
        <button type="button" onClick={generateCaptcha} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '1.2rem' }}>🔄</button>
      </div>
    </div>
  )
}

const PropertyCard = ({ property, cities, currentUser, onDelete, onInterest }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const images = property.images && property.images.length > 0
    ? property.images
    : [{ image_url: 'https://picsum.photos/400/300' }]

  const nextImg = (e) => {
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevImg = (e) => {
    e.stopPropagation()
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const isOwner = currentUser && (currentUser.id === property.user_id)
  const isAdmin = currentUser && (currentUser.role === 'Admin')
  const canDelete = isOwner || isAdmin

  return (
    <div className="property-card" style={{ position: 'relative' }}>
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm("Are you sure you want to delete this property?")) {
              onDelete(property.id)
            }
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
          title="Delete Property"
        >
          DELETE
        </button>
      )}
      <div className="property-image-container">
        {images.length > 1 && (
          <>
            <button className="slider-btn prev" onClick={prevImg}>&lt;</button>
            <button className="slider-btn next" onClick={nextImg}>&gt;</button>
            <div className="image-badge">{currentImgIndex + 1} / {images.length}</div>
          </>
        )}
        <img
          src={images[currentImgIndex].image_url.startsWith('http') ? images[currentImgIndex].image_url : `http://127.0.0.1:8007${images[currentImgIndex].image_url}`}
          alt={property.title}
          className="property-image"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://picsum.photos/400/300' }}
        />
        <div
          onClick={(e) => {
            e.stopPropagation()
            onInterest(property)
          }}
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            border: '1px solid white',
            zIndex: 5,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
        >
          Click here if you are interested
        </div>
      </div>
      <div className="property-info">
        <div className="property-price">GHS {property.price.toLocaleString()}</div>
        <h3 className="property-title">{property.title}</h3>
        <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0' }}>📍 {cities.find(c => c.id === property.city_id)?.name}</p>
        <p className="property-desc" style={{ fontSize: '0.85rem', color: '#444', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '10px' }}>
          {property.description}
        </p>
        <div className="property-details">
          <span>{property.bedrooms} BHK</span>
          <span>{property.bathrooms} Bath</span>
          <span>{property.area_sqft} sqft</span>
        </div>
      </div>
    </div>
  )
}

const OurTeamModal = ({ onClose, teamData, setTeamData, userRole }) => {
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({})

  const handleEditClick = (index, member) => {
    setEditingIndex(index)
    setEditForm({ ...member })
  }

  const handleSave = (index) => {
    const updatedTeam = [...teamData]
    updatedTeam[index] = editForm
    setTeamData(updatedTeam)
    localStorage.setItem('teamData', JSON.stringify(updatedTeam))
    setEditingIndex(null)
  }

  const handleImageChange = (e, index) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', maxHeight: '90vh', overflowY: 'auto', background: '#f9f9f9' }}>
        <div className="modal-close" onClick={onClose} style={{ top: '20px', right: '20px', fontSize: '2rem', zIndex: 10 }}>&times;</div>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary-color)', fontSize: '2.5rem', fontWeight: 'bold' }}>OUR TEAM</h2>
        <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666', fontSize: '1.1rem' }}>Meet our representatives across the regions</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', padding: '10px' }}>
          {teamData.map((member, index) => (
            <div key={index} style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease', position: 'relative' }}>
              <div style={{ background: 'var(--primary-color)', padding: '15px', textAlign: 'center', color: 'white' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{member.region}</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>{member.city}</p>
              </div>

              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '5px solid #f0f0f0' }}>
                  <img src={member.image || 'https://via.placeholder.com/150'} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {editingIndex === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index)} style={{ fontSize: '0.8rem' }} />
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} placeholder="Mobile" style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <input type="text" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
                      <button onClick={() => handleSave(index)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingIndex(null)} style={{ background: '#ccc', color: '#333', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#333' }}>{member.name || 'Representative Name'}</h4>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>📞 {member.mobile || '+233 XX XXX XXXX'}</p>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>✉️ {member.email || 'email@example.com'}</p>
                    {userRole === 'Admin' && (
                      <button
                        onClick={() => handleEditClick(index, member)}
                        style={{ marginTop: '15px', background: 'none', border: '1px solid #eee', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', color: '#999' }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [properties, setProperties] = useState([])
  const [cities, setCities] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const [searchParams, setSearchParams] = useState({
    city_id: '',
    property_type: 'Buy',
    max_price: ''
  })
  const [loading, setLoading] = useState(false)

  const handleDeleteProperty = async (propertyId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8007/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        alert("Property deleted successfully")
        setProperties(prev => prev.filter(p => p.id !== propertyId))
      } else {
        const data = await response.json()
        alert(data.detail || "Failed to delete property")
      }
    } catch (err) {
      console.error(err)
      alert("Error deleting property")
    }
  }

  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login', 'signup', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaValue, setCaptchaValue] = useState('')
  const [userInputCaptcha, setUserInputCaptcha] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)
  const [interestMessage, setInterestMessage] = useState('')

  const [authData, setAuthData] = useState({
    email: '', password: '', full_name: '',
    mobile: '', role: 'Buyer/Owner/Tenant',
    registration_message: '', registration_intent: 'Buy'
  })

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const deletionReasons = [
    "I found what I was looking for.",
    "The platform is difficult to use.",
    "Privacy concerns.",
    "Receiving too many emails/notifications.",
    "I want to recreate my account with different details.",
    "Other / No longer need the service."
  ]

  // Admin State
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'User')
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  const [newAdminData, setNewAdminData] = useState({ full_name: '', email: '', password: '', mobile: '' })
  const [adminFeedback, setAdminFeedback] = useState({ message: '', type: '' }) // 'success' or 'error'

  // Our Team State
  const [showTeamModal, setShowTeamModal] = useState(false)
  const initialTeamData = [
    { region: 'AHAFO REGION', city: 'Goaso', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'ASHANTI REGION', city: 'Kumasi', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'BONO REGION', city: 'Sunyani', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'BONO EAST REGION', city: 'Techiman', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'CENTRAL REGION', city: 'Cape Coast', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'EASTERN REGION', city: 'Koforidua', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'GREATER ACCRA REGION', city: 'Accra', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'NORTH EAST REGION', city: 'Nalerigu', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'NORTHERN REGION', city: 'Tamale', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'OTI REGION', city: 'Dambai', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'SAVANNAH REGION', city: 'Damongo', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'UPPER EAST REGION', city: 'Bolgatanga', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'UPPER WEST REGION', city: 'Wa', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'VOLTA REGION', city: 'Ho', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'WESTERN REGION', city: 'Sekondi-Takoradi', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' },
    { region: 'WESTERN NORTH REGION', city: 'Sefwi Wiawso', name: 'Representative Name', mobile: '+233 XX XXX XXXX', email: 'email@example.com', image: '' }
  ]

  const [teamData, setTeamData] = useState(() => {
    const saved = localStorage.getItem('teamData')
    return saved ? JSON.parse(saved) : initialTeamData
  })

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [newProperty, setNewProperty] = useState({
    title: '', description: '', price: '', type: 'Buy',
    bedrooms: 2, bathrooms: 2, area_sqft: 1200, city_id: '',
    image_urls: []
  })

  // Chatbot state
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: 'You are welcome to Falibari Real Estate Management. How can I help you today?' }
  ])

  // Update chat welcome message when user logs in
  useEffect(() => {
    if (currentUser && currentUser.full_name) {
      setChatHistory(prev => {
        // Only replace the first message if it's the generic welcome
        if (prev.length > 0 && prev[0].role === 'bot' && prev[0].text.includes('Falibari Real Estate')) {
          const newHistory = [...prev]
          newHistory[0] = { role: 'bot', text: `You are welcome to Falibari Real Estate Management, ${currentUser.full_name}. How can I help you today?` }
          return newHistory
        }
        return prev
      })
    }
  }, [currentUser])

  useEffect(() => {
    // Check for URL query params (for Email Links)
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    const token = params.get('token')

    if (mode === 'reset' && token) {
      setAuthMode('reset')
      setResetToken(token)
      setShowAuthModal(true)
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    fetchCities()
    searchProperties()
  }, [])

  const fetchCities = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8007/api/cities')
      if (!response.ok) throw new Error('Failed to fetch cities')
      const data = await response.json()
      setCities(data)
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const searchProperties = async () => {
    setLoading(true)
    try {
      let url = `http://127.0.0.1:8007/api/properties?property_type=${searchParams.property_type}`
      if (searchParams.city_id) url += `&city_id=${searchParams.city_id}`
      if (searchParams.max_price) url += `&max_price=${searchParams.max_price}`

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch properties')
      const data = await response.json()
      setProperties(data)
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    if (authMode === 'signup' && userInputCaptcha.toUpperCase() !== captchaValue.toUpperCase()) {
      alert('Invalid identification letters. Please enter exactly what you see in the box.')
      return
    }

    try {
      let response;
      if (authMode === 'login') {
        const formData = new FormData()
        formData.append('username', authData.email || authData.mobile)
        formData.append('password', authData.password)
        response = await fetch(`http://127.0.0.1:8007/api/auth/token`, {
          method: 'POST',
          body: formData
        })
      } else if (authMode === 'signup') {
        response = await fetch(`http://127.0.0.1:8007/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData)
        })
      }

      const data = await response.json()
      if (response.ok) {
        if (authMode === 'login') {
          localStorage.setItem('token', data.access_token)
          localStorage.setItem('role', data.role)

          // New: Store full user details
          const userData = { id: data.user_id, role: data.role, full_name: data.full_name }
          localStorage.setItem('currentUser', JSON.stringify(userData))
          setCurrentUser(userData)

          setToken(data.access_token)
          setUserRole(data.role)
          // Don't close modal, show choice instead
          setAuthMode('welcome_choice')
          // alert('Logged in successfully!') // Removed to make flow smoother
        } else {
          setAuthMode('login')
          setAuthData({ email: '', password: '', full_name: '', mobile: '', role: 'Buyer/Owner/Tenant', registration_message: '', registration_intent: 'Buy' })
          alert('Registration successful! A confirmation email has been sent to your inbox. Please click the link to activate your account.')
        }
      } else {
        alert(data.detail || 'Authentication failed: ' + (data.message || 'Check your credentials'))
      }
    } catch (err) {
      alert('Network Error: Could not reach the server. Ensure the backend is running at http://127.0.0.1:8007')
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://127.0.0.1:8007/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email })
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        // For simulation, we'll automatically move to reset view with the token
        if (data.debug_token) {
          setTimeout(() => {
            const confirmReset = window.confirm("SIMULATION: Would you like to proceed to the Reset Password page using the token sent to your 'email'?")
            if (confirmReset) {
              setResetToken(data.debug_token)
              setAuthMode('reset')
            }
          }, 1000)
        }
      } else {
        alert(data.detail || 'Error requesting password reset')
      }
    } catch (err) {
      alert('Network Error')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword) return
    try {
      const response = await fetch(`http://127.0.0.1:8007/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: newPassword })
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        setAuthMode('login')
        setNewPassword('')
        setResetToken('')
      } else {
        alert(data.detail || 'Error resetting password')
      }
    } catch (err) {
      alert('Network Error')
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!newProperty.city_id) {
        alert('Please select a city.')
        setLoading(false)
        return
      }
      // 1. Upload files first
      const formData = new FormData()
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i])
      }

      const uploadRes = await fetch('http://127.0.0.1:8007/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.detail || 'File upload failed (Auth Error?)')
      }
      const { urls } = await uploadRes.json()

      // 2. Create property with uploaded URLs
      const response = await fetch('http://127.0.0.1:8007/api/properties', {
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
          city_id: parseInt(newProperty.city_id) || 1,
          image_urls: urls
        })
      })

      if (response.ok) {
        alert('Property published successfully! It will appear in search results shortly.')
        setShowUploadModal(false)
        setNewProperty({
          title: '', description: '', price: '', type: 'Buy',
          bedrooms: 2, bathrooms: 2, area_sqft: 1200, city_id: '',
          image_urls: []
        })
        setSelectedFiles([])
        searchProperties()
      } else {
        const data = await response.json()
        alert(data.detail || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload Error:', err)
      if (err.message.includes('validate credentials') || err.message.includes('401')) {
        alert('Your session has expired or is invalid. Please log out and log in again to continue.')
        // logout() // Optional: force logout
      } else {
        alert(`Upload Failed: ${err.message || 'Error connecting to server'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const newMessage = { role: 'user', text: chatMessage }
    setChatHistory([...chatHistory, newMessage])
    setChatMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8007/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      })
      const data = await response.json()
      setChatHistory(prev => [...prev, { role: 'bot', text: data.response }])
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }])
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('currentUser')
    setToken(null)
    setUserRole('User')
    setCurrentUser(null)
  }

  const handleHome = async () => {
    setSearchParams({
      city_id: '',
      property_type: 'Buy',
      max_price: ''
    })
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8007/api/properties')
      if (!response.ok) throw new Error('Failed to fetch properties')
      const data = await response.json()
      setProperties(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error("Home navigation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInterest = (property) => {
    const cityName = cities.find(c => c.id === property.city_id)?.name || 'Unknown City'
    const msg = `I am interested in the property: "${property.title}" (ID: ${property.id}) listed at GHS ${property.price.toLocaleString()} in ${cityName}. Please provide more details.`
    setInterestMessage(msg)
    setShowContactModal(true)
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      mobile: formData.get('mobile'),
      message: formData.get('message')
    }

    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8007/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        setShowContactModal(false)
      } else {
        alert('Error: ' + data.detail)
      }
    } catch (err) {
      alert('Network Error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteReason) {
      alert('Please select a reason for deleting your account.')
      return
    }

    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8007/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: deleteReason })
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        logout()
        setShowDeleteModal(false)
        setShowUploadModal(false)
      } else {
        alert('Error: ' + data.detail)
      }
    } catch (err) {
      alert('Network Error')
    } finally {
      setLoading(false)
    }
  }

  // Admin Functions
  const fetchAdminUsers = async () => {
    try {
      console.log('Fetching admin users...')
      const res = await fetch('http://127.0.0.1:8007/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('Admin users data:', data)
        // alert(`DEBUG: Fetched ${data.length} users`)
        setAdminUsers(data)
      } else {
        const err = await res.json()
        alert(`Failed to fetch users: ${res.status} - ${err.detail}`)
      }
    } catch (err) {
      console.error(err)
      alert('Network Error fetching admin users')
    }
  }

  const handleAdminStatus = async (userId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8007/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        fetchAdminUsers()
      }
    } catch (err) { alert('Action failed') }
  }

  const handleAdminDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user?')) return
    try {
      const res = await fetch(`http://127.0.0.1:8007/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        fetchAdminUsers()
      }
    } catch (err) { alert('Delete failed') }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAdminFeedback({ message: '', type: '' })
    try {
      const res = await fetch('http://127.0.0.1:8007/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData)
      })
      const data = await res.json()
      if (res.ok) {
        setAdminFeedback({ message: data.message, type: 'success' })
        setNewAdminData({ full_name: '', email: '', password: '', mobile: '' })
        fetchAdminUsers() // Refresh list
        // Don't close modal immediately if there's a message to read (like a link)
      } else {
        setAdminFeedback({ message: data.detail || 'Failed to create admin', type: 'error' })
      }
    } catch (err) {
      setAdminFeedback({ message: 'Network Error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <nav style={{ background: 'var(--primary-color)', padding: '15px 0', color: 'white' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h2 style={{ margin: 0, cursor: 'pointer', letterSpacing: '1px' }} onClick={handleHome}>Falibari Real Estate</h2>
            <div className="nav-links" style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
              <span className="nav-link" onClick={handleHome}>Home</span>
              <span className="nav-link" onClick={() => setShowTeamModal(true)}>Our Team</span>
              <span className="nav-link" onClick={() => { setInterestMessage(''); setShowContactModal(true); }}>Contact Us</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span
              className="post-property-btn"
              style={{
                cursor: token && userRole === 'Admin' ? 'not-allowed' : 'pointer',
                background: token && userRole === 'Admin' ? '#ccc' : 'white',
                color: token && userRole === 'Admin' ? '#666' : 'var(--primary-color)',
                padding: '6px 18px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: token && userRole === 'Admin' ? 0.6 : 1
              }}
              onClick={() => {
                if (token && userRole === 'Admin') {
                  alert("Administrators cannot post properties. Please log in as a User or Agent.");
                  return;
                }
                if (token) {
                  setShowUploadModal(true)
                } else {
                  setAuthMode('signup')
                  setShowAuthModal(true)
                }
              }}
            >
              <img src="https://flagcdn.com/w40/gh.png" alt="Ghana Flag" style={{ width: '24px', height: 'auto', borderRadius: '2px' }} />
              Post Property FREE
            </span>
            {token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {userRole === 'Admin' && (
                  <span style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#ffcc00', fontWeight: 'bold' }} onClick={() => { fetchAdminUsers(); setShowAdminModal(true); }}>Admin Dashboard</span>
                )}
                <span style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setShowUploadModal(true)}>My Account</span>
                <span style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={logout}>Logout</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>Login</span>
                <span style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}>Register</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="hero" style={{ height: '300px' }}>
        <div className="container">
          <h1>Find Your Dream Property in Ghana</h1>
          <form className="search-container" onSubmit={(e) => { e.preventDefault(); searchProperties(); }}>
            <select
              value={searchParams.property_type}
              onChange={(e) => setSearchParams({ ...searchParams, property_type: e.target.value })}
            >
              <option value="Buy">Buy</option>
              <option value="Rent">Rent</option>
            </select>

            <select
              value={searchParams.city_id}
              onChange={(e) => setSearchParams({ ...searchParams, city_id: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name} ({city.region})</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Budget (e.g. 500)"
              value={searchParams.max_price}
              onChange={(e) => setSearchParams({ ...searchParams, max_price: e.target.value.replace(/\D/g, '') })}
              style={{ width: '150px' }}
            />

            <button type="submit">Search</button>
          </form>
        </div>
      </div>

      <div className="container">
        <h2 style={{ marginTop: '40px' }}>
          {loading ? 'Searching...' : `Properties for ${searchParams.property_type} in Ghana`}
        </h2>
        <div className="property-grid">
          {properties.length > 0 ? (
            properties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                cities={cities}
                currentUser={currentUser}
                onDelete={handleDeleteProperty}
                onInterest={handleInterest}
              />
            ))
          ) : (
            !loading && <p>No properties found matching your criteria.</p>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ display: 'flex' }}>
            <div className="modal-close" onClick={() => setShowAuthModal(false)}>CLOSE &times;</div>

            <div className="auth-left">
              <h2>
                {authMode === 'login' && 'Login to your account'}
                {authMode === 'signup' && 'Sign Up'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Set New Password'}
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {authMode === 'login' && 'Access your dashboard, track responses and more'}
                {authMode === 'signup' && 'Create an account to start your property journey'}
                {authMode === 'forgot' && 'Enter your email to receive recovery instructions'}
                {authMode === 'reset' && 'Choose a strong password for your security'}
              </p>

              <ul className="benefits-list">
                <li>Post one Single Property for FREE</li>
                <li>Set property alerts for your requirement</li>
                <li>Reach a large pool of registered buyers on the platform</li>
                <li>Showcase your property as Rental, PG or Sale</li>
                <li>Get instant queries over Phone, Email and SMS</li>
              </ul>

              <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#999' }}>
                By continuing, you agree to our <span style={{ color: 'var(--primary-color)' }}>T&C, Privacy Policy</span>
              </div>
            </div>

            <div className="auth-right">
              <div className="role-selector">
                {authMode === 'login' ? (
                  <>
                    <button className={`role-btn ${authData.role === 'Buyer/Owner/Tenant' ? 'active' : ''}`} onClick={() => setAuthData({ ...authData, role: 'Buyer/Owner/Tenant' })}>Buyer/Owner</button>
                    <button className={`role-btn ${authData.role === 'Agent' || authData.role === 'Builder' ? 'active' : ''}`} onClick={() => setAuthData({ ...authData, role: 'Agent' })}>Agent/Builder</button>
                  </>
                ) : null}
              </div>

              {authMode === 'forgot' ? (
                <form className="auth-form" onSubmit={handleForgotPassword}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Enter the email address associated with your account.</p>
                  <input
                    type="email" placeholder="Email ID" required
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                  />
                  <button type="submit">Send Reset Link</button>
                  <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem' }}>
                    Remember your password? <span style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAuthMode('login')}>Login</span>
                  </p>
                </form>
              ) : authMode === 'reset' ? (
                <form className="auth-form" onSubmit={handleResetPassword}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Enter your new password below.</p>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'} placeholder="New Password" required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <span
                      style={{ position: 'absolute', right: '10px', top: '12px', fontSize: '0.7rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </span>
                  </div>
                  <button type="submit">Update Password</button>
                </form>
              ) : authMode === 'welcome_choice' ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <h3 style={{ marginBottom: '30px', color: '#333' }}>Welcome, {currentUser?.full_name || 'User'}!</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button
                      onClick={() => {
                        setShowAuthModal(false)
                        setSearchParams({ ...searchParams, property_type: 'Buy' })
                        searchProperties()
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      style={{
                        padding: '20px',
                        fontSize: '1.2rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '15px'
                      }}
                    >
                      🏠 I want to BUY / RENT
                    </button>

                    <button
                      onClick={() => {
                        setShowAuthModal(false)
                        setShowUploadModal(true)
                      }}
                      style={{
                        padding: '20px',
                        fontSize: '1.2rem',
                        background: 'white',
                        color: 'var(--secondary-color)',
                        border: '2px solid var(--secondary-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '15px',
                        fontWeight: 'bold'
                      }}
                    >
                      💰 I want to SELL
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form className="auth-form" onSubmit={handleAuth}>
                    {authMode === 'signup' && (
                      <input
                        type="text" placeholder="Your Name" required
                        value={authData.full_name}
                        onChange={(e) => setAuthData({ ...authData, full_name: e.target.value })}
                      />
                    )}

                    <input
                      type="text" placeholder={authMode === 'login' ? "Email or Mobile" : "Email ID"} required
                      value={authData.email}
                      onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    />

                    {authMode === 'signup' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ background: '#f0f0f0', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', color: '#666', border: '1px solid #ddd' }}>+233</div>
                        <input
                          type="text" placeholder="Mobile Number" required
                          value={authData.mobile}
                          onChange={(e) => setAuthData({ ...authData, mobile: e.target.value })}
                        />
                      </div>
                    )}

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'} placeholder="Password" required
                        value={authData.password}
                        onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      />
                      <span
                        style={{ position: 'absolute', right: '10px', top: '12px', fontSize: '0.7rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </span>
                    </div>

                    {authMode === 'login' && (
                      <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                        <span
                          style={{ fontSize: '0.85rem', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500' }}
                          onClick={() => setAuthMode('forgot')}
                        >
                          Forgot Password?
                        </span>
                      </div>
                    )}

                    {authMode === 'signup' && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '5px' }}>How did you hear about us?</label>
                        <select
                          value={authData.registration_message}
                          onChange={(e) => setAuthData({ ...authData, registration_message: e.target.value })}
                          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '10px' }}
                          required
                        >
                          <option value="">Select an option</option>
                          <option value="Social Media">Social Media (Facebook, Instagram, etc.)</option>
                          <option value="Friend/Family">From a Friend or Family member</option>
                          <option value="Google Search">Google Search</option>
                          <option value="Radio/TV">Radio / TV Advertisement</option>
                          <option value="Real Estate Blog">Real Estate Blog or News</option>
                          <option value="Other">Other</option>
                        </select>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', marginBottom: '8px' }}>Are you human? Enter the letters below:</p>
                        <CanvasCaptcha onChange={(val) => setCaptchaValue(val)} />
                        <input
                          type="text" placeholder="Enter identification letters" required
                          value={userInputCaptcha}
                          onChange={(e) => setUserInputCaptcha(e.target.value)}
                        />
                      </div>
                    )}

                    <button type="submit">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
                  </form>

                  <div className="social-login">
                    <p style={{ fontSize: '0.8rem', color: '#999', margin: '15px 0' }}>OR Login with</p>
                    <div className="google-btn" onClick={() => alert('Google Login initiated...')}>
                      <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '18px' }} />
                      Continue with Google
                    </div>
                  </div>

                  <div className="form-toggle">
                    {authMode === 'login' ? "New to Falibari Real Estate? " : "Already have an account? "}
                    <span onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthData({ email: '', password: '', full_name: '', mobile: '', role: 'Buyer/Owner/Tenant', registration_message: '', registration_intent: 'Buy' });
                      setUserInputCaptcha('');
                    }}>
                      {authMode === 'login' ? 'Sign Up' : 'Login'}
                    </span>
                  </div>
                </>
              )}



            </div>
          </div >
        </div >
      )
      }

      {/* Upload Modal */}
      {
        showUploadModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '850px' }}>
              <div className="modal-close" onClick={() => setShowUploadModal(false)}>CLOSE &times;</div>
              <form className="upload-form" onSubmit={handleUpload}>
                <h2>Sell or Rent your Property for FREE</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>Connect with thousands of potential buyers and tenants across Ghana every day.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Property Title</label>
                    <input
                      type="text" placeholder="e.g. 3 BHK Apartment in Cantonments" required
                      value={newProperty.title}
                      onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }}
                    />

                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginTop: '15px' }}>Description</label>
                    <textarea
                      placeholder="Enter property details like amenities, nearby locations etc." required rows="4"
                      value={newProperty.description}
                      onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Price (GHS)</label>
                        <input
                          type="number" required
                          value={newProperty.price}
                          onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Property For</label>
                        <select
                          value={newProperty.type}
                          onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }}
                        >
                          <option value="Buy">Sale</option>
                          <option value="Rent">Rent</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Bedrooms</label>
                        <input type="number" value={newProperty.bedrooms} onChange={(e) => setNewProperty({ ...newProperty, bedrooms: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Bathrooms</label>
                        <input type="number" value={newProperty.bathrooms} onChange={(e) => setNewProperty({ ...newProperty, bathrooms: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }} />
                      </div>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>City</label>
                      <select
                        required value={newProperty.city_id}
                        onChange={(e) => setNewProperty({ ...newProperty, city_id: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '5px' }}
                      >
                        <option value="">Select City</option>
                        {cities.map(city => (<option key={city.id} value={city.id}>{city.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block' }}>Property Photos (Max 5 photos)</label>
                  <label className="custom-file-upload">
                    <input
                      type="file" multiple accept="image/*"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files);
                        setSelectedFiles(prev => {
                          const combined = [...prev, ...newFiles].slice(0, 5);
                          return combined;
                        });
                        e.target.value = ''; // Reset to allow re-selecting same file
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                      {selectedFiles.length > 0
                        ? `✅ ${selectedFiles.length} photos selected (Click to add more)`
                        : '📁 Click here to select photos from your computer'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Supported formats: JPG, PNG, WEBP</div>
                  </label>

                  <div className="image-preview-grid">
                    {selectedFiles.map((file, i) => (
                      <div className="image-preview-card" key={i}>
                        <img src={URL.createObjectURL(file)} alt="preview" />
                        <button type="button" className="remove-img-btn" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}>&times;</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #eee', marginTop: '30px', paddingTop: '20px', textAlign: 'center' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading ? '#ccc' : 'var(--secondary-color)',
                      color: 'white',
                      border: 'none',
                      padding: '18px 40px',
                      borderRadius: '30px',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(255, 102, 0, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? 'Publishing...' : 'VERIFY & PUBLISH PROPERTY'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>By publishing, you agree to our Terms & Conditions</p>

                  <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #ddd' }}>
                    <h4 style={{ color: '#d9534f', marginBottom: '10px' }}>Danger Zone</h4>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      style={{ background: 'none', border: '1px solid #d9534f', color: '#d9534f', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Chatbot */}
      {
        !showChat ? (
          <div className="chatbot-bubble" onClick={() => setShowChat(true)}>💬</div>
        ) : (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <span>AI Property Assistant</span>
              <span style={{ cursor: 'pointer', background: 'white', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }} onClick={() => setShowChat(false)}>CLOSE &times;</span>
            </div>
            <div className="chat-messages">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form className="chat-input-area" onSubmit={handleChat}>
              <input
                type="text"
                placeholder="Ask anything..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit">➤</button>
            </form>
          </div>
        )
      }

      {/* Contact Modal */}
      {
        showContactModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div className="modal-close" onClick={() => setShowContactModal(false)} style={{ top: '20px', right: '20px' }}>CLOSE &times;</div>
              <h2 style={{ borderBottom: '2px solid var(--secondary-color)', paddingBottom: '10px', marginBottom: '20px' }}>Contact Falibari Real Estate</h2>
              <p style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '5px' }}>CEOs: Philemon Azundow, Albert, Tommy</p>
              <p style={{ marginBottom: '20px', fontSize: '0.95rem' }}>Send us a message and we'll get back to you immediately.</p>

              <form className="contact-form-ui" onSubmit={handleContactSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <input type="text" name="name" placeholder="Full Name" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  <input type="email" name="email" placeholder="Email Address" required style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                </div>
                <input type="text" name="mobile" placeholder="Mobile Number (+233 ...)" required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '15px' }} />
                <textarea name="message" placeholder="How can we help you?" defaultValue={interestMessage} required rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '15px' }}></textarea>
                <button type="submit" disabled={loading} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                  {loading ? 'Sending...' : 'SEND MESSAGE'}
                </button>
              </form>

              <div className="contact-info-grid" style={{ marginTop: '30px' }}>
                <div className="contact-item">
                  <i style={{ fontSize: '1.2rem', marginBottom: '5px', display: 'block' }}>📍</i>
                  <strong>Office</strong>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Bolgatanga, Ghana</p>
                </div>
                <div className="contact-item">
                  <i style={{ fontSize: '1.2rem', marginBottom: '5px', display: 'block' }}>📞</i>
                  <strong>Phone</strong>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>+233 50 072 9422</p>
                </div>
                <div className="contact-item">
                  <i style={{ fontSize: '1.2rem', marginBottom: '5px', display: 'block' }}>✉️</i>
                  <strong>Email</strong>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>falibari@yahoo.com</p>
                </div>
                <div className="contact-item" style={{ background: '#e7f5ed' }}>
                  <i style={{ fontSize: '1.2rem', marginBottom: '5px', display: 'block' }}>💬</i>
                  <strong>WhatsApp</strong>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>+233 50 072 9422</p>
                </div>
              </div>

              <div style={{ marginTop: '30px', background: '#f0f0f0', padding: '15px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong>Business Hours:</strong><br />
                Monday - Friday: 8:00 AM - 6:00 PM<br />
                Saturday: 9:00 AM - 2:00 PM
              </div>
            </div>
          </div>
        )
      }

      {/* Account Deletion Modal */}
      {
        showDeleteModal && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: '450px', padding: '30px' }}>
              <div className="modal-close" onClick={() => setShowDeleteModal(false)}>CLOSE &times;</div>
              <h2 style={{ color: '#d9534f', marginBottom: '15px' }}>Delete Account?</h2>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                We're sorry to see you go. Please tell us why you're leaving so we can improve:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                {deletionReasons.map((reason, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', padding: '8px', borderRadius: '4px', border: deleteReason === reason ? '1px solid #d9534f' : '1px solid #eee', background: deleteReason === reason ? '#fdf7f7' : 'white' }}>
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason}
                      checked={deleteReason === reason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                    />
                    {reason}
                  </label>
                ))}
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deleteReason}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: loading || !deleteReason ? '#ccc' : '#d9534f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: loading || !deleteReason ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Deleting...' : 'CONFIRM ACCOUNT DELETION'}
              </button>
            </div>
          </div>
        )
      }

      {/* Admin Dashboard Modal */}
      {
        showAdminModal && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="modal-close" onClick={() => setShowAdminModal(false)}>CLOSE &times;</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Admin Dashboard</h2>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  + Add New Admin
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Name/Email</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Role</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Mobile</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Status</th>
                      <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{user.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{user.full_name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{user.role}</td>
                        <td style={{ padding: '12px' }}>{user.mobile}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                            background: user.is_active ? '#d4edda' : '#f8d7da',
                            color: user.is_active ? '#155724' : '#721c24'
                          }}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAdminStatus(user.id)}
                            style={{
                              padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px',
                              background: user.is_active ? '#fff3cd' : '#d4edda', cursor: 'pointer'
                            }}
                          >
                            {user.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleAdminDelete(user.id)}
                            style={{
                              padding: '6px 12px', border: '1px solid #dc3545', borderRadius: '4px',
                              background: '#dc3545', color: 'white', cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Admin Modal */}
      {
        showCreateAdminModal && (
          <div className="modal-overlay" style={{ zIndex: 2100 }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-close" onClick={() => { setShowCreateAdminModal(false); setAdminFeedback({ message: '', type: '' }); }}>CLOSE &times;</div>
              <h2 style={{ marginBottom: '20px', color: '#28a745' }}>Add New Administrator</h2>

              {adminFeedback.message && (
                <div style={{
                  background: adminFeedback.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: adminFeedback.type === 'success' ? '#155724' : '#721c24',
                  padding: '15px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.9rem',
                  wordBreak: 'break-all'
                }}>
                  <strong>{adminFeedback.type === 'success' ? 'Success!' : 'Error:'}</strong><br />
                  {adminFeedback.message}
                </div>
              )}

              {!adminFeedback.message || adminFeedback.type === 'error' ? (
                <form onSubmit={handleCreateAdmin}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={newAdminData.full_name}
                      onChange={(e) => setNewAdminData({ ...newAdminData, full_name: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Mobile Number</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      value={newAdminData.mobile}
                      onChange={(e) => setNewAdminData({ ...newAdminData, mobile: e.target.value })}
                    />
                  </div>
                  <div style={{ background: '#e9fbe9', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem', color: '#155724' }}>
                    ℹ️ An email will be sent to the user with a link to set their own password.
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {loading ? 'Creating Admin...' : 'CREATE ADMIN ACCOUNT'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => { setShowCreateAdminModal(false); setAdminFeedback({ message: '', type: '' }); }}
                    style={{ padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }
      {/* Our Team Modal */}
      {
        showTeamModal && (
          <OurTeamModal onClose={() => setShowTeamModal(false)} teamData={teamData} setTeamData={setTeamData} userRole={userRole} />
        )
      }
    </div >
  )
}

export default App
