import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Play, AlertCircle } from 'lucide-react'
import usePerk, { perkValues } from './usePerk'

export default function VideoPerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const { name, description, url } = perkValues(perk, {
    name: 'Behind-The-Scenes Video',
    description: 'Unreleased footage, just for you.',
  })

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-4">{description}</p>

        {url ? (
          <video controls className="w-full rounded-2xl bg-gray-900 mb-4" style={{ aspectRatio: '16/9' }}>
            <source src={url} />
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="relative bg-purple-300 rounded-2xl h-52 flex items-center justify-center mb-4">
            <button className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Play size={24} className="text-white ml-1" />
            </button>
          </div>
        )}

        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="btn-primary rounded-full py-3.5 font-bold block text-center">
            Open Video
          </a>
        ) : (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>This video is still being prepared by the creator.</span>
          </div>
        )}
      </div>
    </MobileShell>
  )
}
