import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, UserPlus, MessageSquare, TrendingUp, TrendingDown, MoreHorizontal, Bell, Settings, Loader2, AlertCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { campaignAPI } from '../../services/apiClient'
import { useAuth } from '../../context/AuthContext'

const LOCATION_COLORS = ['#16a34a', '#dc2626', '#f59e0b', '#a78bfa', '#06b6d4']

export default function Overview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [period, setPeriod] = useState('12 months')
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState({ scanData: [], topLocations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const periods = ['12 months', '3 months', '30 days', '7 days', '24 hours']

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [campRes, analyticsRes] = await Promise.all([
          campaignAPI.getAll(),
          campaignAPI.getAnalyticsOverview().catch(() => null),
        ])
        if (mounted) {
          setCampaigns(Array.isArray(campRes.data) ? campRes.data : [])
          if (analyticsRes?.data) {
            const topLocations = (analyticsRes.data.topLocations || []).map((l, i) => ({
              name: l.name,
              value: l.value,
              color: LOCATION_COLORS[i % LOCATION_COLORS.length],
            }))
            setAnalytics({
              scanData: analyticsRes.data.scanData || [],
              topLocations,
            })
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load campaigns')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const totalScans = campaigns.reduce((s, c) => s + (c.taps || 0), 0)
  const totalActivations = campaigns.reduce((s, c) => s + (c.claims || 0), 0)
  const conversion = totalScans ? Math.round((totalActivations / totalScans) * 100) : 0
  const repeatScans = Math.max(totalScans - totalActivations, 0)
  const firstName = user?.firstName || 'there'
  const hasScanData = analytics.scanData.some(d => d.scans > 0)

  const rows = campaigns.map((c) => ({
    name: c.campaignName,
    tag: String(c._id).slice(-6).toUpperCase(),
    product: `${c.products ?? 0} linked`,
    date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
    scans: c.taps || 0,
    conv: c.taps ? `${Math.round(((c.claims || 0) / c.taps) * 100)}%` : '—',
    status: c.status ? c.status[0].toUpperCase() + c.status.slice(1) : 'Active',
  }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm">Good morning, {firstName} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/notifications')} className="relative p-2 hover:bg-gray-100 rounded-xl">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl"><Settings size={20} className="text-gray-600" /></button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-pink-400" />
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total NFC Scans" value={loading ? '—' : totalScans.toLocaleString()} trend="Across all campaigns" up icon={<Wifi size={18} className="text-teal-500" />} bg="bg-teal-50" />
        <StatCard label="Unique Activations" value={loading ? '—' : totalActivations.toLocaleString()} trend="Registered fans" up icon={<UserPlus size={18} className="text-violet-500" />} bg="bg-violet-50" />
        <StatCard label="Repeat Scans" value={loading ? '—' : repeatScans.toLocaleString()} trend="Re-taps" up icon={<MessageSquare size={18} className="text-orange-400" />} bg="bg-orange-50" />
        <StatCard label="Conversion Rate" value={loading ? '—' : `${conversion}%`} trend="Activations / scans" up icon={<TrendingUp size={18} className="text-blue-400" />} bg="bg-blue-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Scan Timeline</h3>
            <button className="text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">View report</button>
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
            <p className="text-sm text-gray-400 py-10 text-center">No scan data yet. Scans appear here once fans tap your NFC tags.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={analytics.scanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="scans" stroke="#F5A623" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#F5A623' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Locations</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : analytics.topLocations.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No location data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={analytics.topLocations} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {analytics.topLocations.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {analytics.topLocations.map(l => (
                  <div key={l.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                      <span className="text-gray-600">{l.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{l.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Campaign Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">Campaign Performance</h3>
          <button onClick={() => navigate('/dashboard/campaigns')} className="text-primary text-sm font-semibold hover:underline">View All</button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No campaigns yet. Create your first campaign to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs font-medium">
                <th className="text-left pb-3">Campaign Name</th>
                <th className="text-left pb-3">Tag Group</th>
                <th className="text-left pb-3">Product</th>
                <th className="text-left pb-3">Date Created</th>
                <th className="text-left pb-3">Scans</th>
                <th className="text-left pb-3">Conv.</th>
                <th className="text-left pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3.5 font-medium text-gray-800">{c.name}</td>
                  <td className="py-3.5 text-gray-500">{c.tag}</td>
                  <td className="py-3.5 text-gray-500">{c.product}</td>
                  <td className="py-3.5 text-gray-500">{c.date}</td>
                  <td className="py-3.5 text-gray-700">{c.scans.toLocaleString()}</td>
                  <td className="py-3.5 text-gray-700">{c.conv}</td>
                  <td className="py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, trend, up, icon, bg }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-xs font-medium flex items-center gap-1 ${up ? 'text-green-600' : 'text-red-500'}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Active' ? 'badge-active' : status === 'Paused' ? 'badge-paused' : 'badge-draft'
  return <span className={cls}>{status}</span>
}
