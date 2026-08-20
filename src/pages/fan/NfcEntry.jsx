import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Loader2, AlertCircle } from 'lucide-react'
import { tagsAPI } from '../../services/apiClient'

export default function NfcEntry() {
  const { identifier } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        const res = await tagsAPI.getByTag(identifier)
        if (cancelled) return
        const tagData = res.data

        sessionStorage.setItem('intelimerch_tag', JSON.stringify(tagData))

        // record tap in the background (don't block the fan)
        tagsAPI.recordTap(identifier).catch(() => {})

        const status = tagData?.tag?.status
        if (status === 'activated' || status === 'claimed') {
          navigate('/fan/claimed', { replace: true })
        } else {
          navigate(`/fan/activate?tag=${encodeURIComponent(identifier)}`, { replace: true })
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Unable to read this tag')
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [identifier, navigate])

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
              <AlertCircle size={30} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Tag Not Found</h1>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              {error}. Check the tag and try again, or contact the creator for help.
            </p>
          </>
        ) : (
          <>
            <Loader2 size={36} className="text-primary animate-spin mb-5" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Reading Tag...</h1>
            <p className="text-sm text-gray-500">Just a moment, we're verifying this piece.</p>
          </>
        )}
      </div>
    </MobileShell>
  )
}
