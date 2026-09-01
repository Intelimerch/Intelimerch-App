// src/pages/admin/AdminPerks.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Loader2, AlertCircle, ArrowLeft, 
  Edit2, Trash2, Video, Link2, Image as ImageIcon, 
  FileText, Music, Tag, CheckCircle, Save
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { perksAPI, adminAPI } from '../../services/apiClient'
import { useAuth } from '../../context/AuthContext'
import { useFormPersistence } from '../../hooks/useFormPersistence'

// Map perk types to icons and colors
const PERK_TYPE_STYLES = {
  video: { icon: Video, color: 'bg-red-50 text-red-500' },
  link: { icon: Link2, color: 'bg-purple-50 text-purple-500' },
  image: { icon: ImageIcon, color: 'bg-green-50 text-green-500' },
  document: { icon: FileText, color: 'bg-yellow-50 text-yellow-500' },
  audio: { icon: Music, color: 'bg-blue-50 text-blue-500' },
}

export default function AdminPerks() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [perks, setPerks] = useState([])
  const [categories, setCategories] = useState([])
  const [creators, setCreators] = useState([])
  const [selectedArtistId, setSelectedArtistId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // ✅ Persist viewMode & editingPerkId to sessionStorage
  const [viewMode, setViewMode] = useState(() => {
    const saved = sessionStorage.getItem('admin_perks_view_mode')
    return saved || 'list' // 'list' | 'upload' | 'edit'
  })

  const [editingPerkId, setEditingPerkId] = useState(() => {
    const saved = sessionStorage.getItem('admin_perks_editing_id')
    return saved || null
  })

  // ✅ Persist viewMode & editingPerkId
  useEffect(() => {
    sessionStorage.setItem('admin_perks_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    if (editingPerkId) {
      sessionStorage.setItem('admin_perks_editing_id', editingPerkId)
    } else {
      sessionStorage.removeItem('admin_perks_editing_id')
    }
  }, [editingPerkId])

  // ─── Load Perks, Categories, and Creators ───
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Load creators (to get artistId)
      try {
        const creatorsRes = await adminAPI.getCreators()
        const creatorsList = Array.isArray(creatorsRes.data) ? creatorsRes.data : (creatorsRes.data?.creators || [])
        setCreators(creatorsList)
        
        // Set default artistId to the first creator
        if (creatorsList.length > 0) {
          setSelectedArtistId(creatorsList[0]._id || creatorsList[0].id || '')
        }
      } catch (err) {
        console.error('Failed to load creators:', err)
      }

      // 2. Load perks
      let res
      try {
        res = await perksAPI.getAll()
      } catch (err) {
        console.log('Trying admin perks endpoint...')
        res = await adminAPI.getAllPerks()
      }
      
      console.log('📊 Perks fetched:', res)
      
      let list = []
      if (Array.isArray(res.data)) list = res.data
      else if (res.data?.perks && Array.isArray(res.data.perks)) list = res.data.perks
      else if (Array.isArray(res)) list = res
      else if (res.perks && Array.isArray(res.perks)) list = res.perks
      else if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data
      
      setPerks(list)

      // 3. Load categories
      try {
        const catRes = await perksAPI.getCategories()
        const catList = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.categories || catRes.categories || [])
        setCategories(catList)
      } catch (catErr) {
        console.error('Failed to load categories:', catErr)
        setCategories([])
      }
    } catch (err) {
      console.error('Failed to load perks:', err)
      setError(err.message || 'Failed to load perks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ─── HELPERS: Extract perk data ───
  const getPerkName = (perk) => {
    return perk.perkName || perk.name || perk.title || 'Untitled Perk'
  }

  const getPerkType = (perk) => {
    return perk.contentType || perk.perkType || perk.type || perk.mediaType || 'link'
  }

  const getPerkDescription = (perk) => {
    return perk.description || perk.details || ''
  }

  const getPerkStatus = (perk) => {
    if (perk.status === 'active' || perk.status === 'Active') return 'Active'
    if (perk.status === 'expired' || perk.status === 'Expired') return 'Expired'
    return perk.status || 'Active'
  }

  const getCampaigns = (perk) => {
    return perk.campaigns || perk.usedInCampaigns || []
  }

  const getCreatedAt = (perk) => {
    if (perk.createdAt) return perk.createdAt.split('T')[0]
    if (perk.addedAt) return perk.addedAt.split('T')[0]
    return '—'
  }

  const handleDelete = async (perkId) => {
    if (!window.confirm('Are you sure you want to delete this perk?')) return
    try {
      await perksAPI.remove(perkId)
      setPerks(perks.filter(p => (p._id || p.id) !== perkId))
      alert('Perk deleted successfully!')
    } catch (err) {
      console.error('Failed to delete perk:', err)
      alert(err.message || 'Failed to delete perk')
    }
  }

  // ─── UPLOAD PERK PAGE ───
  if (viewMode === 'upload') {
    return (
      <PerkFormPage
        mode="upload"
        artistId={selectedArtistId}
        categories={categories}
        creators={creators}
        onBack={() => setViewMode('list')}
        onSuccess={() => {
          setViewMode('list')
          loadData()
        }}
      />
    )
  }

  // ─── EDIT PERK PAGE ───
  if (viewMode === 'edit' && editingPerkId) {
    const perkToEdit = perks.find(p => (p._id || p.id) === editingPerkId)
    return (
      <PerkFormPage
        mode="edit"
        perk={perkToEdit}
        artistId={selectedArtistId}
        categories={categories}
        creators={creators}
        onBack={() => {
          setViewMode('list')
          setEditingPerkId(null)
        }}
        onSuccess={() => {
          setViewMode('list')
          setEditingPerkId(null)
          loadData()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading perks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 text-center max-w-md">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perks Library</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all perks for your creators</p>
        </div>
        <button
          onClick={() => setViewMode('upload')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Upload Perk
        </button>
      </div>

      {/* ─── PERKS GRID ─── */}
      {perks.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} className="text-gray-300" />}
          title="No perks found"
          description="Upload your first perk to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((perk) => {
            const perkId = perk._id || perk.id
            const perkType = getPerkType(perk)
            const perkStatus = getPerkStatus(perk)
            const typeStyle = PERK_TYPE_STYLES[perkType] || PERK_TYPE_STYLES.link
            const TypeIcon = typeStyle.icon
            const campaigns = getCampaigns(perk)

            return (
              <div key={perkId} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                {/* Header - Type Icon + Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeStyle.color}`}>
                    <TypeIcon size={18} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingPerkId(perkId)
                        setViewMode('edit')
                      }}
                      className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(perkId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{getPerkName(perk)}</h3>

                {/* Type Badge */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${typeStyle.color}`}>
                  {perkType}
                </span>

                {/* Description */}
                {getPerkDescription(perk) && (
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {getPerkDescription(perk)}
                  </p>
                )}

                {/* Used In Campaigns */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">Used in campaigns:</p>
                  {campaigns.length > 0 ? (
                    <div className="space-y-1">
                      {campaigns.slice(0, 2).map((camp, i) => (
                        <p key={i} className="text-xs text-yellow-500 font-medium">
                          {camp.campaignName || camp.name || camp}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Not used in any campaign yet</p>
                  )}
                </div>

                {/* Footer - Date + Status */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Added {getCreatedAt(perk)}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    perkStatus === 'Active' 
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-500'
                  }`}>
                    {perkStatus}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PERK FORM PAGE (Handles both Upload and Edit) WITH FORM PERSISTENCE ───
function PerkFormPage({ mode, perk, artistId, categories, creators, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState(artistId || '')
  
  // ✅ Use useFormPersistence for form fields
  const storageKey = mode === 'edit' ? `admin_edit_perk_${perk?._id || perk?.id}` : 'admin_upload_perk'
  
  const [formData, setFormData, clearSavedForm] = useFormPersistence(storageKey, {
    perkName: perk?.perkName || perk?.name || '',
    perkCategoryId: perk?.perkCategoryId || '',
    contentType: perk?.contentType || perk?.perkType || 'video',
    fileUrl: perk?.fileUrl || perk?.mediaUrl || '',
    description: perk?.description || '',
    file: null,
  })

  const isEditMode = mode === 'edit'

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate artistId is selected
    if (!selectedArtist) {
      setError('Please select an artist/creator')
      return
    }

    // ✅ VALIDATE: File is required for upload
    if (!isEditMode && !formData.file) {
      setError('Please attach a file to upload this perk')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Build payload
      const payload = {
        perkName: formData.perkName,
        perkCategoryId: formData.perkCategoryId,
        contentType: formData.contentType,
        fileUrl: formData.fileUrl,
        description: formData.description,
      }

      // ✅ Include the FILE if selected
      if (formData.file) {
        payload.file = formData.file
      }

      console.log(`📤 ${isEditMode ? 'Updating' : 'Uploading'} perk with payload:`, payload)
      console.log('🎯 Using artistId:', selectedArtist)

      let response
      if (isEditMode) {
        response = await perksAPI.update(perk._id || perk.id, payload)
      } else {
        response = await perksAPI.create(selectedArtist, payload)
      }
      
      console.log(`✅ Perk ${isEditMode ? 'updated' : 'uploaded'}:`, response)

      setSuccess(true)
      // ✅ Clear saved form after success
      clearSavedForm()
      
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      console.error(`❌ Error ${isEditMode ? 'updating' : 'uploading'} perk:`, err)
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'upload'} perk`)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // ✅ Clear saved form when navigating back
    clearSavedForm()
    onBack()
  }

  const perkTypes = [
    { value: 'video', label: 'Video' },
    { value: 'link', label: 'Link' },
    { value: 'image', label: 'Image' },
    { value: 'document', label: 'Document' },
    { value: 'audio', label: 'Audio' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Perk' : 'Upload Perk'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEditMode ? 'Update your perk details' : 'Create a new perk for your library'}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {success && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>Perk {isEditMode ? 'updated' : 'uploaded'} successfully! Redirecting...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Artist/Creator */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Select Artist</label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            >
              <option value="">Select an artist</option>
              {creators.map(creator => (
                <option key={creator._id || creator.id} value={creator._id || creator.id}>
                  {creator.firstName} {creator.lastName} ({creator.email || creator.userName})
                </option>
              ))}
            </select>
          </div>

          {/* Perk Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Perk Name</label>
            <input
              type="text"
              placeholder="e.g. Exclusive BTS Video"
              value={formData.perkName}
              onChange={(e) => setFormData({...formData, perkName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            />
          </div>

          {/* Perk Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Perk Category</label>
            <select
              value={formData.perkCategoryId}
              onChange={(e) => setFormData({...formData, perkCategoryId: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name || cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Perk Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Content Type</label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData({...formData, contentType: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              {perkTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[100px]"
              placeholder="Enter perk description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Upload File OR URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Perk File</label>
            <div className="space-y-3">
              <label className="border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-1 cursor-pointer border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                />
                <Plus size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {formData.file ? formData.file.name : (isEditMode ? "Tap to upload new file (optional)" : "Tap to upload perk file (REQUIRED)")}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <input
                type="url"
                placeholder="Enter file URL (e.g. https://example.com/perk.mp4)"
                value={formData.fileUrl}
                onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {isEditMode ? 'Saving...' : 'Uploading...'}
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} /> {isEditMode ? 'Saved!' : 'Uploaded!'}
                </>
              ) : (
                <>
                  {isEditMode ? <Save size={16} /> : <Plus size={16} />} 
                  {isEditMode ? 'Save Changes' : 'Upload Perk'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}