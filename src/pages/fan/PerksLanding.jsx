import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Video, Link2, Music, Play, FileText, Image as ImageIcon, Tag, AlertCircle } from 'lucide-react'

const iconByType = {
  video: { icon: Video, iconBg: 'bg-red-50', iconColor: 'text-red-400' },
  audio: { icon: Music, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  image: { icon: ImageIcon, iconBg: 'bg-blue-50', iconColor: 'text-blue-400' },
  document: { icon: FileText, iconBg: 'bg-teal-50', iconColor: 'text-teal-500' },
  discount: { icon: Tag, iconBg: 'bg-purple-50', iconColor: 'text-purple-400' },
  link: { icon: Link2, iconBg: 'bg-green-50', iconColor: 'text-green-500' },
}

const routeByType = {
  video: '/fan/perks/video',
  audio: '/fan/perks/audio',
  image: '/fan/perks/image',
  document: '/fan/perks/document',
  discount: '/fan/perks/discount',
  link: '/fan/perks/link',
}

export default function PerksLanding() {
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [perks, setPerks] = useState([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('intelimerch_tag')
      if (!raw) return
      const tagData = JSON.parse(raw)
      if (tagData?.campaign) setCampaign(tagData.campaign)

      const backendPerks = Array.isArray(tagData?.perks) ? tagData.perks : []
      if (backendPerks.length) {
        const mapped = backendPerks.map((perk) => {
          const type = (perk.contentType || 'link').toLowerCase()
          const style = iconByType[type] || iconByType.link
          return {
            type: perk.contentType ? perk.contentType[0].toUpperCase() + perk.contentType.slice(1) : 'Exclusive',
            title: perk.perkName,
            cta: type === 'discount' ? 'Get Code' : 'View',
            arrow: true,
            icon: style.icon,
            iconBg: style.iconBg,
            iconColor: style.iconColor,
            isNew: false,
            route: routeByType[type] || '/fan/perks/link',
            raw: perk,
          }
        })
        if (mapped.length) setPerks(mapped)
      }
    } catch {
      // no tag data — render honest empty state below
    }
  }, [])

  return (
    <MobileShell>
      <div className="relative rounded-2xl overflow-hidden mb-5 h-44 bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <Play size={20} className="text-white ml-1" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-0.5">{campaign?.campaignName || 'Exclusive Perks'}</h2>
      <p className="text-sm text-gray-500 mb-5">Exclusive content unlocked for this piece. Thank you for being part of the movement.</p>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900">Your Perks ({perks.length} Unlocked)</p>
        </div>
      </div>

      {perks.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl py-10 px-4 flex flex-col items-center text-center">
          <AlertCircle size={22} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-1">No perks have been attached to this campaign yet.</p>
          <p className="text-xs text-gray-400">The creator will add exclusive content here soon — check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {perks.map((perk, i) => (
            <button key={i} onClick={() => navigate(perk.route, { state: { perk: perk.raw } })}
              className="w-full card text-left hover:shadow-md transition-shadow relative">
              {perk.isNew && (
                <span className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-md">NEW</span>
              )}
              <div className={`w-10 h-10 ${perk.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <perk.icon size={18} className={perk.iconColor} />
              </div>
              <p className="text-xs text-gray-400 mb-0.5">{perk.type}</p>
              <p className="font-bold text-gray-900 mb-2">{perk.title}</p>
              <span className="text-primary font-semibold text-sm">{perk.cta} →</span>
            </button>
          ))}
        </div>
      )}
    </MobileShell>
  )
}
