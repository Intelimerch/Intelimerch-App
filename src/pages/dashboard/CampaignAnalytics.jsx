import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Wifi, UserPlus, MousePointerClick, BarChart2, Loader2, AlertCircle } from 'lucide-react'
import { campaignAPI } from '../../services/apiClient'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const LOCATION_COLORS = ['#16a34a', '#a78bfa', '#06b6d4', '#f59e0b']

export default function CampaignAnalytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('7 days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [charts, setCharts] = useState({ tapData: [], locationData: [], perkData: [] })
  const periods = ['24 hours', '7 days', '30 days', '3 months']

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [campRes, chartRes] = await Promise.all([
          campaignAPI.getById(id),
          campaignAPI.getAnalytics(id).catch(() => null),
        ])
        if (mounted) {
          setCampaign(campRes.data)
          if (chartRes?.data) {
            setCharts({
              tapData: chartRes.data.tapData || [],
              locationData: (chartRes.data.locationData || []).map((l, i) => ({
                ...l,
                color: LOCATION_COLORS[i % LOCATION_COLORS.length],
              })),
              perkData: chartRes.data.perkData || [],
            })
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load campaign')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const name = campaign?.campaignName || 'Campaign'
  const status = campaign?.status ? campaign.status[0].toUpperCase() + campaign.status.slice(1) : 'Active'
  const products = campaign?.products ?? 0
  const taps = campaign?.taps ?? 0
  const claims = campaign?.claims ?? 0
  const perks = campaign?.perks ?? 0
  const conversion = taps ? Math.round((claims / taps) * 100) : 0
  const created = campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '—'
  const hasTapData = charts.tapData.some(d => d.taps > 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/campaigns')} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 text-sm">Campaign Analytics · {products} linked · Created {created}</p>
          </div>
          <StatusBadge status={status} />
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Taps" value={loading ? '—' : taps.toLocaleString()} trend="All time" up icon={<Wifi size={18} className="text-teal-500" />} bg="bg-teal-50" />
        <StatCard label="Unique Activations" value={loading ? '—' : claims.toLocaleString()} trend="Tagged claims" up icon={<UserPlus size={18} className="text-violet-500" />} bg="bg-violet-50" />
        <StatCard label="Linked Perks" value={loading ? '—' : perks.toLocaleString()} trend="Perks on this campaign" up icon={<MousePointerClick size={18} className="text-orange-400" />} bg="bg-orange-50" />
        <StatCard label="Conversion Rate" value={loading ? '—' : `${conversion}%`} trend="Claims / taps" up icon={<BarChart2 size={18} className="text-blue-400" />} bg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="col-span-1 lg:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Tap Activity</h3>
            <div className="flex gap-1">
              {periods.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${period === p ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[180px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : !hasTapData ? (
            <p className="text-sm text-gray-400 py-10 text-center">No tap activity yet. Taps appear here once fans scan this campaign's tags.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={charts.tapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="taps" stroke="#F5A623" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#F5A623' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Locations</h3>
          {loading ? (
            <div className="flex items-center justify-center h-[140px]">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : charts.locationData.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No location data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={charts.locationData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {charts.locationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-3">
                {charts.locationData.map(l => (
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

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Perk Claims by Type</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[160px]">
            <Loader2 size={24} className="text-primary animate-spin" />
          </div>
        ) : charts.perkData.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">Link perks to this campaign to see the breakdown.</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={charts.perkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="claims" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{trend}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Active' ? 'badge-active' : status === 'Paused' ? 'badge-paused' : 'badge-draft'
  return <span className={cls}>{status}</span>
}
