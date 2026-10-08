// src/pages/dashboard/Campaigns.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, BarChart2, Pencil, Trash2, X, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import { campaignAPI } from '../../services/apiClient'
import ServerError from '../../components/ServerError'

const PAGE_SIZE = 20

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

  // ── Dropdown positioning (mirrors Products.jsx) ──
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef({})

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  // ── Delete confirmation state ──
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    campaignId: null,
    campaignName: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Toast state ──
  const [toast, setToast] = useState(null)

  const filters = ['All', 'Active', 'Paused', 'Draft']

  const fetchCampaigns = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await campaignAPI.getAll(page, PAGE_SIZE)
      const list = Array.isArray(response.data) ? response.data : (response.data?.campaigns || [])
      setCampaigns(list)
      const pagination = response.pagination || {}
      setCurrentPage(pagination.page || 1)
      setTotalPages(pagination.totalPages || 1)
      setTotalItems(pagination.total || list.length)
      setHasNextPage(pagination.hasNextPage || false)
      setHasPreviousPage(pagination.hasPreviousPage || false)
      setPageSize(pagination.limit || PAGE_SIZE)
    } catch (err) {
      console.error('❌ Error fetching campaigns:', err)
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns(1)
  }, [])

  const filtered = campaigns.filter(c => {
    const matchesFilter = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase()
    const matchesSearch = (c.campaignName || c.name || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    fetchCampaigns(newPage)
    setOpenMenu(null)
  }

  useEffect(() => {
    fetchCampaigns(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // ── Auto-dismiss toast ──
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // ── Close dropdown when clicking outside ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && !e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-trigger')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenu])

  // ── Delete flow ──
  const confirmDelete = (id, name) => {
    setDeleteModal({ isOpen: true, campaignId: id, campaignName: name })
    setOpenMenu(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return
    setDeleteModal({ isOpen: false, campaignId: null, campaignName: '' })
  }

  const handleDelete = async () => {
    const { campaignId, campaignName } = deleteModal
    if (!campaignId) return

    setIsDeleting(true)
    try {
      await campaignAPI.delete(campaignId)
      await fetchCampaigns(currentPage)
      setDeleteModal({ isOpen: false, campaignId: null, campaignName: '' })
      setToast({ type: 'success', message: `"${campaignName}" was deleted.` })
    } catch (err) {
      console.error('❌ Error deleting campaign:', err)
      setToast({ type: 'error', message: err.message || 'Failed to delete campaign' })
    } finally {
      setIsDeleting(false)
    }
  }

  const openEdit = (c) => {
    setEditForm({
      name: c.campaignName || c.name,
      status: c.status || 'Draft',
      startDate: c.startDate?.split('T')[0] || '',
      endDate: c.endDate?.split('T')[0] || '',
    })
    setEditingCampaign(c.id || c.campaignId || c._id)
    setOpenMenu(null)
  }

  const saveEdit = async () => {
    try {
      await campaignAPI.update(editingCampaign, {
        campaignName: editForm.name,
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      })
      fetchCampaigns(currentPage)
      setEditingCampaign(null)
      setToast({ type: 'success', message: 'Campaign updated.' })
    } catch (err) {
      console.error('❌ Error updating campaign:', err)
      setToast({ type: 'error', message: err.message || 'Failed to update campaign' })
    }
  }

  // ── Dropdown positioning ──
  const openDropdown = (id, e) => {
    e?.stopPropagation?.()
    const target = e?.currentTarget || buttonRefs.current[id]

    if (!target) {
      setMenuPosition({ top: window.innerHeight / 2 - 50, left: window.innerWidth / 2 - 100 })
      setOpenMenu(id)
      return
    }

    const rect = target.getBoundingClientRect()
    const dropdownWidth = 176  // w-44 = 11rem = 176px
    const dropdownHeight = 180 // 4 items × ~40px + padding

    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

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

  if (error && campaigns.length === 0) {
    return <ServerError onRetry={() => fetchCampaigns(currentPage)} />
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

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search campaigns..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                if (currentPage !== 1) fetchCampaigns(1)
              }}
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
            icon="🎯"
            title={search || filter !== 'All' ? 'No campaigns found' : 'No campaigns yet'}
            description={search || filter !== 'All' ? 'Try adjusting your filters or search term.' : 'Create your first campaign to link NFC tags to exclusive fan experiences.'}
            action={() => navigate('/dashboard/campaigns/create')}
            actionLabel="Create Campaign"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-semibold">Campaign</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Taps</th>
                    <th className="pb-3 font-semibold">Claims</th>
                    <th className="pb-3 font-semibold">Products</th>
                    <th className="pb-3 font-semibold">Start / End</th>
                    <th className="pb-3" />
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
                        <td className="py-3.5 text-right">
                          <button
                            ref={(el) => { buttonRefs.current[id] = el }}
                            onClick={(e) => openDropdown(id, e)}
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

            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
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
                <span className="text-sm font-medium text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingCampaign(null)}>
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

      {/* ── Delete confirmation modal ── */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Campaign"
        itemName={deleteModal.campaignName}
        confirmLabel="Delete"
        tone="danger"
        loading={isDeleting}
      />

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-xl shadow-lg flex items-start gap-2 max-w-sm
            ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* ── Floating dropdown menu (fixed positioning so it escapes the table) ── */}
      {openMenu !== null && (
        <>
          <div className="fixed inset-0 z-[997]" onClick={() => setOpenMenu(null)} />
          <div
            className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] py-1 w-44"
            style={{ top: menuPosition.top, left: menuPosition.left }}
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
              icon={<Tag size={14} />}
              label="View Tags"
              onClick={() => {
                setOpenMenu(null)
                navigate(`/dashboard/tag-groups?campaignId=${openMenu}`)
              }}
            />
            <MenuBtn
              icon={<Pencil size={14} />}
              label="Edit Details"
              onClick={() => {
                const campaign = campaigns.find(c => (c.id || c.campaignId || c._id) === openMenu)
                if (campaign) openEdit(campaign)
              }}
            />
            <MenuBtn
              icon={<Trash2 size={14} />}
              label="Delete"
              danger
              onClick={() => {
                const campaign = campaigns.find(c => (c.id || c.campaignId || c._id) === openMenu)
                if (campaign) confirmDelete(openMenu, campaign.campaignName || campaign.name)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuBtn({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${danger ? 'text-red-500' : 'text-gray-700'}`}
    >
      {icon}{label}
    </button>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Active' ? 'badge-active' : status === 'Paused' ? 'badge-paused' : 'badge-draft'
  return <span className={cls}>{status || 'Draft'}</span>
}