// src/pages/dashboard/Overview.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wifi, TrendingUp, Eye, MousePointerClick, Users,
  Calendar, ArrowRight, Loader2, AlertCircle, Activity, MoreHorizontal
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { analyticsAPI } from '../../services/apiClient'
import { useAuth } from '../../context/AuthContext'
import ServerError from '../../components/ServerError'

const PIE_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EF4444']

export default function Overview() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState('7 Days')

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        setError(null)
        const res = await analyticsAPI.getDashboardAnalytics()
        console.log('📊 Dashboard analytics:', res)
        const data = res?.analyticsData || res?.data || res || {}
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const totalScans = analytics?.totalNFCScans?.count ?? 0
  const uniqueActivations = analytics?.uniqueActivations?.count ?? 0
  const repeatScans = analytics?.repeatScans?.count ?? 0
  const conversionRate = analytics?.conversionRate?.count ?? 0

  const campaignPerformance = Array.isArray(analytics?.campaignPerformance)
    ? analytics.campaignPerformance
    : []

  const scanTimeline = analytics?.scanTimeline?.[0] || analytics?.scanTimeline || {}
  const timelineData = scanTimeline[timeRange.replace(' ', '')] || []
  
  const chartData = timelineData.length > 0 ? timelineData : [
    { day: 'Mon', scans: 0 },
    { day: 'Tue', scans: 0 },
    { day: 'Wed', scans: 0 },
    { day: 'Thu', scans: 0 },
    { day: 'Fri', scans: 0 },
    { day: 'Sat', scans: 0 },
    { day: 'Sun', scans: 0 },
  ]

  const topLocations = Array.isArray(analytics?.topLocations) ? analytics.topLocations : []
  const totalLocationScans = topLocations.reduce((sum, l) => sum + (l.value || 0), 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return <ServerError onRetry={fetchAnalytics} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm">
            {user?.firstName ? `Good morning, ${user.firstName} 🎉` : 'Welcome back 🎉'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total NFC Scans"
          value={totalScans.toLocaleString()}
          percentage={analytics?.totalNFCScans?.percentage}
          icon={<Wifi size={18} className="text-teal-500" />}
          bg="bg-teal-50"
        />
        <StatCard
          label="Unique Activations"
          value={uniqueActivations.toLocaleString()}
          percentage={analytics?.uniqueActivations?.percentage}
          icon={<Users size={18} className="text-violet-500" />}
          bg="bg-violet-50"
        />
        <StatCard
          label="Repeat Scans"
          value={repeatScans.toLocaleString()}
          percentage={analytics?.repeatScans?.percentage}
          icon={<MousePointerClick size={18} className="text-orange-400" />}
          bg="bg-orange-50"
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          percentage={analytics?.conversionRate?.percentage}
          icon={<TrendingUp size={18} className="text-blue-400" />}
          bg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan Timeline */}
        <div className="card col-span-1 lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-800">Scan Timeline</h3>
            <div className="flex items-center gap-2">
              {['24 Hours', '7 Days', '30 Days'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    timeRange === range ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {timelineData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400">
              <Activity size={28} className="mb-2 text-gray-300" />
              <p className="text-sm">No scan data yet for this range</p>
              <p className="text-xs text-gray-300 mt-1">Once you start tapping, your data will appear here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value || 0} scans`, 'Scans']}
                />
                <Line type="monotone" dataKey="scans" stroke="#F97316" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Locations */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Locations</h3>

          {topLocations.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <Activity size={28} className="mb-2 text-gray-300" />
              <p className="text-sm text-center">No location data available yet</p>
              <p className="text-xs text-gray-300 mt-1">Location data appears after taps</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topLocations} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                      {topLocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${(value || 0).toLocaleString()} scans`, 'Scans']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-900">{(totalLocationScans / 1000).toFixed(1)}k</span>
                  <span className="text-xs text-gray-400">Total Scans</span>
                </div>
              </div>
              <div className="w-full space-y-2.5">
                {topLocations.slice(0, 5).map((loc, index) => (
                  <div key={loc.name || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{loc.name || 'Unknown'}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-800">{(loc.count || loc.value || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Campaign Performance</h3>
          <button onClick={() => navigate('/dashboard/campaigns')} className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        {campaignPerformance.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-gray-400">
            <Activity size={28} className="mb-2 text-gray-300" />
            <p className="text-sm">No campaigns yet</p>
            <p className="text-xs text-gray-300 mt-1">Create your first campaign to see performance data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Campaign Name</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Products</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Date Created</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Scans</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Conv.</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaignPerformance.slice(0, 5).map((camp, i) => (
                  <tr key={camp._id || i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-2 font-medium text-gray-800">{camp.campaignName || '—'}</td>
                    <td className="py-4 px-2 text-gray-600">{camp.productsLinked ?? '—'}</td>
                    <td className="py-4 px-2 text-gray-600">
                      {camp.dateCreated ? new Date(camp.dateCreated).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-2 text-gray-800 font-medium">{(camp.scans || 0).toLocaleString()}</td>
                    <td className="py-4 px-2 text-gray-600">{camp.conversion != null ? `${camp.conversion}%` : '—'}</td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize ${
                        camp.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {camp.status || 'inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, percentage, icon, bg }) {
  const hasTrend = typeof percentage === 'number'
  const isUp = hasTrend && percentage >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {hasTrend ? (
        <p className={`text-xs font-medium flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
          {isUp ? '↗' : '↘'} {Math.abs(percentage)}% vs last month
        </p>
      ) : (
        <p className="text-xs text-gray-300">No comparison data yet</p>
      )}
    </div>
  )
}