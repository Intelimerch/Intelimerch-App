import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MoreHorizontal, BarChart2, Pencil, Trash2, Link,
  X, Copy, Check, Loader2, Target, AlertCircle
} from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { campaignAPI } from '../../services/apiClient'

// ─── Professional Error Parser ──────────────────────────
function parseErrorMessage(error) {
  const message = error?.message || '';
  
  if (message.includes('<!DOCTYPE') || message.includes('HTML')) {
    return 'Server error. Please check your connection and try again.';
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The campaign you\'re trying to delete no longer exists.';
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    return 'Cannot connect to the server. Please check your internet connection.';
  }
  return message || 'An unexpected error occurred. Please try again.';
}

export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [filter, setFilter] = useState('All')
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [genLink, setGenLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef({})

  // ─── UI Error State ───
  const [uiError, setUiError] = useState(null)

  // ─── Delete Modal State ───
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, campaignId: null, campaignName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  const filters = ['All', 'Active', 'Paused', 'Draft']

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      setUiError(null)
      const response = await campaignAPI.getAll()
      const list = Array.isArray(response.data) ? response.data : (response.data?.campaigns || [])
      setCampaigns(list)
    } catch (err) {
      console.error('❌ Error fetching campaigns:', err)
      const friendlyMessage = parseErrorMessage(err)
      setError(friendlyMessage)
      setUiError(friendlyMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // ─── Close dropdown when clicking outside ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && !e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-trigger')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenu])

  const filtered = campaigns.filter(c => {
    const matchesFilter = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase()
    const matchesSearch = (c.campaignName || c.name || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // ─── Open dropdown with position calculation ───
  const openDropdown = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dropdownWidth = 160
    const dropdownHeight = 180
    
    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

    if (left < 10) {
      left = 10
    }
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10
    }
    if (top + dropdownHeight > window.innerHeight - 10) {
      top = rect.top - dropdownHeight - 4
    }
    if (top < 10) {
      top = 10
    }

    setMenuPosition({ top, left })
    setOpenMenu(openMenu === id ? null : id)
  }

  // ─── Delete Campaign ───
  const confirmDelete = (id, name) => {
    setUiError(null)
    setDeleteModal({ isOpen: true, campaignId: id, campaignName: name || 'this campaign' })
    setOpenMenu(null)
  }

  const handleDelete = async () => {
    const { campaignId } = deleteModal
    if (!campaignId) return
    
    setIsDeleting(true)
    setUiError(null)
    try {
      await campaignAPI.delete(campaignId)
      await fetchCampaigns()
      setDeleteModal({ isOpen: false, campaignId: null, campaignName: '' })
    } catch (err) {
      console.error('Error deleting campaign:', err)
      const friendlyMessage = parseErrorMessage(err)
      setUiError(friendlyMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, campaignId: null, campaignName: '' })
  }

  // ─── Edit Campaign ───
  const normalizeStatus = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Draft'

  const openEdit = (c) => {
    setUiError(null)
    setEditForm({
      name: c.campaignName || c.name,
      status: normalizeStatus(c.status),
      startDate: c.startDate?.split('T')[0] || '',
      endDate: c.endDate?.split('T')[0] || '',
    })
    setEditingCampaign(c.id || c.campaignId || c._id)
    setOpenMenu(null)
  }

  const saveEdit = async () => {
    setUiError(null)
    try {
      const updated = await campaignAPI.update(editingCampaign, {
        campaignName: editForm.name,
        status: editForm.status.toLowerCase(),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      })
      const updatedData = updated?.data || updated
      setCampaigns(prev => prev.map(c =>
        (c.id === editingCampaign || c.campaignId === editingCampaign || c._id === editingCampaign)
          ? { ...c, ...updatedData }
          : c
      ))
      setEditingCampaign(null)
    } catch (err) {
      console.error('❌ Error updating campaign:', err)
      const friendlyMessage = parseErrorMessage(err)
      setUiError(friendlyMessage)
    }
  }

  // ─── Generate Link ───
  const handleGenLink = async (c) => {
    setUiError(null)
    setGenLoading(true)
    try {
      const id = c.id || c.campaignId || c._id
      const res = await campaignAPI.createTag(id)
      const { tag, tagLink } = res.data || {}
      const url = tagLink && tagLink.startsWith('http')
        ? tagLink
        : `${window.location.origin}/nfc/io/${tag?._id || ''}`
      setGenLink({
        campaign: c.campaignName || c.name,
        url,
        id: tag?.tagId || '',
      })
    } catch (err) {
      console.error('❌ Error generating tag link:', err)
      const friendlyMessage = parseErrorMessage(err)
      setUiError(friendlyMessage)
    } finally {
      setOpenMenu(null)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(genLink.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading campaigns...</p>
      </div>
    )
  }

  if (error && !uiError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center max-w-md">{error}</p>
        <button onClick={fetchCampaigns} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm">Manage and track your NFC campaigns</p>
        </div>
        <button onClick={() => navigate('/dashboard/campaigns/create')} className="btn-primary w-auto gap-2">
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {/* ─── Professional UI Error Display ─── */}
      {uiError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{uiError}</p>
            <button 
              onClick={() => setUiError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card mb-4 overflow-visible">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${filter === f ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Target size={40} className="text-gray-300" />}
            title={search || filter !== 'All' ? 'No campaigns found' : 'No campaigns yet'}
            description={search || filter !== 'All' ? 'Try adjusting your filters or search term.' : 'Create your first campaign to link NFC tags to exclusive fan experiences.'}
            action={() => navigate('/dashboard/campaigns/create')}
            actionLabel="Create Campaign"
          />
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Taps</th>
                  <th className="pb-3 font-semibold">Claims</th>
                  <th className="pb-3 font-semibold">Products</th>
                  <th className="pb-3 font-semibold">Start / End</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, index) => {
                  const id = c.id || c.campaignId || c._id || index
                  return (
                    <tr key={id} className="hover:bg-gray-50/50">
                      <td className="py-3.5">
                        <div className="font-medium text-gray-900">{c.campaignName || c.name}</div>
                        <div className="text-xs text-gray-400">{id}</div>
                      </td>
                      <td className="py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="py-3.5 font-medium">{c.taps?.toLocaleString() || '0'}</td>
                      <td className="py-3.5">{c.claims?.toLocaleString() || '0'}</td>
                      <td className="py-3.5">{c.products || '0'} linked</td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}
                        <br />
                        <span className="text-gray-400">→ {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</span>
                      </td>
                      <td className="py-3.5 text-right relative">
                        <button
                          ref={(el) => { buttonRefs.current[id] = el }}
                          onClick={(e) => openDropdown(e, id)}
                          className="dropdown-trigger p-1.5 hover:bg-gray-100 rounded-lg inline-flex items-center justify-center"
                        >
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── FIXED POSITION DROPDOWN MENU ─── */}
      {openMenu !== null && (
        <>
          <div className="fixed inset-0 z-[997]" onClick={() => setOpenMenu(null)} />
          <div
            className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] py-1 w-48 min-w-[160px]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <MenuBtn
              icon={<BarChart2 size={14} />}
              label="Analytics"
              onClick={() => {
                setOpenMenu(null)
                navigate(`/dashboard/campaigns/${openMenu}/analytics`)
              }}
            />
            <MenuBtn
              icon={<Link size={14} />}
              label="Generate Link"
              onClick={() => {
                const campaign = campaigns.find(c => (c.id || c.campaignId || c._id) === openMenu)
                setOpenMenu(null)
                if (campaign) handleGenLink(campaign)
              }}
            />
            <MenuBtn
              icon={<Pencil size={14} />}
              label="Edit Details"
              onClick={() => {
                const campaign = campaigns.find(c => (c.id || c.campaignId || c._id) === openMenu)
                setOpenMenu(null)
                if (campaign) openEdit(campaign)
              }}
            />
            <MenuBtn
              icon={<Trash2 size={14} />}
              label="Delete"
              danger
              onClick={() => {
                const campaign = campaigns.find(c => (c.id || c.campaignId || c._id) === openMenu)
                setOpenMenu(null)
                if (campaign) confirmDelete(openMenu, campaign.campaignName || campaign.name)
              }}
            />
          </div>
        </>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4" onClick={() => setEditingCampaign(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Campaign Details</h2>
              <button onClick={() => setEditingCampaign(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Campaign Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="input-field"
                >
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} className="btn-primary flex-1">Save Changes</button>
              <button onClick={() => setEditingCampaign(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Link Modal */}
      {genLink && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4" onClick={() => setGenLink(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Tag Link Generated</h2>
              <button onClick={() => setGenLink(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Unique NFC tag link for <span className="font-semibold text-gray-800">{genLink.campaign}</span></p>
            <div className="bg-gray-50 rounded-xl p-3 mb-2">
              <p className="text-xs text-gray-500 mb-1">Tag ID</p>
              <p className="text-sm font-mono font-bold text-primary">{genLink.id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
              <p className="text-xs text-gray-500 mb-1">NFC URL</p>
              <p className="text-sm font-mono text-gray-800 break-all">{genLink.url}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyLink} className="btn-primary flex-1 gap-2">
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Link</>}
              </button>
              <button onClick={() => { setGenLink(null); navigate('/dashboard/tag-groups') }} className="btn-outline flex-1">
                View Tag Manager →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete Campaign</h2>
              <button
                onClick={closeDeleteModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-500" />
              </div>
            </div>

            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.campaignName}"</span>? 
              This action cannot be undone and all associated data will be removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuBtn({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-all ${danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700'}`}
    >
      {icon}{label}
    </button>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Active' ? 'badge-active' : status === 'Paused' ? 'badge-paused' : 'badge-draft'
  return <span className={cls}>{status || 'Draft'}</span>
}