// src/pages/admin/AdminAnalytics.jsx
import { useState, useEffect } from 'react'
import { 
  Loader2, AlertCircle, TrendingUp, Users, Eye, 
  MousePointerClick, Download, MoreHorizontal, Activity, Tag
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from 'recharts'
import ServerError from '../../components/ServerError'
import { analyticsAPI, adminAPI } from '../../services/apiClient'

const PIE_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EF4444']

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState('Monthly')
  const [creatorsCount, setCreatorsCount] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard analytics (real data)
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

  // Fetch creators count too
  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await adminAPI.getCreators()
        const list = Array.isArray(res.data) ? res.data : (res.data?.creators || [])
        setCreatorsCount(list.length)
      } catch (err) {
        console.error('Failed to load creators count:', err)
      }
    }
    fetchCreators()
  }, [])

  // ─── Extract real data from analytics response ───
  const totalScans = analytics?.totalNFCScans?.count ?? analytics?.totalScans?.count ?? 0
  const uniqueActivations = analytics?.uniqueActivations?.count ?? 0
  const repeatScans = analytics?.repeatScans?.count ?? 0
  const conversionRate = analytics?.conversionRate?.count ?? 0

  // ─── Scan Timeline (real data) ───
  const scanTimeline = analytics?.scanTimeline?.[0] || analytics?.scanTimeline || {}
  const timelineData = scanTimeline[timeRange] || scanTimeline['30Days'] || scanTimeline['7Days'] || []

  // ─── Campaign Performance ───
  const activeCampaigns = analytics?.activeCampaigns?.count ?? analytics?.campaignPerformance?.filter(c => c.status === 'Active').length ?? 0
  const taggedItems = analytics?.taggedItems?.count ?? analytics?.totalTags?.count ?? 0

  // ─── Top Locations ───
  const topLocations = analytics?.topLocations || []

  // ─── Scans Per Creator ───
  const scansPerCreator = analytics?.scansPerCreator || []

  // ─── Prepare chart data with fallbacks ───
  const chartData = timelineData.length > 0 
    ? timelineData 
    : [
        { day: 'Jan', scans: 0 }, { day: 'Feb', scans: 0 },
        { day: 'Mar', scans: 0 }, { day: 'Apr', scans: 0 },
        { day: 'May', scans: 0 }, { day: 'Jun', scans: 0 },
        { day: 'Jul', scans: 0 }, { day: 'Aug', scans: 0 },
        { day: 'Sep', scans: 0 }, { day: 'Oct', scans: 0 },
        { day: 'Nov', scans: 0 }, { day: 'Dec', scans: 0 },
      ]

  const creatorChartData = scansPerCreator.length > 0 
    ? scansPerCreator 
    : []

  const locationData = topLocations.length > 0 
    ? topLocations.map(loc => ({ name: loc.name || loc.location, value: loc.value || loc.scans || 0 }))
    : []

  const exportCSV = () => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Creators', creatorsCount],
      ['Total Scans', totalScans],
      ['Active Campaigns', activeCampaigns],
      ['Tagged Items', taggedItems],
    ]
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.csv'
    a.click()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return <ServerError onRetry={fetchAnalytics} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-500 text-sm mt-1">Performance across campaigns and creators</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Creators</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{creatorsCount || 0}</p>
          <p className="text-xs text-green-500 mt-1">+5 this month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Scans</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Eye size={16} className="text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalScans.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">+22% this month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Campaigns</span>
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeCampaigns || 0}</p>
          <p className="text-xs text-green-500 mt-1">+2 vs last month</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Tagged Items</span>
            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Tag size={16} className="text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{taggedItems || 0}</p>
          <p className="text-xs text-green-500 mt-1">+4 this week</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Scan Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-lg">Monthly Scan Trend</h3>
            <button className="text-xs text-gray-400 hover:text-gray-600">View report</button>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            {['Monthly', '3 months', '30 days', '7 days', '24 hours'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  timeRange === range 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="scans" stroke="#F97316" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scans Per Creator */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 text-lg mb-6">Scans Per Creator</h3>
          
          {creatorChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={creatorChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="scans" fill="#F97316" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No creator scan data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}