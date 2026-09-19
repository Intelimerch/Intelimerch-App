import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import {
  Video,
  Link2,
  Music,
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertCircle,
  Nfc,
  Gift,
} from 'lucide-react'
import { tapAPI, getTapToken, getOwnerToken } from '../../services/apiClient'

// Maps the perk's contentType (backend enum: audio | video | image | link |
// document) onto the existing detail screens and their visual treatment.
// Anything unrecognised falls back to the link preset rather than rendering a
// broken card.
const PERK_PRESENTATION = {
  video: {
    label: 'Exclusive',
    cta: 'Watch',
    route: '/fan/perks/video',
    icon: Video,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-400',
  },
  audio: {
    label: 'Audio',
    cta: 'Listen',
    route: '/fan/perks/audio',
    icon: Music,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
  },
  image: {
    label: 'Image',
    cta: 'View',
    route: '/fan/perks/image',
    icon: ImageIcon,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-400',
  },
  document: {
    label: 'Document',
    cta: 'Open',
    route: '/fan/perks/document',
    icon: FileText,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  link: {
    label: 'Link',
    cta: 'Get Link',
    route: '/fan/perks/link',
    icon: Link2,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-400',
  },
}

const presentationFor = (contentType) =>
  PERK_PRESENTATION[(contentType || '').toLowerCase()] || PERK_PRESENTATION.link

function parseErrorMessage(error) {
  const message = error?.message || ''
  if (message.includes('Tag not found') || message.includes('does not belong')) {
    return "This merch isn't registered to you. Tap your own item to see its perks."
  }
  if (message.includes('Invalid tap token') || message.includes('tap token')) {
    return 'Your session expired. Tap your merch again to unlock your perks.'
  }
  if (message.includes('Network')) {
    return 'No connection. Check your internet and try again.'
  }
  if (message.includes('timed out')) {
    return 'That took too long. Please try again.'
  }
  return message || "We couldn't load your perks. Please try again."
}

// Shared empty/blocked layout so the several "can't show perks yet" states look
// consistent instead of each inventing its own markup.
function FanNotice({ icon: Icon, tone = 'primary', title, body, action }) {
  const tones = {
    primary: { bg: 'bg-primary/10', fg: 'text-primary' },
    red: { bg: 'bg-red-50', fg: 'text-red-500' },
  }
  const { bg, fg } = tones[tone] || tones.primary

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className={`w-16 h-16 rounded-full ${bg} flex items-center justify-center mb-5`}>
          <Icon size={28} className={fg} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">{body}</p>
        {action}
      </div>
    </MobileShell>
  )
}

export default function PerksLanding() {
  const navigate = useNavigate()

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const tapToken = getTapToken()
  const ownerToken = getOwnerToken()

  // Set during activation so the greeting can be personal without an extra
  // profile request — this endpoint doesn't return the fan.
  const firstName = localStorage.getItem('fanFirstName')

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await tapAPI.getCampaignResources({ tapToken, ownerToken })
      console.log('🎁 Campaign resources fetched:', response)

      // Backend returns a flat array under `data`, but stay defensive — other
      // endpoints in this API have nested their lists a level deeper.
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.resources || response.data?.campaignPerks || []

      setResources(list)
    } catch (err) {
      console.error('❌ Error fetching campaign resources:', err)
      setError(parseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Both tokens are mandatory query params on this endpoint, and the
    // controller dereferences the decoded owner without a guard — calling it
    // without them produces a 500 rather than a useful message. Check first.
    if (!tapToken || !ownerToken) {
      setLoading(false)
      return
    }
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapToken, ownerToken])

  const openPerk = (resource) => {
    // perkId is populated on the list endpoint, but can come back as a bare
    // ObjectId string elsewhere — guard so a string doesn't blow up on access.
    const perk = typeof resource.perkId === 'object' ? resource.perkId : null
    const { route } = presentationFor(perk?.contentType)

    // The detail screens currently read their content from the query string
    // (see LinkPerk), so pass it through in the same shape.
    const params = new URLSearchParams()
    if (perk?.perkName) params.set('title', perk.perkName)
    if (perk?.description) params.set('desc', perk.description)
    if (perk?.fileUrl) params.set('url', perk.fileUrl)
    params.set('resourceId', resource._id)

    navigate(`${route}?${params.toString()}`)
  }

  // ─── Never tapped / session gone ───
  if (!tapToken) {
    return (
      <FanNotice
        icon={Nfc}
        title="Tap your merch to begin"
        body="Hold your phone near the NFC tag on your item and your perks will open automatically."
      />
    )
  }

  // ─── Tapped, but this device isn't linked to a fan yet ───
  if (!ownerToken) {
    return (
      <FanNotice
        icon={Nfc}
        title="Tap again to unlock"
        body="We need to recognise your device before showing your perks. Hold your phone near the NFC tag once more."
      />
    )
  }

  // ─── Loading ───
  if (loading) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={40} className="text-primary animate-spin mb-4" />
          <p className="text-gray-500">Loading your perks…</p>
        </div>
      </MobileShell>
    )
  }

  // ─── Error ───
  if (error) {
    return (
      <FanNotice
        icon={AlertCircle}
        tone="red"
        title="Couldn't load your perks"
        body={error}
        action={
          <button
            onClick={fetchResources}
            className="btn-primary rounded-full py-4 text-base font-bold w-full"
          >
            Try again
          </button>
        }
      />
    )
  }

  // ─── Empty ───
  if (resources.length === 0) {
    return (
      <FanNotice
        icon={Gift}
        title="No perks yet"
        body="This drop doesn't have any perks attached right now. Check back soon — the creator can add them at any time."
      />
    )
  }

  // ─── Perks list ───
  return (
    <MobileShell>
      <div className="flex items-center justify-between mb-4 pt-2">
        <div>
          <p className="font-bold text-gray-900">
            {firstName ? `Hey ${firstName} 👋 Welcome back` : 'Welcome back 👋'}
          </p>
          <p className="text-sm text-gray-500">
            Your Perks ({resources.length} Unlocked)
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
        Exclusive content unlocked for this piece. Thank you for being part of the movement.
      </p>

      <div className="space-y-3">
        {resources.map((resource) => {
          const perk = typeof resource.perkId === 'object' ? resource.perkId : null
          const { label, cta, icon: Icon, iconBg, iconColor } = presentationFor(
            perk?.contentType
          )

          return (
            <button
              key={resource._id}
              onClick={() => openPerk(resource)}
              className="w-full card text-left hover:shadow-md transition-shadow relative"
            >
              <div
                className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon size={18} className={iconColor} />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-bold text-gray-900 mb-2">
                {perk?.perkName || 'Exclusive perk'}
              </p>
              {perk?.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{perk.description}</p>
              )}
              <span className="text-primary font-semibold text-sm">{cta} →</span>
            </button>
          )
        })}
      </div>
    </MobileShell>
  )
}
