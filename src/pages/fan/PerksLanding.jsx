// src/pages/fan/PerksLanding.jsx
import { useState, useEffect, useMemo, useRef } from 'react'
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
import CampaignPageRenderer, { REVEAL_PERKS_EVENT } from './CampaignPageRenderer'

const PERK_PRESENTATION = {
  video: { label: 'Exclusive', cta: 'Watch', route: '/fan/perks/video', icon: Video, iconBg: 'bg-red-50', iconColor: 'text-red-400' },
  audio: { label: 'Audio', cta: 'Listen', route: '/fan/perks/audio', icon: Music, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  image: { label: 'Image', cta: 'View', route: '/fan/perks/image', icon: ImageIcon, iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
  document: { label: 'Document', cta: 'Open', route: '/fan/perks/document', icon: FileText, iconBg: 'bg-green-50', iconColor: 'text-green-500' },
  link: { label: 'Link', cta: 'Get Link', route: '/fan/perks/link', icon: Link2, iconBg: 'bg-purple-50', iconColor: 'text-purple-400' },
}

const presentationFor = (contentType) =>
  PERK_PRESENTATION[(contentType || '').toLowerCase()] || PERK_PRESENTATION.link

function classifyError(error) {
  const message = (error?.message || '').toLowerCase()
  const code = error?.code || ''

  if (code === 'FAN_SESSION_EXPIRED' ||
      message.includes('session has ended') ||
      message.includes('session expired') ||
      message.includes('jwt expired') ||
      message.includes('token expired')) {
    return {
      kind: 'session_expired',
      title: 'Tap your merch again',
      body: "Your session has ended. Hold your phone near the NFC tag on your item to pick up where you left off.",
    }
  }

  if (code === 'FAN_UNAUTHORIZED' ||
      message.includes('invalid tap token') ||
      message.includes('tap token')) {
    return {
      kind: 'unauthorized',
      title: 'Tap your merch again',
      body: "We couldn't verify this tap. Hold your phone near the NFC tag on your item to continue.",
    }
  }

  if (message.includes('owner token')) {
    return {
      kind: 'owner_missing',
      title: 'Tap your merch again',
      body: "This merch isn't linked to this device. Hold your phone near the NFC tag to unlock your perks.",
    }
  }

  if (message.includes('tag not found') || message.includes('does not belong')) {
    return {
      kind: 'not_found',
      title: "Couldn't find this merch",
      body: "This merch isn't registered to you. Tap your own item to see its perks.",
    }
  }

  if (message.includes('network') || message.includes('fetch failed') || message.includes("couldn't reach")) {
    return {
      kind: 'network',
      title: 'Connection problem',
      body: "We couldn't reach the server. Check your internet and try again.",
      recoverable: true,
    }
  }

  if (message.includes('timed out') || message.includes('timeout')) {
    return {
      kind: 'timeout',
      title: 'That took too long',
      body: 'Please try again in a moment.',
      recoverable: true,
    }
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    body: "We couldn't load your perks. Please try again.",
    recoverable: true,
  }
}

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

function parseResponse(response) {
  const data = response?.data

  if (Array.isArray(data)) {
    return { campaign: null, resources: data }
  }

  if (data && typeof data === 'object') {
    const resources =
      Array.isArray(data.resources) ? data.resources
      : Array.isArray(data.campaignPerks) ? data.campaignPerks
      : []

    const campaign = data.campaign || null

    return {
      campaign: campaign
        ? {
            campaignId: campaign.campaignId,
            campaignName: campaign.campaignName,
            pageStructure: campaign.pageStructure || null,
          }
        : null,
      resources,
    }
  }

  return { campaign: null, resources: [] }
}

// A "gating button" is a Button block with no URL (or #perks). If one
// exists, we hide the perks until the fan taps it.
function findGatingButton(pageStructure) {
  const blocks = pageStructure?.blocks
  if (!Array.isArray(blocks)) return null
  return (
    blocks.find((b) => {
      if (b.type !== 'Button') return false
      const url = (b.meta?.url || '').trim()
      return !url || url === '#perks'
    }) || null
  )
}

export default function PerksLanding() {
  const navigate = useNavigate()

  const [resources, setResources] = useState([])
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState(null)

  const [perksRevealed, setPerksRevealed] = useState(false)
  const perksRef = useRef(null)
  const hasAutoRevealed = useRef(false)

  const tapToken = getTapToken()
  const ownerToken = getOwnerToken()
  const firstName = localStorage.getItem('fanFirstName')

  const fetchResources = async () => {
    try {
      setLoading(true)
      setErrorInfo(null)

      const response = await tapAPI.getCampaignResources({ tapToken, ownerToken })
      console.log('🎁 Campaign page response:', response)

      const { campaign: camp, resources: list } = parseResponse(response)

      setCampaign(camp)
      setResources(list)
    } catch (err) {
      console.error('❌ Error fetching campaign resources:', err)
      setErrorInfo(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tapToken || !ownerToken) {
      setLoading(false)
      return
    }
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapToken, ownerToken])

  // ── Listen for the reveal event from CampaignPageRenderer ──
  useEffect(() => {
    const handler = () => setPerksRevealed(true)
    window.addEventListener(REVEAL_PERKS_EVENT, handler)
    return () => window.removeEventListener(REVEAL_PERKS_EVENT, handler)
  }, [])

  // ── Decide whether perks are gated ──
  const gatingButton = useMemo(
    () => findGatingButton(campaign?.pageStructure),
    [campaign]
  )

  // If there's no gating button, always show perks (fallback rule).
  const perksVisible = !gatingButton || perksRevealed

  // ── On reveal, smooth-scroll to the perks section and trigger the fade ──
  useEffect(() => {
    if (!perksVisible) return
    if (hasAutoRevealed.current) return
    hasAutoRevealed.current = true

    // Wait one frame for the DOM to mount the perks wrapper, then scroll
    const id = requestAnimationFrame(() => {
      perksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [perksVisible])

  const openPerk = (resource) => {
    const perk = typeof resource.perkId === 'object' ? resource.perkId : null
    const { route } = presentationFor(perk?.contentType)

    const params = new URLSearchParams()
    if (perk?.perkName) params.set('title', perk.perkName)
    if (perk?.description) params.set('desc', perk.description)
    if (perk?.fileUrl) params.set('url', perk.fileUrl)
    params.set('resourceId', resource._id)

    navigate(`${route}?${params.toString()}`)
  }

  // ── Not tapped yet
  if (!tapToken) {
    return (
      <FanNotice
        icon={Nfc}
        title="Tap your merch to begin"
        body="Hold your phone near the NFC tag on your item and your perks will open automatically."
      />
    )
  }

  // ── Loading
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

  // ── Error
  if (errorInfo) {
    const canRetry = errorInfo.recoverable === true
    const isSessionError =
      errorInfo.kind === 'session_expired' ||
      errorInfo.kind === 'unauthorized' ||
      errorInfo.kind === 'owner_missing'

    return (
      <FanNotice
        icon={isSessionError ? Nfc : AlertCircle}
        tone={isSessionError ? 'primary' : 'red'}
        title={errorInfo.title}
        body={errorInfo.body}
        action={
          canRetry ? (
            <button
              onClick={fetchResources}
              className="btn-primary rounded-full py-4 text-base font-bold w-full"
            >
              Try again
            </button>
          ) : null
        }
      />
    )
  }

  const hasDesign = Array.isArray(campaign?.pageStructure?.blocks)
    && campaign.pageStructure.blocks.length > 0

  // ── Truly empty (no design AND no perks)
  if (resources.length === 0 && !hasDesign) {
    return (
      <FanNotice
        icon={Gift}
        title="No perks yet"
        body="This drop doesn't have any perks attached right now. Check back soon — the creator can add them at any time."
      />
    )
  }

  return (
    <MobileShell>
      {hasDesign && (
        <div className="-mx-4 -mt-4 mb-4">
          <CampaignPageRenderer pageStructure={campaign.pageStructure} />
        </div>
      )}

      {perksVisible && (
        <div
          id="perks"
          ref={perksRef}
          className={perksRevealed ? 'perks-reveal' : ''}
        >
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

          {resources.length > 0 ? (
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
                    <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
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
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">
                No perks have been added to this drop yet.
              </p>
            </div>
          )}
        </div>
      )}
    </MobileShell>
  )
}