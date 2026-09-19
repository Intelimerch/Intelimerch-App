import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, AlertCircle, TrendingUp, TrendingDown, Users,
  ShoppingBag, Eye, MousePointerClick, Calendar, ChevronDown,
  Download, RefreshCw, BarChart3, PieChart, Activity, Tag
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import EmptyState from '../../components/EmptyState'
import { analyticsAPI, campaignAPI } from '../../services/apiClient'

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899', '#F59E0B']

export default function Analytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [showCampDrop, setShowCampDrop] = useState(false)
  const [viewMode, setViewMode] = useState('overview') // 'overview' | 'campaign'

  // ─── Load Campaigns ───
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await campaignAPI.getAll()
        const list = Array.isArray(res.data) ? res.data : (res.data?.campaigns || [])
        setCampaigns(list)
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      } finally {
        setLoadingCampaigns(false)
      }
    }
    loadCampaigns()
  }, [])

  // ─── Load Analytics ───
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      let res
      if (viewMode === 'campaign' && selectedCampaignId) {
        res = await analyticsAPI.getCampaignAnalytics(selectedCampaignId)
      } else {
        res = await analyticsAPI.getDashboardAnalytics()
      }

      console.log('📊 Analytics fetched:', res)
      
      // ─── Handle the response structure ───
      // Dashboard: { analyticsData: { ... } }
      // Campaign: { data: { ... } }
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
  }, [viewMode, selectedCampaignId])

  const selectedCampaign = campaigns.find(c => (c._id || c.id) === selectedCampaignId)

  const handleRefresh = () => {
    fetchAnalytics()
  }

  // ─── Extract data from response ───
  const totalNFCScans = analytics?.totalNFCScans?.count ?? analytics?.totalScans?.count ?? 0
  const uniqueActivations = analytics?.uniqueActivations?.count ?? 0
  const repeatScans = analytics?.repeatScans?.count ?? 0
  const conversionRate = analytics?.conversionRate?.count ?? 0

  // ─── Scan Timeline ───
  const scanTimeline = analytics?.scanTimeline?.[0] || {}
  const timelineData = scanTimeline['30Days'] || scanTimeline['7Days'] || scanTimeline['24Hours'] || []

  // ─── Campaign Performance ───
  const campaignPerformance = analytics?.campaignPerformance || []

  // ─── Campaign-specific data ───
  const totalTags = analytics?.totalTags?.count ?? 0
  const avgScansPerTag = analytics?.avgScansPerTag?.count ?? 0
  const topTagScans = analytics?.topTagScans?.count ?? 0
  const allTags = analytics?.allTags || []
  const scansPerTag = analytics?.scansPerTag || []
  const topPerformingTags = analytics?.topPerformingTags || []

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

  const campaignChartData = campaignPerformance.map(c => ({
    name: c.campaignName || 'Unnamed',
    scans: c.scans || 0,
    conversion: c.conversion || 0,
  }))

  const tagChartData = scansPerTag.length > 0 
    ? scansPerTag 
    : allTags.map(t => ({ label: t.tagId || t.id, value: t.scans || 0 }))

  const locationData = [
    { name: 'Lagos', value: 4800 },
    { name: 'Abuja', value: 1820 },
    { name: 'Calabar', value: 980 },
    { name: 'PH', value: 741 },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading analytics...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Track your campaign performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('campaign')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === 'campaign'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Campaign
            </button>
          </div>

          {/* Campaign Selector */}
          {viewMode === 'campaign' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCampDrop(!showCampDrop)}
                disabled={loadingCampaigns}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer min-w-[160px] justify-between hover:bg-gray-50 transition-all"
              >
                <span className="text-sm text-gray-800">
                  {loadingCampaigns
                    ? 'Loading…'
                    : selectedCampaign?.campaignName || 'Select campaign'}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showCampDrop && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto py-1">
                  {campaigns.length === 0 ? (
                    <p className="px-4 py-2.5 text-sm text-gray-400">No campaigns found</p>
                  ) : campaigns.map(c => {
                    const id = c._id || c.id
                    return (
                      <button
                        key={id}
                        onClick={() => { setSelectedCampaignId(id); setShowCampDrop(false) }}
                        className={`block w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                          selectedCampaignId === id ? 'bg-gray-100 text-primary font-semibold' : 'text-gray-800'
                        }`}
                      >
                        {c.campaignName || c.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ─── OVERVIEW MODE ─── */}
      {viewMode === 'overview' && (
        <>
          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total NFC Scans"
              value={totalNFCScans.toLocaleString() || '0'}
              icon={<Eye size={20} className="text-blue-500" />}
              bg="bg-blue-50"
            />
            <StatCard
              label="Unique Activations"
              value={uniqueActivations.toLocaleString() || '0'}
              icon={<Users size={20} className="text-violet-500" />}
              bg="bg-violet-50"
            />
            <StatCard
              label="Repeat Scans"
              value={repeatScans.toLocaleString() || '0'}
              icon={<Activity size={20} className="text-green-500" />}
              bg="bg-green-50"
            />
            <StatCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              icon={<MousePointerClick size={20} className="text-orange-500" />}
              bg="bg-orange-50"
            />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Scan Timeline */}
            <div className="card lg:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-4">Scan Timeline</h3>
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

          {/* Campaign Performance */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            {campaignChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="scans" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
                No campaign data available
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── CAMPAIGN MODE ─── */}
      {viewMode === 'campaign' && selectedCampaignId && (
        <>
          {/* Campaign Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Tags"
              value={totalTags.toLocaleString() || '0'}
              icon={<Tag size={20} className="text-primary" />}
              bg="bg-orange-50"
            />
            <StatCard
              label="Total Scans"
              value={totalNFCScans.toLocaleString() || '0'}
              icon={<Eye size={20} className="text-blue-500" />}
              bg="bg-blue-50"
            />
            <StatCard
              label="Avg Scans Per Tag"
              value={avgScansPerTag.toLocaleString() || '0'}
              icon={<BarChart3 size={20} className="text-violet-500" />}
              bg="bg-violet-50"
            />
            <StatCard
              label="Top Tag Scans"
              value={topTagScans.toLocaleString() || '0'}
              icon={<TrendingUp size={20} className="text-green-500" />}
              bg="bg-green-50"
            />
          </div>

          {/* Tags Table */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">All Tags</h3>
            {allTags.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-semibold">Tag ID</th>
                      <th className="pb-2 font-semibold">Product</th>
                      <th className="pb-2 font-semibold text-right">Scans</th>
                      <th className="pb-2 font-semibold text-right">Last Scan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allTags.map((tag, i) => (
                      <tr key={tag.id || i} className="hover:bg-gray-50/50">
                        <td className="py-2.5 font-mono text-xs text-gray-600">{tag.tagId || tag.id}</td>
                        <td className="py-2.5 text-gray-600">{tag.product || '—'}</td>
                        <td className="py-2.5 text-gray-700 font-medium text-right">{tag.scans || 0}</td>
                        <td className="py-2.5 text-gray-400 text-right">{tag.lastScan ? new Date(tag.lastScan).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[100px] text-gray-400 text-sm">
                No tags found for this campaign
              </div>
            )}
          </div>

          {/* Top Performing Tags */}
          {topPerformingTags.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Top Performing Tags</h3>
              <div className="space-y-2">
                {topPerformingTags.map((tag, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono text-xs text-gray-600">{tag.tagId}</p>
                      <p className="text-sm text-gray-500">{tag.product}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{tag.scans} scans</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Stat Card Component ───
function StatCard({ label, value, icon, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}