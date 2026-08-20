import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, Wifi, Gift, Loader2, AlertCircle } from 'lucide-react'
import { adminAPI } from '../../services/apiClient'

const periods = ['7 days', '30 days', '3 months', '12 months']

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('12 months')
  const [stats, setStats] = useState({ totalTaps: 0, totalFans: 0, tagsCount: 0 })
  const [tapData, setTapData] = useState([])
  const [creatorData, setCreatorData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await adminAPI.getAnalytics()
        if (!mounted) return
        const d = res.data || {}
        if (d.stats) setStats(d.stats)
        if (Array.isArray(d.tapData)) setTapData(d.tapData)
        if (Array.isArray(d.creatorData)) setCreatorData(d.creatorData)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const cards = [
    { label: 'Total Taps', value: (stats.totalTaps ?? 0).toLocaleString(), change: 'All time', icon: Wifi, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Fans', value: (stats.totalFans ?? 0).toLocaleString(), change: 'Registered fans', icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Tags', value: (stats.tagsCount ?? 0).toLocaleString(), change: 'NFC tags created', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Avg Taps / Tag', value: stats.tagsCount ? Math.round((stats.totalTaps || 0) / stats.tagsCount).toLocaleString() : '0', change: 'Per tag average', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500 text-sm">Overall performance across all creators and campaigns</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === p ? 'bg-primary text-white' : 'text-gray-500'}`}>
              {p}
            </button>
          ))}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(s => (
          <div key={s.label} className="card">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs font-medium text-green-600 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Total Taps Over Time</h3>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tapData}>
                <defs>
                  <linearGradient id="tapGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="taps" stroke="var(--color-primary)" strokeWidth={2} fill="url(#tapGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Taps by Creator</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={creatorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip />
              <Bar dataKey="taps" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
