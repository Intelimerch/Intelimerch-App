import { useEffect, useState } from 'react'
import { Loader2, BellOff, CheckCheck } from 'lucide-react'
import { campaignAPI } from '../../services/apiClient'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readIds, setReadIds] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await campaignAPI.getNotifications()
        if (cancelled) return
        setNotifications(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Could not load notifications.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)))
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">Hey 👋 Stay updated on your campaigns</p>
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-outline w-auto px-5 text-sm">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={32} className="text-primary animate-spin mb-3" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl max-w-3xl">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 max-w-3xl">
          <BellOff size={32} className="mb-3" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {notifications.map((n) => {
            const unread = !readIds.has(n.id)
            return (
              <div key={n.id} className={`card relative ${unread ? 'border-primary/20 bg-primary-light/30' : ''}`}>
                {unread && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full" />
                )}
                <p className="font-medium text-gray-800 mb-1 pr-6">{n.msg}</p>
                <p className="text-xs text-gray-400">{n.time}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}