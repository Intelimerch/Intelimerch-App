// src/pages/admin/AdminTags.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Loader2, AlertCircle, MoreHorizontal, 
  Plus, ArrowLeft, ExternalLink, Tag, Trash2, Edit2, Eye
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { tagsAPI, campaignAPI } from '../../services/apiClient'

export default function AdminTags() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [openMenu, setOpenMenu] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'generate'

  // ─── Load Tags from API (REAL DATA) ───
  const loadTags = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to get all tags (this should work for admins too)
      let res
      try {
        res = await tagsAPI.getAll()
      } catch (err) {
        // Fallback to artist tags if admin endpoint fails
        console.log('Trying artist tags endpoint...')
        res = await tagsAPI.getArtistTags()
      }
      
      console.log('📊 Tags fetched:', res)
      
      // Parse the response (handles multiple shapes)
      let list = []
      if (Array.isArray(res.data)) list = res.data
      else if (res.data?.tags && Array.isArray(res.data.tags)) list = res.data.tags
      else if (Array.isArray(res)) list = res
      else if (res.tags && Array.isArray(res.tags)) list = res.tags
      else if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data
      
      setTags(list)
    } catch (err) {
      console.error('Failed to load tags:', err)
      setError(err.message || 'Failed to load tags')
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
  }, [])

  // ─── HELPERS: Extract tag data ───
  const getTagId = (tag) => {
    return tag.tagId || tag._id?.slice(-8) || tag.id || '—'
  }

  const getNfcLink = (tag) => {
    return tag.nfcLink || tag.nfcUrl || tag.link || `https://merch.link/tag-${getTagId(tag)}`
  }

  const getType = (tag) => {
    return tag.type || tag.productType || tag.category || '—'
  }

  const getColor = (tag) => {
    return tag.color || '—'
  }

  const getSize = (tag) => {
    return tag.size || '—'
  }

  const getSku = (tag) => {
    return tag.sku || tag.productSku || '—'
  }

  const getBatchNo = (tag) => {
    return tag.batchNo || tag.batchNumber || tag.batch || '—'
  }

  const getCampaign = (tag) => {
    return tag.campaign || tag.campaignName || '—'
  }

  const getCampaignId = (tag) => {
    return tag.campaignId || tag.campId || tag.campaign?._id?.slice(-6) || '—'
  }

  const getProductId = (tag) => {
    return tag.productId || tag.product?._id?.slice(-6) || '—'
  }

  const getScans = (tag) => {
    return tag.scans || tag.tapCount || tag.totalScans || 0
  }

  // ─── Filter tags based on type filter and search ───
  const filteredTags = tags.filter(tag => {
    const q = search.toLowerCase()
    const tagId = getTagId(tag).toLowerCase()
    const nfcLink = getNfcLink(tag).toLowerCase()
    const sku = getSku(tag).toLowerCase()
    const type = getType(tag).toLowerCase()
    
    const matchesSearch = 
      tagId.includes(q) || 
      nfcLink.includes(q) || 
      sku.includes(q) ||
      type.includes(q)

    let matchesFilter = true
    if (activeFilter !== 'All') {
      matchesFilter = type.includes(activeFilter.toLowerCase())
    }

    return matchesSearch && matchesFilter
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return
    try {
      await tagsAPI.remove(id)
      setTags(tags.filter(t => (t._id || t.id) !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete tag')
    }
  }

  // ─── GENERATE TAG PAGE ───
  if (viewMode === 'generate') {
    return (
      <GenerateTagPage
        onBack={() => setViewMode('list')}
        onSuccess={() => {
          setViewMode('list')
          loadTags()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading tags...</p>
      </div>
    )
  }

  if (error && tags.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and manage NFC smart tag links</p>
        </div>
        <button
          onClick={() => setViewMode('generate')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Generate New Tag
        </button>
      </div>

      {/* ─── FILTER TABS + SEARCH ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1">
          {['All', 'T-Shirt', 'Cap', 'Hoodie'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeFilter === filter 
                  ? 'bg-yellow-500 text-white' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {filter}
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

      {/* ─── TABLE ─── */}
      {filteredTags.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} className="text-gray-300" />}
          title="No tags found"
          description="Try adjusting your search or generate a new tag."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">NFC Link</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Color</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Size</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Sku</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Batch No</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Campaign</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Camp. ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Product ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Scans</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Tag ID</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTags.map((tag) => {
                  const tagId = tag._id || tag.id
                  return (
                    <tr key={tagId} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4">
                        <a 
                          href={getNfcLink(tag)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700 font-mono text-xs flex items-center gap-1 hover:underline"
                        >
                          {getNfcLink(tag).slice(0, 30)}...
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{getType(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getColor(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getSize(tag)}</td>
                      <td className="py-4 px-4 text-gray-600 font-mono text-xs">{getSku(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getBatchNo(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getCampaign(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getCampaignId(tag)}</td>
                      <td className="py-4 px-4 text-gray-600">{getProductId(tag)}</td>
                      <td className="py-4 px-4 text-gray-700 font-medium">{getScans(tag).toLocaleString()}</td>
                      <td className="py-4 px-4 text-gray-600 font-mono text-xs">{getTagId(tag)}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === tagId ? null : tagId)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenu === tagId && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px] py-1">
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Eye size={14} /> View
                              </button>
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit2 size={14} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(tagId)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GENERATE TAG FULL PAGE ───
function GenerateTagPage({ onBack, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    productType: 'T-Shirt',
    color: '',
    size: '',
    sku: '',
    batchNumber: '',
    campaign: '',
    campaignId: '',
    productId: '',
    tagId: '',
  })

  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  // Load campaigns for the dropdown
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await campaignAPI.getAll()
        const list = Array.isArray(res.data) ? res.data : (res.data?.campaigns || [])
        setCampaigns(list)
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      } finally {
        setLoadingCampaigns(false)
      }
    }
    loadCampaigns()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const payload = {
        type: formData.productType,
        color: formData.color,
        size: formData.size,
        sku: formData.sku,
        batchNo: formData.batchNumber,
        campaignId: formData.campaignId || formData.campaign,
        productId: formData.productId,
        tagId: formData.tagId,
      }

      console.log('📤 Generating tag with payload:', payload)

      // Generate tag
      const response = await tagsAPI.create(payload)
      console.log('✅ Tag generated:', response)

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      console.error('❌ Error generating tag:', err)
      setError(err.message || 'Failed to generate tag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate NFC Tag Link</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and manage NFC smart tag links</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {success && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>Tag generated successfully! Redirecting...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Product Type</label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({...formData, productType: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option>T-Shirt</option>
              <option>Cap</option>
              <option>Hoodie</option>
              <option>Bag</option>
            </select>
          </div>

          {/* Color + Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Color</label>
              <input
                type="text"
                placeholder="Input color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Size</label>
              <input
                type="text"
                placeholder="Input size"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* SKU + Batch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">SKU</label>
              <input
                type="text"
                placeholder="SKU-00421"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Batch Number</label>
              <input
                type="text"
                placeholder="BATCH-2025-07"
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Campaign + Campaign ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Assign Campaign</label>
              <select
                value={formData.campaign}
                onChange={(e) => {
                  const selectedCamp = campaigns.find(c => (c._id || c.id) === e.target.value)
                  setFormData({
                    ...formData, 
                    campaign: e.target.value,
                    campaignId: selectedCamp?._id || e.target.value
                  })
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Select a campaign</option>
                {campaigns.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.campaignName || c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Campaign ID</label>
              <input
                type="text"
                placeholder="Input Campaign ID"
                value={formData.campaignId}
                onChange={(e) => setFormData({...formData, campaignId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Product ID + Tag ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Product ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="PROD-8841"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <button 
                  type="button"
                  className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Tag ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="NFC000128"
                  value={formData.tagId}
                  onChange={(e) => setFormData({...formData, tagId: e.target.value})}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <button 
                  type="button"
                  className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin inline mr-2" />
                  Generating...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} className="inline mr-2" />
                  Generated!
                </>
              ) : (
                <>
                  <Plus size={16} className="inline mr-2" />
                  Add Tag
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}