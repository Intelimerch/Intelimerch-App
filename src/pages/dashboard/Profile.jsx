import { useEffect, useState } from 'react'
import { Camera, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Profile() {
  const { user, refreshProfile } = useAuth()
  const [tab, setTab] = useState('profile')
  const [showPw, setShowPw] = useState({ cur: false, new: false, confirm: false })
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Always pull the freshest profile data on mount, rather than relying
  // only on whatever was cached at login time.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await refreshProfile()
      } catch (err) {
        console.error('Failed to refresh profile:', err)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const fullName = user
    ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')
    : ''
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="text-gray-500 text-sm">
          {user ? `Hey ${user.firstName} 👋, Manage your profile and settings` : 'Manage your profile and settings'}
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {['profile', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {loadingProfile ? (
        <div className="card max-w-2xl text-center text-gray-400 text-sm py-10">
          Loading profile...
        </div>
      ) : tab === 'profile' ? (
        <div className="card max-w-2xl">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-100">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {initials || '?'}
              </div>
              <button
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md opacity-50 cursor-not-allowed"
                disabled
                title="Coming soon"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{fullName || 'Unnamed User'}</h2>
            <p className="text-sm text-gray-500">{user?.accountType}</p>
          </div>

          <div className="space-y-5">
            <Field label="First Name" value={user?.firstName ?? ''} />
            <Field label="Middle Name" value={user?.middleName ?? ''} />
            <Field label="Last Name" value={user?.lastName ?? ''} />
            <Field label="Email" value={user?.email ?? ''} type="email" />
            {!user?.emailVerified && (
              <p className="text-xs text-amber-600 -mt-3">Email not yet verified</p>
            )}
            <button
              className="btn-primary w-auto px-8 opacity-50 cursor-not-allowed"
              disabled
              title="Profile editing isn't available yet"
            >
              Save Changes
            </button>
            <p className="text-xs text-gray-400">
              Editing your profile isn't available yet — check back soon.
            </p>
          </div>
        </div>
      ) : (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
          <div className="space-y-5">
            <PasswordField label="Current Password" show={showPw.cur} onToggle={() => setShowPw(s => ({ ...s, cur: !s.cur }))} />
            <PasswordField label="New Password" show={showPw.new} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))} />
            <PasswordField label="Confirm New Password" show={showPw.confirm} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} />
            <button
              className="btn-primary w-auto px-8 opacity-50 cursor-not-allowed"
              disabled
              title="Password changing isn't available yet"
            >
              Update Password
            </button>
            <p className="text-xs text-gray-400">
              Changing your password isn't available yet — check back soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      <input
        type={type}
        className="input-field bg-gray-50 cursor-not-allowed"
        value={value}
        readOnly
      />
    </div>
  )
}

function PasswordField({ label, show, onToggle }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} className="input-field pr-10" defaultValue="**********" disabled />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
    </div>
  )
}