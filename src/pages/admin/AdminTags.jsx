// src/pages/admin/AdminTags.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Loader2, AlertCircle, MoreHorizontal, 
  Plus, ArrowLeft, ExternalLink, Tag, Trash2, Edit2, Eye,
  CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { tagsAPI, campaignAPI } from '../../services/apiClient'
import { useFormPersistence } from '../../hooks/useFormPersistence'
import ServerError from '../../components/ServerError'

const PAGE_SIZE = 20

export default function AdminTags() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [openMenu, setOpenMenu] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }) 
  const [viewMode, setViewMode] = useState(() => {
    const saved = sessionStorage.getItem('admin_tags_view_mode')
    return saved || 'list'
  })

  useEffect(() => {
    sessionStorage.setItem('admin_tags_view_mode', viewMode)
  }, [viewMode])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const loadTags = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      let res
      try {
        res = await tagsAPI.getAll(page, PAGE_SIZE)
      } catch (err) {
        console.log('Trying artist tags endpoint...')
        res = await tagsAPI.getArtistTags(page, PAGE_SIZE)
      }
      
      console.log('📊 Tags fetched:', res)
      
      let list = []
      if (Array.isArray(res.data)) list = res.data
      else if (res.data?.tags && Array.isArray(res.data.tags)) list = res.data.tags
      else if (Array.isArray(res)) list = res
      else if (res.tags && Array.isArray(res.tags)) list = res.tags
      else if (res.data?.data && Array.isArray(res.data.data)) list = res.data.data
      
      // Log each tag to see what data we have
      list.forEach((tag, index) => {
        console.log(`🏷️ Tag ${index + 1}:`, {
          id: tag._id || tag.id,
          type: tag.type || tag.productType || tag.category,
          nfcLink: tag.nfcLink || tag.nfcUrl || tag.link,
          fullObject: tag
        })
      })
      
      setTags(list)
      
      const pagination = res.pagination
      if (pagination && pagination.totalPages) {
        setCurrentPage(pagination.page || 1)
        setTotalPages(pagination.totalPages || 1)
        setTotalItems(pagination.total || list.length)
        setHasNextPage(pagination.hasNextPage || false)
        setHasPreviousPage(pagination.hasPreviousPage || false)
        setPageSize(pagination.limit || PAGE_SIZE)
      } else {
        const total = list.length
        const calculatedTotalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
        setCurrentPage(page)
        setTotalPages(calculatedTotalPages)
        setTotalItems(total)
        setHasNextPage(page < calculatedTotalPages)
        setHasPreviousPage(page > 1)
        setPageSize(PAGE_SIZE)
      }
    } catch (err) {
      console.error('Failed to load tags:', err)
      setError(err.message || 'Failed to load tags')
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags(1)
  }, [])

  useEffect(() => {
    loadTags(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    loadTags(newPage)
    setOpenMenu(null)
  }

  const getTagId = (tag) => {
    return tag.tagId || tag._id?.slice(-8) || tag.id || '—'
  }

  const getNfcLink = (tag) => {
    return tag.nfcLink || tag.nfcUrl || tag.link || `https://merch.link/tag-${getTagId(tag)}`
  }

  // ─── FIXED: Better type detection ───
  const getType = (tag) => {
    return tag.type || tag.productType || tag.category || tag.perkType || '—'
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

  // ─── FIXED: Improved filtering logic ───
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
      type.includes(q) ||
      getCampaign(tag).toLowerCase().includes(q)

    let matchesFilter = true
    if (activeFilter !== 'All') {
      // Normalize both for comparison
      const normalizedFilter = activeFilter.toLowerCase()
      const normalizedType = type
      matchesFilter = normalizedType === normalizedFilter || 
                      normalizedType.includes(normalizedFilter)
    }

    return matchesSearch && matchesFilter
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return
    try {
      await tagsAPI.remove(id)
      loadTags(currentPage)
    } catch (err) {
      alert(err.message || 'Failed to delete tag')
    }
  }

  const openDropdown = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dropdownWidth = 160
    const dropdownHeight = 120
    
    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

    if (left < 10) left = 10
    if (left + dropdownWidth > window.innerWidth - 10) left = window.innerWidth - dropdownWidth - 10
    if (top + dropdownHeight > window.innerHeight - 10) top = rect.top - dropdownHeight - 4
    if (top < 10) top = 10

    setMenuPosition({ top, left })
    setOpenMenu(openMenu === id ? null : id)
  }

  // ─── REMOVED: Generate tag page is no longer available ───
  // We're removing the generate view mode

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading tags...</p>
      </div>
    )
  }

  if (error && tags.length === 0) {
    return <ServerError onRetry={() => loadTags(currentPage)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage NFC smart tag links</p>
        </div>
        {/* ─── REMOVED: Generate New Tag button ─── */}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1">
          {['All', 'T-Shirt', 'Cap', 'Hoodie', 'Bag'].map(filter => (
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
            placeholder="Search tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (currentPage !== 1) loadTags(1)
            }}
            className="w-72 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>

      {filteredTags.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} className="text-gray-300" />}
          title="No tags found"
          description={search || activeFilter !== 'All' 
            ? "Try adjusting your search or filter criteria." 
            : "No NFC tags have been generated yet."}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
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
                  const type = getType(tag)
                  
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
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          type === 'T-Shirt' ? 'bg-blue-50 text-blue-700' :
                          type === 'Hoodie' ? 'bg-purple-50 text-purple-700' :
                          type === 'Cap' ? 'bg-green-50 text-green-700' :
                          type === 'Bag' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {type}
                        </span>
                      </td>
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
                        <button
                          onClick={(e) => openDropdown(tagId, e)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> tags
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {openMenu && (
        <>
          <div className="fixed inset-0 z-[997]" onClick={() => setOpenMenu(null)} />
          <div
            className="fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] py-1 min-w-[160px]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button 
              onClick={() => { setOpenMenu(null) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye size={14} /> View
            </button>
            <button 
              onClick={() => { setOpenMenu(null) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button 
              onClick={() => {
                handleDelete(openMenu)
                setOpenMenu(null)
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}