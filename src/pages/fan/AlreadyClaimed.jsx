import { useSearchParams } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Lock } from 'lucide-react'

export default function AlreadyClaimed() {
  const [params] = useSearchParams()
  const ig = params.get('ig') || '#'
  const yt = params.get('yt') || '#'
  const sp = params.get('sp') || '#'
  const tt = params.get('tt') || ''
  const tw = params.get('tw') || ''

  const SocialLink = ({ href, icon, label, className }) => (
    href && href !== '#'
      ? <a href={href} target="_blank" rel="noreferrer" className={className}>{icon}{label}</a>
      : null
  )

  return (
    <MobileShell bg="bg-red-50">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-40 h-40 rounded-full border-2 border-red-300/40" />
          <div className="absolute w-28 h-28 rounded-full border-2 border-red-400/50" />
          <div className="w-16 h-16 bg-red-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock size={28} className="text-white" />
          </div>
        </div>

        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">HOLD UP</h1>
        <p className="text-primary font-bold text-lg mb-3">This merch has already been claimed</p>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed max-w-xs">
          This piece is registered to another fan. Each NFC tag is unique and tied to one person.
        </p>

        <a href={window.location.origin} className="btn-primary rounded-full py-4 text-base font-bold mb-10 w-full block text-center">
          Get Your Own Merch
        </a>

        <p className="font-semibold text-gray-800 mb-4">But while you're here, follow the creator</p>
        <div className="flex flex-wrap gap-3 w-full justify-center">
          <a href={ig} target="_blank" rel="noreferrer"
            className="border border-gray-200 bg-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 flex-1 min-w-[120px]">
            <InstagramIcon /> Instagram
          </a>
          <a href={yt} target="_blank" rel="noreferrer"
            className="border border-gray-200 bg-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 flex-1 min-w-[120px]">
            <YouTubeIcon /> YouTube
          </a>
          <a href={sp} target="_blank" rel="noreferrer"
            className="border border-gray-200 bg-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 flex-1 min-w-[120px]">
            <SpotifyIcon /> Spotify
          </a>
          {tt && (
            <a href={tt} target="_blank" rel="noreferrer"
              className="border border-gray-200 bg-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 flex-1 min-w-[120px]">
              🎵 TikTok
            </a>
          )}
          {tw && (
            <a href={tw} target="_blank" rel="noreferrer"
              className="border border-gray-200 bg-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 flex-1 min-w-[120px]">
              𝕏 Twitter
            </a>
          )}
        </div>
      </div>
    </MobileShell>
  )
}

function InstagramIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
}
function YouTubeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
}
function SpotifyIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 13.5c2.5-1 5.5-1 8 0M7 10.5c3.5-1.5 7.5-1.5 11 0M9 16.5c2-0.7 4-0.7 6 0" /></svg>
}
