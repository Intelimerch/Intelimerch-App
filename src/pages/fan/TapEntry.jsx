import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, AlertCircle, Nfc } from 'lucide-react'
import MobileShell from '../../components/MobileShell'
import {
  tapAPI,
  getOwnerToken,
  setTapToken,
  readTapToken,
  readTapOutcome,
  TAP_OUTCOME,
} from '../../services/apiClient'
import { getDeviceInfo } from '../../utils/getDeviceInfo'

function parseErrorMessage(error) {
  const message = error?.message || ''
  if (message.includes('Invalid ObjectId') || message.includes('404') || message.includes('not found')) {
    return "We couldn't find this tag. It may not be registered yet — try again, or contact the seller."
  }
  if (message.includes('Network')) {
    return 'No connection. Check your internet and tap again.'
  }
  if (message.includes('timed out')) {
    return 'That took too long. Tap again to retry.'
  }
  return message || 'Something went wrong reading your merch. Please tap again.'
}

export default function TapEntry() {
  const { tagId } = useParams()
  const navigate = useNavigate()

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const hasTapped = useRef(false)

  const runTap = async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Get device info (coordinates + IP) before firing the tap
      const deviceInfo = await getDeviceInfo()
      console.log('📍 Device info:', deviceInfo)

      const response = await tapAPI.tap(tagId, {
        ownerToken: getOwnerToken() || undefined,
        deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : /Mobi|Android/i.test(navigator.userAgent) ? 'android' : 'web',

        // ✅ ENABLED: Send full location (IP, lat, long, accuracy)
        location: deviceInfo.latitude
          ? { latitude: deviceInfo.latitude, longitude: deviceInfo.longitude }
          : undefined,
        ip: deviceInfo.ip || undefined,
        latitude: deviceInfo.latitude || undefined,
        longitude: deviceInfo.longitude || undefined,
        accuracy: deviceInfo.accuracy || undefined,
      })
      console.log('📲 Tap response:', response)

      const tapToken = readTapToken(response)
      if (tapToken) setTapToken(tapToken)

      const outcome = readTapOutcome(response)

      if (outcome === TAP_OUTCOME.RETURNING) {
        navigate('/fan/perks', { replace: true, state: { tagId } })
        return
      }

      navigate('/fan/activate', { replace: true, state: { tagId } })
    } catch (err) {
      console.error('❌ Tap failed:', err)

      if (err?.status === 403) {
        navigate('/fan/claimed', { replace: true, state: { tagId } })
        return
      }

      setError(parseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasTapped.current) return
    hasTapped.current = true
    runTap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId])

  if (loading) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Nfc size={28} className="text-primary" />
          </div>
          <Loader2 size={24} className="text-primary animate-spin mb-3" />
          <p className="font-bold text-gray-900">Reading your merch…</p>
          <p className="text-sm text-gray-500 mt-1">Hold tight, this only takes a second.</p>
        </div>
      </MobileShell>
    )
  }

  if (error) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Couldn't read that tap</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => {
              hasTapped.current = true
              runTap()
            }}
            className="btn-primary rounded-full py-4 text-base font-bold w-full"
          >
            Try again
          </button>
        </div>
      </MobileShell>
    )
  }

  return null
}