import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2, TrendingUp, Wifi, BarChart2, TrendingDown, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { tagsAPI, campaignAPI } from '../../services/apiClient'

const periods = ['12 months', '3 months', '30 days', '7 days', '24 hours']

export default function TagGroups() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('All')
  const [scanData, setScanData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')
  const [activeTab, setActiveTab] = useState('All Tags (0)')
  const [period, setPeriod] = useState('12 months')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [tagRes, campaignRes, analyticsRes] = await Promise.all([
          tagsAPI.getArtistTags(),
          campaignAPI.getAll(),
          campaignAPI.getAnalyticsOverview().catch(() => null),
        ])
        if (active) {
          setTags(tagRes?.data || [])
          setCampaigns(Array.isArray(campaignRes.data) ? campaignRes.data : [])
          if (analyticsRes?.data?.scanData) setScanData(analyticsRes.data.scanData)
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load tags')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const filteredTags = selectedCampaign === 'All'
    ? tags
    : tags.filter(t => String(t.campaignId) === selectedCampaign)

  const totalScans = filteredTags.reduce((s, t) => s + (t.taps || 0), 0)
  const avgScans = filteredTags.length ? Math.round(totalScans / filteredTags.length) : 0
  const topTag = filteredTags.length ? Math.max(...filteredTags.map(t => t.taps || 0)) : 0
  const rankMax = topTag || 1
  const barData = filteredTags.map(t => ({ name: t.tagId, scans: t.taps || 0 }))
  const hasScanData = scanData.some(d => d.scans > 0)

  const handleDelete = async (tag) => {
    if (!window.confirm(`Delete tag ${tag.tagId}? This cannot be undone.`)) return
    setDeleting(tag._id)
    try {
      await tagsAPI.deleteTag(tag._id)
      setTags(prev => prev.filter(t => t._id !== tag._id))
    } catch (err) {
      setError(err.message || 'Failed to delete tag')
    } finally {
      setDeleting('')
    }
  }

  const countLabel = filteredTags.length === 1 ? '1 Tag' : `${filteredTags.length} Tags`

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center">
            <span className="text-primary text-2xl">🏷</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Tag Groups</h1>
              <span className="badge-active">Active</span>
            </div>
            <p className="text-sm text-gray-500">All NFC tags across your campaigns</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard/campaigns')} className="btn-outline w-auto px-4 text-sm"><Pencil size={14} /> Edit Group</button>
          <button onClick={() => navigate('/dashboard/products/add')} className="btn-primary w-auto px-4 text-sm"><Plus size={14} /> Add Tag</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium">Retry</button>
          </div>
        </div>
      )}

      {/* Campaign filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-gray-100">
        <span className="text-sm text-gray-500">Filter by campaign:</span>
        <div className="relative">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 pr-8 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
          >
            <option value="All">All Campaigns</option>
            {campaigns.map(c => (
              <option key={String(c._id)} value={String(c._id)}>{c.campaignName}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-2">Total Tags</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : filteredTags.length}</p>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <span className="text-purple-500 text-sm">🏷</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-2">Total Scans</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{loading ? '—' : totalScans.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><TrendingUp size={11} />All-time tag taps</p>
            </div>
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <Wifi size={16} className="text-teal-500" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-2">Avg Scans / Tag</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : avgScans}</p>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-orange-400" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500 mb-2">Top Tag Scans</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : topTag.toLocaleString()}</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingDown size={16} className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[`All Tags (${filteredTags.length})`, 'Scan Activity'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={activeTab === t ? 'filter-btn-active' : 'filter-btn'}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === `All Tags (${filteredTags.length})` ? (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        ) : filteredTags.length === 0 ? (
          <EmptyState icon="📡" title="No tags in this group" description="Create a product to auto-generate NFC tags, or pick a campaign to filter the tags you already have." actionLabel="Add Product" action={() => navigate('/dashboard/products/add')} />
        ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr className="text-gray-400 text-xs font-medium">
                {['Tag ID', 'Product', 'Campaign', 'Scans', 'Last Scan', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTags.map((tag) => (
                <tr key={tag._id} className="hover:bg-gray-50/40">
                  <td className="px-5 py-4 font-medium text-gray-800">{tag.tagId}</td>
                  <td className="px-5 py-4 text-gray-600">{tag.product || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{tag.campaign || '—'}</td>
                  <td className="px-5 py-4 text-gray-700">{tag.taps || 0}</td>
                  <td className="px-5 py-4 text-gray-500">{tag.lastTap || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tag.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {tag.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(tag)}
                        disabled={deleting === tag._id || tag.taps > 0}
                        title={tag.taps > 0 ? 'Scanned tags cannot be deleted' : 'Delete tag'}
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        {deleting === tag._id ? <Loader2 size={13} className="text-red-400 animate-spin" /> : <Trash2 size={13} className="text-red-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Scan Activity Over Time</h3>
              <button className="text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-lg">View report</button>
            </div>
            <div className="flex gap-2 mb-4">
              {periods.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${period === p ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-[180px]">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : !hasScanData ? (
              <p className="text-sm text-gray-400 py-10 text-center">No scan activity yet. Taps appear here once fans scan your NFC tags.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={scanData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="scans" stroke="#F5A623" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Scans Per Tag</h3>
            {loading ? (
              <div className="flex items-center justify-center h-[180px]">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : barData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No tags yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="scans" fill="#F5A623" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tag Performance Ranking */}
          <div className="col-span-1 lg:col-span-3 card">
            <h3 className="font-semibold text-gray-800 mb-4">Tag Performance Ranking</h3>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : filteredTags.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No tags to rank yet.</p>
            ) : (
              <div className="space-y-3">
                {[...filteredTags].sort((a, b) => (b.taps || 0) - (a.taps || 0)).map(tag => (
                  <div key={tag._id} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-16 shrink-0">{tag.tagId}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${((tag.taps || 0) / rankMax) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-primary w-8 text-right">{tag.taps || 0}</span>
                    <span className="text-sm text-gray-500 w-40 truncate">{tag.product || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
