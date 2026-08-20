import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, LayoutDashboard, Loader2, AlertCircle } from 'lucide-react'
import { adminAPI } from '../../services/apiClient'

const avatarColors = [
  'from-orange-300 to-pink-400',
  'from-purple-300 to-indigo-400',
  'from-teal-300 to-blue-400',
  'from-pink-300 to-rose-400',
  'from-green-300 to-emerald-400',
  'from-yellow-300 to-amber-400',
]

export default function CreatorsManagement() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const filters = ['All', 'Active', 'Inactive']

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await adminAPI.getCreators()
        const list = Array.isArray(res.data) ? res.data : []
        setCreators(list.map((c, i) => ({
          ...c,
          color: avatarColors[i % avatarColors.length],
          initials: c.initials || ((c.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'),
        })))
      } catch (err) {
        setError(err.message || 'Failed to load creators')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filtered = creators.filter(c => {
    const matchFilter = filter === 'All' || c.status === filter
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const activeCount = creators.filter(c => c.status === 'Active').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creators Management</h1>
          <p className="text-gray-500 text-sm">{creators.length} creators · {activeCount} active</p>
        </div>
        <button className="btn-primary w-auto px-5"><Plus size={16} /> Add Creator</button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'filter-btn-active' : 'filter-btn'}>{f}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="input-field pl-9 w-64" />
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
        <div className="space-y-4">
          {filtered.map((creator, i) => (
            <div key={creator.id || i} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${creator.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {creator.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{creator.name}</p>
                    <p className="text-sm text-gray-500">{creator.handle || '—'}</p>
                  </div>
                </div>
                <span className={creator.status === 'Active' ? 'badge-active' : 'filter-btn text-gray-500'}>
                  {creator.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1" />}
                  {creator.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[['TAGS', creator.tags ?? 0], ['TOTAL SCANS', (creator.scans ?? 0).toLocaleString()], ['CAMPAIGN', creator.campaign ?? 0]].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-semibold tracking-wide mb-0.5">{label}</p>
                    <p className="text-lg font-bold text-gray-900">{val}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate(`/dashboard?adminAs=${encodeURIComponent(creator.handle || creator.name)}`)} className="btn-primary w-auto px-5 text-sm py-2 gap-2"><LayoutDashboard size={14} /> View Dashboard</button>
                <button className="border border-red-200 text-red-500 font-semibold px-5 py-2 rounded-xl hover:bg-red-50 text-sm flex items-center gap-2 transition-all">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
