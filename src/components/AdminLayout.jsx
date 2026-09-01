// src/components/AdminLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Megaphone, Tag, BarChart2, Settings, LogOut, 
  Menu, X, ChevronLeft, Gift 
} from 'lucide-react'
import ScreenGuard from './ScreenGuard'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/creators', label: 'Creators', icon: Users },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/admin/tags', label: 'Tags', icon: Tag },
  { to: '/admin/perks', label: 'Perks Library', icon: Gift }, // ✅ ADDED
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const confirmLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/signin')
    }
  }

  return (
    <ScreenGuard minWidth={768}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        <aside className={`
          fixed lg:relative z-40 lg:z-auto h-full bg-white border-r border-gray-100 flex flex-col
          transition-all duration-300 shrink-0
          ${collapsed ? 'w-16' : 'w-52'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 flex items-center justify-between border-b border-gray-50 min-h-[64px]">
            {!collapsed && (
              <img 
                src="/logo.png" 
                alt="Intelimerch" 
                className="h-12 w-auto object-contain"
              />
            )}
            <button onClick={() => setCollapsed(c => !c)} className="p-1.5 hover:bg-gray-100 rounded-lg hidden lg:flex items-center justify-center ml-auto">
              <ChevronLeft size={16} className={`text-gray-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg ml-auto">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer
                  ${isActive ? 'text-primary bg-primary-light' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}
                  ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="p-2 border-t border-gray-100 space-y-0.5">
            <button 
  onClick={() => navigate('/admin/settings')}
  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium w-full transition-all ${collapsed ? 'justify-center' : ''}`}
>
  <Settings size={16} />
  {!collapsed && 'Settings'}
</button>
            <button 
              onClick={() => setConfirmOpen(true)}
              disabled={loggingOut}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 text-sm font-medium w-full transition-all disabled:opacity-50 ${collapsed ? 'justify-center' : ''}`} 
              title={collapsed ? 'Log out' : undefined}
            >
              <LogOut size={16} className="shrink-0" />{!collapsed && <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
            <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl">
              <Menu size={20} className="text-gray-600" />
            </button>
            <img 
              src="/logo.png" 
              alt="Intelimerch" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Log out?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenGuard>
  )
}