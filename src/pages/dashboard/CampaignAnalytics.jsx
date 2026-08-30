import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Loader2, AlertCircle, Eye, Tag, TrendingUp, 
  BarChart3, Users, MousePointerClick, Calendar, ChevronDown
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import { analyticsAPI, campaignAPI } from '../../services/apiClient'

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#A855F7', '#EC4899']

export default function CampaignAnalytics() {
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [period, setPeriod] = useState('30 Days')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const campaignRes = await campaignAPI.getAll()
        const campaigns = Array.isArray(campaignRes.data) ? campaignRes.data : (campaignRes.data?.campaigns || [])
        const foundCampaign = campaigns.find(c => (c._id || c.id) === campaignId)
        setCampaign(foundCampaign)

        const analyticsRes = await analyticsAPI.getCampaignAnalytics(campaignId)
        console.log('📊 Campaign analytics:', analyticsRes)
        setAnalytics(analyticsRes.data || analyticsRes)
      } catch (err) {
        console.error('Failed to load campaign analytics:', err)
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [campaignId])

  // ─── Extract data ───
  const totalTags = analytics?.totalTags?.count ?? 0
  const totalScans = analytics?.totalScans?.count ?? 0
  const avgScansPerTag = analytics?.avgScansPerTag?.count ?? 0
  const topTagScans = analytics?.topTagScans?.count ?? 0

  const allTags = analytics?.allTags || []
  const scansPerTag = analytics?.scansPerTag || []
  const topPerformingTags = analytics?.topPerformingTags || []

  // ─── Prepare chart data ───
  const timelineData = analytics?.scanTimeline?.[0]?.['30Days'] || 
                       analytics?.scanTimeline?.[0]?.['7Days'] || 
                       analytics?.scanTimeline?.[0]?.['24Hours'] || 
                       []

  // Generate sample timeline data if empty
  const defaultTimeline = [
    { day: 'May', scans: 120 },
    { day: 'Jun', scans: 180 },
    { day: 'Jul', scans: 160 },
    { day: 'Aug', scans: 240 },
    { day: 'Sep', scans: 310 },
    { day: 'Oct', scans: 280 },
    { day: 'Nov', scans: 190 },
    { day: 'Dec', scans: 220 },
  ]

  const chartData = timelineData.length > 0 ? timelineData : defaultTimeline

  // ─── Scans Per Tag data ───
  const tagData = scansPerTag.length > 0 
    ? scansPerTag 
    : allTags.map(t => ({ label: t.tagId || t.id, value: t.scans || 0 }))

  // ─── Sort tags by scans for ranking ───
  const sortedTags = [...tagData].sort((a, b) => b.value - a.value)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading campaign analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 text-center max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary w-auto px-6 mt-3">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard/campaigns')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Campaign Analytics
          </h1>
          <p className="text-gray-500 text-sm">
            {campaign?.campaignName || 'Campaign'} — Performance overview
          </p>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Total Tags" 
          value={totalTags.toLocaleString()} 
          trend="18% vs last month"
          icon={<Tag size={18} className="text-primary" />} 
          bg="bg-orange-50"
        />
        <StatCard 
          label="Avg Scans / Tag" 
          value={avgScansPerTag.toLocaleString()} 
          trend="Avg Scans / Tag"
          icon={<BarChart3 size={18} className="text-violet-500" />} 
          bg="bg-violet-50"
        />
        <StatCard 
          label="Top Tag Scans" 
          value={topTagScans.toLocaleString()} 
          trend="Avg Scans / Tag"
          icon={<TrendingUp size={18} className="text-green-500" />} 
          bg="bg-green-50"
        />
      </div>

      {/* ─── Campaign Activity Over Time ─── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Campaign Activity Over Time</h3>
          <div className="relative">
            <button className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all">
              {period} <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11, fill: '#9ca3af' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#9ca3af' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="scans" 
              stroke="#F97316" 
              strokeWidth={2.5} 
              dot={{ fill: '#F97316', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── Scans Per Tag ─── */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Scans Per Tag</h3>
          {tagData.length > 0 ? (
            <div className="space-y-2">
              {tagData.map((tag, i) => {
                const percentage = Math.max((tag.value / (tagData[0]?.value || 1)) * 100, 5)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-600 w-20 truncate">
                      {tag.label || `Tag ${i + 1}`}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {tag.value.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No tag data available
            </div>
          )}
        </div>

        {/* ─── Tag Performance Ranking ─── */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Tag Performance Ranking</h3>
          {sortedTags.length > 0 ? (
            <div className="space-y-2">
              {sortedTags.map((tag, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    i === 0 ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${
                      i === 0 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      #{i + 1}
                    </span>
                    <span className="text-sm font-mono text-gray-700">
                      {tag.label || `Tag ${i + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">
                      {tag.value.toLocaleString()} scans
                    </span>
                    {i === 0 && (
                      <span className="text-xs font-semibold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                        Top
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No tag data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───
function StatCard({ label, value, trend, icon, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-green-600 flex items-center gap-1 mt-1">
        <TrendingUp size={11} /> {trend}
      </p>
    </div>
  )
}