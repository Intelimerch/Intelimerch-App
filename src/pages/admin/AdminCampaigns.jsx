import { useState, useEffect } from 'react'
import { Search, BarChart2, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/apiClient'

const statusCls = { Active: 'badge-active', Paused: 'badge-paused', Draft: 'badge-draft' }

export default function AdminCampaigns() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [openMenu, setOpenMenu] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await adminAPI.getCampaigns()
        if (mounted) setCampaigns(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load campaigns')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filters = ['All', 'Active', 'Paused', 'Draft']
  const filtered = campaigns.filter(c =>
    (filter === 'All' || c.status === filter) &&
    ((c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.creator || '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Campaigns</h1>
        <p className="text-gray-500 text-sm">{campaigns.length} campaigns across all creators</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search campaigns or creators..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <div className="flex gap-1">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${filter === f ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => window.location.reload()} className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium">Retry</button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold">Creator</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Taps</th>
                  <th className="pb-3 font-semibold">Claims</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.id}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-medium text-gray-800">{c.creator || '—'}</div>
                      <div className="text-xs text-gray-400">{c.handle || ''}</div>
                    </td>
                    <td className="py-3.5"><span className={statusCls[c.status]}>{c.status}</span></td>
                    <td className="py-3.5 font-medium">{(c.taps || 0).toLocaleString()}</td>
                    <td className="py-3.5">{(c.claims || 0).toLocaleString()}</td>
                    <td className="py-3.5 relative">
                      <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </button>
                      {openMenu === c.id && (
                        <div className="absolute right-0 top-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 w-44">
                          <button onClick={() => navigate(`/dashboard/campaigns/${c.id}/analytics`)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                            <BarChart2 size={14} /> Analytics
                          </button>
                          <button onClick={() => navigate(`/dashboard?adminAs=${encodeURIComponent(c.handle || c.creator || '')}`)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                            View as Creator
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}
