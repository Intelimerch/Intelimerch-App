import { useState, useRef, useEffect } from 'react'
import { Search, Users, ShoppingBag, Package, Repeat, MoreHorizontal, ChevronDown, Download, Calendar } from 'lucide-react'
import { fanAPI } from '../../services/apiClient'

// Filter options for dropdowns
const merchTypes = ['Merch Type', 'Hoodie', 'T-shirt', 'Cap', 'Tote bag', 'Hoodie & Cap']

// ─── Custom Calendar Component ──────────────────────────────
function CalendarDropdown({ selectedDate, onSelectDate, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const calendarRef = useRef(null)

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  const handleDayClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const formatted = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
    onSelectDate(formatted)
    onClose()
  }

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1))
  }

  const isToday = (day) => {
    const today = new Date()
    return today.getDate() === day &&
           today.getMonth() === currentMonth.getMonth() &&
           today.getFullYear() === currentMonth.getFullYear()
  }

  return (
    <div ref={calendarRef} className="absolute top-full mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
          <ChevronDown size={16} className="rotate-90 text-gray-400" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-lg transition-all">
          <ChevronDown size={16} className="-rotate-90 text-gray-400" />
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isSelected = selectedDate === `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentMonth.getFullYear()}`
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-9 rounded-lg text-sm font-medium transition-all hover:bg-primary hover:text-white ${
                isSelected ? 'bg-primary text-white' : 'text-gray-700 hover:bg-primary/10'
              } ${isToday(day) ? 'border border-primary' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Today button */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => {
            const today = new Date()
            const formatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`
            onSelectDate(formatted)
            onClose()
          }}
          className="w-full text-center text-sm text-primary font-medium hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export default function Fans() {
  const [fans, setFans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMerchType, setSelectedMerchType] = useState('All')
  const [selectedCampaign, setSelectedCampaign] = useState('All')
  const [selectedDate, setSelectedDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const itemsPerPage = 6

  useEffect(() => {
    let active = true
    setLoading(true)
    fanAPI.getFans()
      .then((res) => {
        if (active) setFans(res?.data || [])
      })
      .catch(() => {
        if (active) setError('Could not load fans. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const campaigns = ['Campaign', ...new Set(fans.map(f => f.campaign).filter(Boolean))]

  const filteredFans = fans.filter(fan => {
    const matchesSearch = fan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fan.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMerch = selectedMerchType === 'All' || fan.category.includes(selectedMerchType)
    const matchesCampaign = selectedCampaign === 'All' || fan.campaign === selectedCampaign
    return matchesSearch && matchesMerch && matchesCampaign
  })

  const totalPages = Math.max(1, Math.ceil(filteredFans.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentFans = filteredFans.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedMerchType, selectedCampaign])

  const handleExport = () => {
    const header = ['Name', 'Email', 'Category of Merch', 'Number of Items', 'Status', 'Campaign']
    const rows = filteredFans.map(f => [f.name, f.email, f.category, f.items, f.status, f.campaign])
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fans.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalItems = fans.reduce((sum, f) => sum + (f.items || 0), 0)
  const uniqueProducts = new Set(fans.map(f => f.category).filter(c => c && c !== '—')).size
  const repeatBuyers = fans.filter(f => f.items > 1).length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fans</h1>
          <p className="text-gray-500 text-sm">Manage your fans and their purchases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total Fans</p>
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-violet-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fans.length.toLocaleString()}</p>
          <p className="text-xs font-medium text-green-600">{fans.length ? 'Live fan count' : 'No fans yet'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total Merch Sold</p>
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-teal-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
          <p className="text-xs font-medium text-green-600">Tagged items activated</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Unique Products</p>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueProducts}</p>
          <p className="text-xs font-medium text-green-600">Across your campaigns</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Repeat Buyers</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Repeat size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{repeatBuyers}</p>
          <p className="text-xs font-medium text-blue-600">{fans.length ? `${Math.round((repeatBuyers / fans.length) * 100)}% of total fans` : 'No fans yet'}</p>
        </div>
      </div>

      {/* ─── Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Merch Type */}
        <div className="relative">
          <select
            value={selectedMerchType}
            onChange={(e) => setSelectedMerchType(e.target.value)}
            className="px-4 py-2 pr-8 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
          >
            {merchTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Purchase Date with Calendar */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Purchase Date"
              value={selectedDate}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-center px-1 py-2 pl-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white w-[140px] cursor-pointer"
            />
            {/* <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> */}
          </div>
          {showCalendar && (
            <CalendarDropdown
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>

        {/* Campaign */}
        <div className="relative">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 pr-8 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"
          >
            {campaigns.map(campaign => (
              <option key={campaign} value={campaign}>{campaign}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Export Button with Download icon */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-all"
        >
          Export
          <Download size={16} />
        </button>
      </div>

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Category of Merch</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Number of Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">Loading fans...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && currentFans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    No fans found{fans.length ? ' matching your filters' : ' yet. Fans appear here once they activate your merch.'}
                  </td>
                </tr>
              )}
              {!loading && !error && currentFans.map((fan) => (
                <tr key={fan.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{fan.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fan.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fan.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fan.items}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {fan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    {/* ─── Horizontal Three Dots ──────────── */}
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === fan.id ? null : fan.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      <MoreHorizontal size={16} className="text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen === fan.id && (
                      <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        <button onClick={() => setDropdownOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                          View Details
                        </button>
                        <button onClick={() => setDropdownOpen(null)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                          Send Message
                        </button>
                        <button onClick={() => setDropdownOpen(null)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all">
                          Remove Fan
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredFans.length ? startIndex + 1 : 0}</span> to{' '}
            <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredFans.length)}</span> of{' '}
            <span className="font-medium">{filteredFans.length}</span> fans
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
