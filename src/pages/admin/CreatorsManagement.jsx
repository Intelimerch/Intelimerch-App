// src/pages/admin/CreatorsManagement.jsx
import { useState, useEffect } from 'react'
import { 
  Search, Loader2, AlertCircle, 
  Plus, ArrowLeft, Trash2, Database, Users, X
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import ServerError from '../../components/ServerError'
import { adminAPI } from '../../services/apiClient'
import { useFormPersistence } from '../../hooks/useFormPersistence'

export default function CreatorsManagement() {
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [viewMode, setViewMode] = useState('list')
  const [selectedCreatorId, setSelectedCreatorId] = useState(null)
  const [loadedData, setLoadedData] = useState(null)

  const [viewModePersisted, setViewModePersisted] = useState(() => {
    const saved = sessionStorage.getItem('creators_view_mode')
    return saved || 'list'
  })

  useEffect(() => {
    sessionStorage.setItem('creators_view_mode', viewModePersisted)
  }, [viewModePersisted])

  // ─── Load ONLY Artists from API ───
  const loadCreators = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminAPI.getCreators()
      console.log('📊 Creators API Response:', res)
      
      // Response shape: { data: { totalCreators, currentlyActive, creators: [...] } }
      const list = res.data?.creators || []
      console.log(`✅ Found ${list.length} creators`)
      
      // Log first creator to see fields
      if (list.length > 0) {
        console.log('👤 First creator sample:', list[0])
        console.log('👤 First creator keys:', Object.keys(list[0]))
      }
      
      setCreators(list)
    } catch (err) {
      console.error('Failed to load creators:', err)
      setError(err.message || 'Failed to load creators')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCreators()
  }, [])

  // ─── HELPER: Extract creator name ───
  const getCreatorName = (creator) => {
    return creator.name || creator.firstName || creator.fullName || creator.username || 'Unknown Creator'
  }

  // ─── HELPER: Extract creator username ───
  const getCreatorUsername = (creator) => {
    return creator.handle || creator.userName || creator.username || `@${creator.email?.split('@')[0] || 'user'}`
  }

  // ─── HELPER: Check if creator is active ───
  const isCreatorActive = (creator) => {
    const status = (creator.status || creator.accountStatus || '').toUpperCase()
    return status === 'ACTIVE' || creator.isActive === true
  }

  // ─── Filter creators based on tab and search ───
  const filteredCreators = creators.filter(c => {
    const q = search.toLowerCase()
    const fullName = getCreatorName(c).toLowerCase()
    const username = getCreatorUsername(c).toLowerCase()
    const matchesSearch = 
      fullName.includes(q) ||
      username.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)

    let matchesTab = true
    if (activeTab === 'Active') matchesTab = isCreatorActive(c)
    if (activeTab === 'Inactive') matchesTab = !isCreatorActive(c)

    return matchesSearch && matchesTab
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this creator?')) return
    try {
      setLoading(true)
      await adminAPI.deleteCreator(id)
      setCreators(creators.filter(c => (c._id || c.id) !== id))
      alert('Creator deleted successfully!')
    } catch (err) {
      console.error('Failed to delete creator:', err)
      alert(err.message || 'Failed to delete creator')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadData = async (creatorId) => {
    try {
      setLoading(true)
      const res = await adminAPI.getCreatorFans(creatorId)
      console.log('📊 Creator data loaded:', res)
      
      const fans = Array.isArray(res.data) ? res.data : (res.data?.fans || res.fans || [])
      
      setLoadedData({
        creatorId,
        fans,
        totalFans: fans.length
      })
      
      alert(`Loaded ${fans.length} fans for this creator!`)
    } catch (err) {
      console.error('Failed to load creator data:', err)
      alert(err.message || 'Failed to load creator data')
    } finally {
      setLoading(false)
    }
  }

  // ─── ADD CREATOR FULL PAGE ───
  if (viewModePersisted === 'add') {
    return (
      <AddCreatorPage
        onBack={() => setViewModePersisted('list')}
        onSuccess={() => {
          setViewModePersisted('list')
          loadCreators()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading creators...</p>
      </div>
    )
  }

  if (error) {
    return <ServerError onRetry={loadCreators} />
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creators Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="font-semibold text-gray-700">{filteredCreators.length}</span> creators ·{' '}
            <span className="font-semibold text-gray-700">
              {filteredCreators.filter(c => isCreatorActive(c)).length}
            </span> active
          </p>
        </div>
        <button
          onClick={() => setViewModePersisted('add')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add Creator
        </button>
      </div>

      {/* ─── FILTER TABS + SEARCH ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1">
          {['All', 'Active', 'Inactive'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeTab === tab 
                  ? 'bg-yellow-500 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* ─── LOADED DATA PANEL ─── */}
      {loadedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">Loaded Data for Creator</h3>
            <button onClick={() => setLoadedData(null)} className="p-1 text-blue-500 hover:bg-blue-100 rounded">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-blue-700 mb-2">Total Fans: <strong>{loadedData.totalFans}</strong></p>
          {loadedData.fans.length > 0 && (
            <ul className="space-y-1">
              {loadedData.fans.slice(0, 5).map((fan, i) => (
                <li key={i} className="text-sm text-blue-700">
                  {fan.name || fan.firstName || fan.email || 'Fan'} - {fan.email || fan.phone || 'No contact'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── CREATORS LIST (Full Width Cards) ─── */}
      {filteredCreators.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-gray-300" />}
          title="No creators found"
          description="Try adjusting your search or add a new creator."
        />
      ) : (
        <div className="space-y-4">
          {filteredCreators.map((creator) => {
            const creatorId = creator._id || creator.id
            const isSelected = selectedCreatorId === creatorId
            const isActive = isCreatorActive(creator)
            const creatorName = getCreatorName(creator)
            const creatorUsername = getCreatorUsername(creator)
            
            return (
              <div 
                key={creatorId} 
                className={`bg-white rounded-xl border p-6 transition-all ${
                  isSelected 
                    ? 'border-yellow-400 ring-2 ring-yellow-100' 
                    : 'border-gray-200 hover:shadow-lg'
                }`}
                onClick={() => setSelectedCreatorId(creatorId)}
              >
                {/* Header - Avatar + Name + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {creator.avatar || creator.profileImage ? (
                        <img src={creator.avatar || creator.profileImage} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {creatorName[0]?.toUpperCase()}
                          {creator.lastName?.[0]?.toUpperCase() || ''}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {creatorName}
                      </h3>
                      <p className="text-sm text-gray-500">{creatorUsername}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Stats - Horizontal - Updated field names */}
                <div className="flex gap-12 mb-5">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">TAGS</p>
                    <p className="text-xl font-bold text-gray-900">{creator.totalTags ?? creator.tagsCount ?? creator.tags ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">TOTAL SCANS</p>
                    <p className="text-xl font-bold text-gray-900">{(creator.totalScans ?? creator.scans ?? creator.tapCount ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">CAMPAIGN</p>
                    <p className="text-xl font-bold text-gray-900">{creator.totalCampaign ?? creator.campaignsCount ?? creator.campaigns ?? 0}</p>
                  </div>
                </div>

                {/* Actions - Load Data + Delete */}
                <div className="flex gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLoadData(creatorId) }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Database size={14} />
                    Load Data
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(creatorId) }}
                    className="border border-red-200 text-red-500 hover:bg-red-50 px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── ADD CREATOR FULL PAGE (FIXED) ───
function AddCreatorPage({ onBack, onSuccess }) {
  const [formData, setFormData, clearSavedForm] = useFormPersistence("admin_add_creator", {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    try {
      setLoading(true)
      setError(null)
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        userName: formData.userName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      }

      console.log('📤 Registering creator with payload:', payload)
      
      await adminAPI.registerCreator(payload)
      
      clearSavedForm()
      onSuccess()
    } catch (err) {
      console.error('Failed to register creator:', err)
      setError(err.message || 'Failed to register creator')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    clearSavedForm()
    onBack()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Creator</h1>
          <p className="text-gray-500 text-sm mt-1">Onboard a creator to Intel Merch</p>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name + Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jenny"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Wilson"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. jenny"
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="@youremail"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}