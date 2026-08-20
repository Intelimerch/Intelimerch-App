import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wifi, UserPlus, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { campaignAPI } from '../../services/apiClient'
import { useAuth } from '../../context/AuthContext'

const LOCATION_COLORS = ['#16a34a', '#dc2626', '#f59e0b', '#a78bfa', '#06b6d4']
const DEVICE_COLORS = ['#16a34a', '#a78bfa', '#f59e0b']

export default function Analytics() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('12 months')
  const periods = ['12 months', '3 months', '30 days', '7 days', '24 hours']
  const [stats, setStats] = useState({ totalScans: 0, activations: 0, repeatScans: 0 })
  const [scanData, setScanData] = useState([])
  const [topLocations, setTopLocations] = useState([])
  const [deviceData, setDeviceData] = useState([])
  const [topCampaigns, setTopCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [analyticsRes, campRes] = await Promise.all([
          campaignAPI.getAnalyticsOverview(),
          campaignAPI.getAll(),
        ])
        if (active) {
          const d = analyticsRes.data
          setStats(d.stats)
          setScanData(d.scanData || [])
          setTopLocations((d.topLocations || []).map((l, i) => ({ ...l, color: LOCATION_COLORS[i % LOCATION_COLORS.length] })))
          const dev = (d.deviceData || []).map((x, i) => ({ ...x, color: DEVICE_COLORS[i % DEVICE_COLORS.length] }))
          setDeviceData(dev)
          const campaigns = Array.isArray(campRes.data) ? campRes.data : []
          setTopCampaigns([...campaigns].sort((a, b) => (b.taps || 0) - (a.taps || 0)).slice(0, 5).map(c => ({
            name: c.campaignName,
            scans: c.taps || 0,
          })))
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load analytics')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const conversion = stats.totalScans ? Math.round((stats.activations / stats.totalScans) * 100) : 0
  const firstName = user?.firstName || 'there'
  const campMax = Math.max(...topCampaigns.map(c => c.scans), 1)
  const hasScanData = scanData.some(d => d.scans > 0)
  const deviceTotal = deviceData.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm">Hey {firstName} 👋 Your overall performance across all campaigns</p>
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
        <StatCard label="Total NFC Scans" value={loading ? '—' : stats.totalScans.toLocaleString()} trend="Across all campaigns" up icon={<Wifi size={18} className="text-teal-500" />} bg="bg-teal-50" />
        <StatCard label="Unique Activations" value={loading ? '—' : stats.activations.toLocaleString()} trend="Registered fans" up icon={<UserPlus size={18} className="text-violet-500" />} bg="bg-violet-50" />
        <StatCard label="Repeat Scans" value={loading ? '—' : stats.repeatScans.toLocaleString()} trend="Re-taps" up icon={<MessageSquare size={18} className="text-orange-400" />} bg="bg-orange-50" />
        <StatCard label="Conversion Rate" value={loading ? '—' : `${conversion}%`} trend="Activations / scans" up={conversion >= 25} icon={<TrendingDown size={18} className="text-blue-400" />} bg="bg-blue-50" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="col-span-1 lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Scan Timeline</h3>
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
            <p className="text-sm text-gray-400 py-10 text-center">No scan data yet. Taps appear here once fans scan your NFC tags.</p>
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
          <h3 className="font-semibold text-gray-800 mb-4">Top Locations</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[160px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : topLocations.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No location data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={topLocations} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {topLocations.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {topLocations.map(l => (
                  <div key={l.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-gray-600">{l.name}</span>
                    </div>
                    <span className="font-medium">{l.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Device Breakdown</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[140px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : deviceData.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No device data yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {deviceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {deviceData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-600">{d.name}</span>
                    <span className="font-semibold text-gray-800">{deviceTotal ? Math.round((d.value / deviceTotal) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Campaigns</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[140px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : topCampaigns.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No campaigns yet.</p>
          ) : (
            <div className="space-y-3">
              {topCampaigns.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{c.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(c.scans / campMax) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-primary w-12 text-right">{c.scans.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{trend}
      </p>
    </div>
  )
}
