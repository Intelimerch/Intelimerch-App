import { useState, useEffect } from 'react'
import { Bell, Settings, TrendingUp, Wifi, Tag, Users, Loader2, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { adminAPI } from '../../services/apiClient'

const emptyActivities = []

export default function AdminOverview() {
  const [period, setPeriod] = useState('12 months')
  const [stats, setStats] = useState({ totalCreators: 0, totalScans: 0, activeCampaigns: 0, taggedItems: 0 })
  const [scanData, setScanData] = useState([])
  const [campaignData, setCampaignData] = useState([])
  const [activities, setActivities] = useState(emptyActivities)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const periods = ['12 months', '3 months', '30 days', '7 days', '24 hours']

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await adminAPI.getOverview()
        if (!mounted) return
        const d = res.data || {}
        if (d.stats) setStats(d.stats)
        if (Array.isArray(d.scanData)) setScanData(d.scanData)
        if (Array.isArray(d.campaignData)) setCampaignData(d.campaignData)
        if (Array.isArray(d.activities)) setActivities(d.activities)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load overview')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm">System overview at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-xl"><Bell size={20} className="text-gray-600" /></button>
          <button className="p-2 hover:bg-gray-100 rounded-xl"><Settings size={20} className="text-gray-600" /></button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Creators" value={stats.totalCreators?.toLocaleString() || '0'} trend="Registered artists" icon={<Users size={18} className="text-violet-500" />} bg="bg-violet-50" />
        <StatCard label="Total Scans" value={stats.totalScans?.toLocaleString() || '0'} trend="All-time taps" icon={<Wifi size={18} className="text-teal-500" />} bg="bg-teal-50" />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns?.toLocaleString() || '0'} trend="Currently live" icon={<Tag size={18} className="text-orange-400" />} bg="bg-orange-50" />
        <StatCard label="Tagged Items" value={stats.taggedItems?.toLocaleString() || '0'} trend="NFC tags created" icon={<TrendingUp size={18} className="text-blue-400" />} bg="bg-blue-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Scan Activity</h3>
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
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="scans" stroke="#F5A623" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Scans By Campaign</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={campaignData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="scans" fill="#F5A623" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Activities</h3>
        <div className="space-y-0 divide-y divide-gray-50">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">No recent activity yet.</p>
          ) : activities.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <p className="text-sm text-gray-700">{a.msg}</p>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, trend, icon, bg }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-green-600 flex items-center gap-1"><TrendingUp size={11} />{trend}</p>
    </div>
  )
}
