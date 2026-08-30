// src/pages/admin/AdminOverview.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Loader2, AlertCircle, TrendingUp, TrendingDown,
  Eye, MousePointerClick, Calendar, RefreshCw, ArrowRight,
  Users, Repeat
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { analyticsAPI } from '../../services/apiClient'

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#F59E0B']

export default function AdminOverview() {
  const navigate = useNavigate()
  const { user } = useAuth() // ✅ Get real user name
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState('7 Days')

  // Get user's name for the header
  const adminName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.name || 'Admin'

  // ─── Load Analytics ───
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await analyticsAPI.getDashboardAnalytics()
      console.log('📊 Admin Analytics fetched:', res)
      
      // Handle the response structure
      let data
      if (res.analyticsData) {
        data = res.analyticsData
      } else if (res.data) {
        data = res.data
      } else {
        data = res
      }
      
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleRefresh = () => fetchAnalytics()

  // ─── Extract data from response ───
  const totalNFCScans = analytics?.totalNFCScans?.count ?? 0
  const uniqueActivations = analytics?.uniqueActivations?.count ?? 0
  const repeatScans = analytics?.repeatScans?.count ?? 0
  const conversionRate = analytics?.conversionRate?.count ?? 0

  // ─── Scan Timeline ───
  const scanTimeline = analytics?.scanTimeline?.[0] || {}
  const timelineData = scanTimeline[timeRange.replace(' ', '')] || scanTimeline['7Days'] || scanTimeline['30Days'] || []

  // ─── Campaign Performance ───
  const campaignPerformance = analytics?.campaignPerformance || []

  // ─── Top Locations ───
  const topLocations = analytics?.topLocations || []

  // ─── Prepare chart data ───
  const chartData = timelineData.length > 0 
    ? timelineData 
    : [
        { day: 'Mon', scans: 0 },
        { day: 'Tue', scans: 0 },
        { day: 'Wed', scans: 0 },
        { day: 'Thu', scans: 0 },
        { day: 'Fri', scans: 0 },
        { day: 'Sat', scans: 0 },
        { day: 'Sun', scans: 0 },
      ]

  const locationData = topLocations.length > 0 
    ? topLocations.map(loc => ({ name: loc.name || loc.location, value: loc.value || loc.scans || 0 }))
    : [
        { name: 'Lagos', value: 4800 },
        { name: 'Abuja', value: 1820 },
        { name: 'Calabar', value: 980 },
        { name: 'PH', value: 741 },
      ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 text-center max-w-md">{error}</p>
        <button onClick={handleRefresh} className="btn-primary w-auto px-6 mt-3">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{adminName} Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Refresh">
            <RefreshCw size={18} className="text-gray-500" onClick={handleRefresh} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all" title="Calendar">
            <Calendar size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS (Matches Figma Exactly) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total NFC Scans"
          value={totalNFCScans.toLocaleString()}
          change="+18%"
          icon={<Eye size={16} className="text-blue-500" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="Unique Activations"
          value={uniqueActivations.toLocaleString()}
          change="+12%"
          icon={<Users size={16} className="text-violet-500" />}
          bg="bg-violet-50"
        />
        <StatCard
          label="Repeat Scans"
          value={repeatScans.toLocaleString()}
          change="+7%"
          icon={<Repeat size={16} className="text-green-500" />}
          bg="bg-green-50"
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          change="+7%"
          icon={<MousePointerClick size={16} className="text-orange-400" />}
          bg="bg-orange-50"
        />
      </div>

      {/* ─── CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan Timeline */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Scan Timeline</h3>
            <div className="flex items-center gap-2">
              {['24 Hours', '7 Days', '30 Days'].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    timeRange === range
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="scans" stroke="#F97316" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Locations */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Locations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RePieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {locationData.map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-600">{loc.name}</span>
                </div>
                <span className="font-medium">{loc.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Campaign Performance Table ─── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Campaign Performance</h3>
          <button 
            onClick={() => navigate('/admin/campaigns')}
            className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight size={14} />
          </button>
        </div>
        
        {campaignPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-semibold">Campaign Name</th>
                  <th className="pb-2 font-semibold">Tag Group</th>
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 font-semibold">Date Created</th>
                  <th className="pb-2 font-semibold text-right">Scans</th>
                  <th className="pb-2 font-semibold text-right">Conv.</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaignPerformance.slice(0, 5).map((camp, i) => (
                  <tr key={camp._id || i} className="hover:bg-gray-50/50">
                    <td className="py-2.5 font-medium text-gray-800">{camp.campaignName || camp.name}</td>
                    <td className="py-2.5 text-gray-600">{camp.tagGroup || '—'}</td>
                    <td className="py-2.5 text-gray-600">{camp.product || '—'}</td>
                    <td className="py-2.5 text-gray-600">{camp.dateCreated || '—'}</td>
                    <td className="py-2.5 text-gray-700 font-medium text-right">{(camp.scans || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-gray-600 text-right">{camp.conv || '—'}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        camp.status === 'Active' || camp.status === 'active'
                          ? 'bg-green-50 text-green-600'
                          : camp.status === 'Paused' || camp.status === 'paused'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {camp.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[150px] text-gray-400 text-sm">
            No campaign data available
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card Component (Matches Figma EXACTLY) ───
function StatCard({ label, value, change, icon, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-green-500">↑ {change}</span>
        <span className="text-xs text-gray-400">vs last month</span>
      </div>
    </div>
  )
}