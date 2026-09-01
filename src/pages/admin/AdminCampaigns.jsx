// src/pages/admin/AdminCampaigns.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Search, Loader2, AlertCircle, MoreHorizontal, 
  Plus, Megaphone, Eye, Edit2, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { campaignAPI } from '../../services/apiClient'

const PAGE_SIZE = 20

export default function AdminCampaigns() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [openMenu, setOpenMenu] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }) // ✅ Add menu position

  // ─── Pagination State ───
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  // Get user's name for the header
  const adminName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.name || 'Admin'

  // ─── Load Campaigns from API with Pagination ───
  const loadCampaigns = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const res = await campaignAPI.getAll(page, PAGE_SIZE)
      console.log('📊 Campaigns fetched:', res)
      
      // Parse the response (handles multiple shapes)
      let list = []
      if (Array.isArray(res.data)) list = res.data
      else if (res.data?.campaigns && Array.isArray(res.data.campaigns)) list = res.data.campaigns
      else if (Array.isArray(res)) list = res
      else if (res.campaigns && Array.isArray(res.campaigns)) list = res.campaigns
      
      setCampaigns(list)
      
      // ─── Handle Pagination ───
      const pagination = res.pagination
      if (pagination && pagination.totalPages) {
        setCurrentPage(pagination.page || 1)
        setTotalPages(pagination.totalPages || 1)
        setTotalItems(pagination.total || list.length)
        setHasNextPage(pagination.hasNextPage || false)
        setHasPreviousPage(pagination.hasPreviousPage || false)
        setPageSize(pagination.limit || PAGE_SIZE)
      } else {
        // Backend doesn't support pagination - calculate from data
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
      console.error('Failed to load campaigns:', err)
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns(1)
  }, [])

  // ─── Reset to Page 1 on Filter Change ───
  useEffect(() => {
    loadCampaigns(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ─── Handle Page Change ───
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    loadCampaigns(newPage)
    setOpenMenu(null)
  }

  // ─── HELPER: Check if campaign is active ───
  const isCampaignActive = (campaign) => {
    return campaign.status === 'Active' || 
           campaign.status === 'active' || 
           campaign.status === 'ACTIVE'
  }

  // ─── HELPER: Check if campaign is paused ───
  const isCampaignPaused = (campaign) => {
    return campaign.status === 'Paused' || 
           campaign.status === 'paused' || 
           campaign.status === 'PAUSED'
  }

  // ─── HELPER: Check if campaign is draft ───
  const isCampaignDraft = (campaign) => {
    return campaign.status === 'Draft' || 
           campaign.status === 'draft' || 
           campaign.status === 'DRAFT'
  }

  // ─── Get campaign status label ───
  const getStatusLabel = (campaign) => {
    if (isCampaignActive(campaign)) return 'Active'
    if (isCampaignPaused(campaign)) return 'Paused'
    if (isCampaignDraft(campaign)) return 'Draft'
    return campaign.status || 'Unknown'
  }

  // ─── Get campaign status color ───
  const getStatusColor = (campaign) => {
    if (isCampaignActive(campaign)) return 'bg-green-50 text-green-600'
    if (isCampaignPaused(campaign)) return 'bg-red-50 text-red-500'
    if (isCampaignDraft(campaign)) return 'bg-yellow-50 text-yellow-600'
    return 'bg-gray-100 text-gray-600'
  }

  // ─── Filter campaigns based on tab and search (current page only) ───
  const filteredCampaigns = campaigns.filter(campaign => {
    const q = search.toLowerCase()
    const campaignName = campaign.campaignName || campaign.name || ''
    const matchesSearch = campaignName.toLowerCase().includes(q)

    let matchesTab = true
    if (activeTab === 'Active') matchesTab = isCampaignActive(campaign)
    if (activeTab === 'Paused') matchesTab = isCampaignPaused(campaign)
    if (activeTab === 'Draft') matchesTab = isCampaignDraft(campaign)

    return matchesSearch && matchesTab
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return
    try {
      await campaignAPI.delete(id)
      // Refresh current page after delete
      loadCampaigns(currentPage)
    } catch (err) {
      alert(err.message || 'Failed to delete campaign')
    }
  }

  // ─── Open Menu with Position (FIXED) ───
  const openDropdown = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dropdownWidth = 160
    const dropdownHeight = 120
    
    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

    // Keep within viewport
    if (left < 10) left = 10
    if (left + dropdownWidth > window.innerWidth - 10) left = window.innerWidth - dropdownWidth - 10
    if (top + dropdownHeight > window.innerHeight - 10) top = rect.top - dropdownHeight - 4
    if (top < 10) top = 10

    setMenuPosition({ top, left })
    setOpenMenu(openMenu === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading campaigns...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">{adminName} Campaigns</h1>
        </div>
        <button 
          onClick={() => navigate('/admin/campaigns/create')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Create Campaign
        </button>
      </div>

      {/* ─── FILTER TABS + SEARCH ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1">
          {['All', 'Active', 'Paused', 'Draft'].map(tab => (
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
            onChange={(e) => {
              setSearch(e.target.value)
              if (currentPage !== 1) loadCampaigns(1)
            }}
            className="w-72 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* ─── TABLE ─── */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={40} className="text-gray-300" />}
          title="No campaigns found"
          description="Try adjusting your search or create a new campaign."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative"> {/* ✅ Added relative */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Campaign Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Camp. ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Date Created</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Scans</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Conv.</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCampaigns.map((campaign) => {
                  const campaignId = campaign._id || campaign.id
                  return (
                    <tr key={campaignId} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 font-medium text-gray-800">{campaign.campaignName || campaign.name || '—'}</td>
                      <td className="py-4 px-4 text-gray-600 font-mono text-xs">{campaign.campaignId || campaign.campId || campaign._id?.slice(-6) || '—'}</td>
                      <td className="py-4 px-4 text-gray-600">{campaign.productsCount ? `${campaign.productsCount} linked` : campaign.product || '—'}</td>
                      <td className="py-4 px-4 text-gray-600">{campaign.dateCreated || campaign.createdAt?.split('T')[0] || '—'}</td>
                      <td className="py-4 px-4 text-gray-800 font-medium">{campaign.scans ? campaign.scans.toLocaleString() : (campaign.tapCount || 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-gray-600">{campaign.conv || campaign.conversionRate || '—'}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(campaign)}`}>
                          {getStatusLabel(campaign)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => openDropdown(campaignId, e)}
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

          {/* ─── PAGINATION CONTROLS ─── */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> campaigns
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

      {/* ─── DROPDOWN MENU (Fixed - Outside Table, Uses Fixed Position) ─── */}
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
              onClick={() => {
                navigate(`/admin/campaigns/${openMenu}`)
                setOpenMenu(null)
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye size={14} /> View
            </button>
            <button 
              onClick={() => {
                navigate(`/admin/campaigns/${openMenu}/edit`)
                setOpenMenu(null)
              }}
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