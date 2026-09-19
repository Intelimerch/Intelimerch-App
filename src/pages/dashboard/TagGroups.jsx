// src/pages/dashboard/TagGroups.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Loader2, AlertCircle, Tag as TagIcon,
  Search, MoreHorizontal, CheckCircle, Edit2, Trash2, Plus, ChevronDown, ArrowLeft, ExternalLink
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { tagsAPI, campaignAPI } from '../../services/apiClient'
import ServerError from '../../components/ServerError'

const statusLabel = {
  unassigned: 'Not Linked',
  assigned: 'Assigned',
  activated: 'Active',
  disabled: 'Disabled',
}
const statusColor = {
  unassigned: 'text-gray-400',
  assigned: 'text-blue-600',
  activated: 'text-green-600',
  disabled: 'text-red-500',
}
const statusBg = {
  unassigned: 'bg-gray-100',
  assigned: 'bg-blue-50',
  activated: 'bg-green-50',
  disabled: 'bg-red-50',
}

// ─── Product type filter options ───
const TYPE_FILTERS = ['All', 'T-Shirt', 'Cap', 'Hoodie', 'Bag']

export default function TagGroups() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const searchParams = new URLSearchParams(location.search)
  const campaignIdFromUrl = searchParams.get('campaignId')

  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignIdFromUrl || '')
  const [showCampDrop, setShowCampDrop] = useState(false)
  const [viewMode, setViewMode] = useState('all')

  const [tags, setTags] = useState([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [error, setError] = useState(null)

  // ─── Filters ───
  const [activeTypeFilter, setActiveTypeFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  
  const menuRef = useRef(null)
  const campRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null)
      if (campRef.current && !campRef.current.contains(e.target)) setShowCampDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Load Campaigns ───
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await campaignAPI.getAll()
        const list = Array.isArray(res.data) ? res.data : (res.data?.campaigns || [])
        setCampaigns(list)
        
        if (campaignIdFromUrl) {
          const campaignExists = list.some(c => (c._id || c.id) === campaignIdFromUrl)
          if (campaignExists) {
            setSelectedCampaignId(campaignIdFromUrl)
            setViewMode('campaign')
          }
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      } finally {
        setLoadingCampaigns(false)
      }
    }
    loadCampaigns()
  }, [campaignIdFromUrl])

  // ─── Load Tags ───
  useEffect(() => {
    if (!selectedCampaignId && viewMode === 'campaign') {
      setTags([])
      setError(null)
      return 
    }
    
    async function loadTags() {
      try {
        setLoadingTags(true)
        setError(null)
        
        let res
        if (viewMode === 'all') {
          res = await tagsAPI.getArtistTags()
        } else {
          res = await tagsAPI.getByCampaign(selectedCampaignId)
        }
        
        console.log('📦 Tags fetched:', res)
        
        let tagList = []
        if (res.data?.tags && Array.isArray(res.data.tags)) {
          tagList = res.data.tags
        } else if (Array.isArray(res.data)) {
          tagList = res.data
        } else if (Array.isArray(res)) {
          tagList = res
        } else {
          tagList = res || []
        }
        
        setTags(tagList)
      } catch (err) {
        console.error('Failed to load tags:', err)
        setError(err.message || 'Failed to load tags')
      } finally {
        setLoadingTags(false)
      }
    }
    loadTags()
  }, [selectedCampaignId, viewMode])

  const selectedCampaign = campaigns.find(c => (c._id || c.id) === selectedCampaignId)

  const goBack = () => {
    navigate('/dashboard/campaigns')
  }

  const handleViewAll = () => {
    setViewMode('all')
    setSelectedCampaignId('')
    setShowCampDrop(false)
  }

  const handleSelectCampaign = (id) => {
    setSelectedCampaignId(id)
    setViewMode('campaign')
    setShowCampDrop(false)
  }

  // ─── Get display value with fallback ───
  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    return value
  }

  // ─── Extract unique types from tags for filter count ───
  const getTypeCount = (type) => {
    if (type === 'All') return tags.length
    return tags.filter(t => (t.type || t.productType) === type).length
  }

  // ─── Filtered tags ───
  const filtered = tags.filter(tag => {
    const tagType = tag.type || tag.productType || ''
    const matchType = activeTypeFilter === 'All' || tagType === activeTypeFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (tag.tagId || tag._id || '').toLowerCase().includes(q) ||
      (tag.nfcLink || '').toLowerCase().includes(q) ||
      (tag.campaign || tag.campaignName || '').toLowerCase().includes(q) ||
      (tag.sku || '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  if (error) {
    return <ServerError onRetry={() => loadTags()} />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-transparent text-gray-500 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-0.5">
              {viewMode === 'all' ? 'Tag Management' : selectedCampaign?.campaignName || 'Tags'}
            </h1>
            <p className="text-sm text-gray-500 m-0">
              {viewMode === 'all' 
                ? 'All NFC tags across your campaigns' 
                : selectedCampaign 
                  ? `Managing tags for "${selectedCampaign.campaignName}"` 
                  : 'Select a campaign to view its NFC tags'}
            </p>
          </div>
        </div>

        <div className="relative" ref={campRef}>
          <button
            type="button"
            onClick={() => setShowCampDrop(o => !o)}
            disabled={loadingCampaigns}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer min-w-[200px] justify-between hover:bg-gray-50 transition-all"
          >
            <span className={`text-sm ${viewMode === 'campaign' ? 'text-gray-800' : 'text-gray-400'}`}>
              {loadingCampaigns
                ? 'Loading…'
                : viewMode === 'all'
                  ? 'All Campaigns'
                  : selectedCampaign?.campaignName || selectedCampaign?.name || 'Select campaign'}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showCampDrop && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto py-1">
              <button
                onClick={handleViewAll}
                className={`block w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${viewMode === 'all' ? 'bg-gray-100 text-primary font-semibold' : 'text-gray-800'}`}
              >
                All Campaigns
              </button>
              {campaigns.length === 0 ? (
                <p className="px-4 py-2.5 text-sm text-gray-400">No campaigns found</p>
              ) : campaigns.map(c => {
                const id = c._id || c.id
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectCampaign(id)}
                    className={`block w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${selectedCampaignId === id ? 'bg-gray-100 text-primary font-semibold' : 'text-gray-800'}`}
                  >
                    {c.campaignName || c.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Campaign Info Bar ─── */}
      {viewMode === 'campaign' && selectedCampaign && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-sm font-semibold text-gray-800">{selectedCampaign.campaignName}</span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className={`w-2 h-2 rounded-full ${selectedCampaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
            {selectedCampaign.status || 'Active'}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
            <TagIcon size={14} /> {tags.length} tag{tags.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ─── FILTER UI ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ─── Product Type Filters ─── */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => {
            const count = getTypeCount(f)
            return (
              <button
                key={f}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                  activeTypeFilter === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTypeFilter(f)}
              >
                {f}
                {f !== 'All' && count > 0 && (
                  <span className={`ml-1.5 text-xs ${activeTypeFilter === f ? 'text-white/70' : 'text-gray-400'}`}>
                    ({count})
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ─── Search ─── */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg min-w-[220px]">
          <Search size={14} className="text-gray-400" />
          <input
            className="w-full border-none outline-none text-sm text-gray-800 bg-transparent"
            placeholder="Search tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      {loadingTags ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-gray-200">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-gray-400">Loading tags…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <EmptyState
            icon={<TagIcon size={40} className="text-gray-300" />}
            title={search || activeTypeFilter !== 'All' ? 'No tags found' : 'No tags yet'}
            description={search || activeTypeFilter !== 'All' 
              ? 'Try adjusting your filter or search term.' 
              : viewMode === 'all' 
                ? 'Tags will appear here once you assign products to campaigns.'
                : 'This campaign doesn\'t have any tags yet.'}
            action={viewMode === 'campaign' ? handleViewAll : undefined}
            actionLabel={viewMode === 'campaign' ? 'View All Campaigns' : undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" ref={menuRef}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">Tag ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[200px]">NFC Link</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">Scans</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tag, i) => {
                  const id = tag._id || tag.id || i
                  const tagId = tag.tagId || tag._id?.slice(-8) || `TAG-${i + 1}`
                  const nfcLink = tag.nfcLink || tag.nfcUrl || tag.link
                  const type = getDisplayValue(tag.type || tag.productType)
                  const color = getDisplayValue(tag.color)
                  const size = getDisplayValue(tag.size)
                  const sku = getDisplayValue(tag.sku)
                  const campaignName = getDisplayValue(tag.campaign || tag.campaignName || selectedCampaign?.campaignName)
                  const scans = tag.scans || tag.tapCount || 0
                  const status = tag.status || 'unassigned'
                  
                  return (
                    <tr
                      key={id}
                      className={`hover:bg-green-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                        {tagId}
                      </td>
                      <td className="px-4 py-2.5 max-w-[200px]">
                        {nfcLink ? (
                          <a 
                            href={nfcLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-500 hover:text-blue-700 font-mono text-xs flex items-center gap-1 truncate hover:underline"
                          >
                            {nfcLink}
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{type}</td>
                      <td className="px-4 py-2.5 text-gray-600">{color}</td>
                      <td className="px-4 py-2.5 text-gray-600">{size}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{sku}</td>
                      <td className="px-4 py-2.5 text-gray-600">{campaignName}</td>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{scans.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor[status] || 'text-gray-500'} ${statusBg[status] || 'bg-gray-100'}`}>
                          {statusLabel[status] || 'Not Linked'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 relative w-10">
                        <button
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                          onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === id ? null : id) }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenu === id && (
                          <div className="absolute right-2 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[150px] overflow-hidden">
                            <div className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm border-b border-gray-100">
                              <CheckCircle size={13} className={statusColor[status] || 'text-gray-400'} />
                              <span className={`font-semibold ${statusColor[status] || 'text-gray-500'}`}>
                                {statusLabel[status] || 'Not Linked'}
                              </span>
                            </div>
                            <button disabled title="Not available yet — no update endpoint exists for tags" className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-gray-300 cursor-not-allowed">
                              <Edit2 size={13} /> Edit
                            </button>
                            <button disabled title="Not available yet — no delete endpoint exists for tags" className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-gray-300 cursor-not-allowed">
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
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