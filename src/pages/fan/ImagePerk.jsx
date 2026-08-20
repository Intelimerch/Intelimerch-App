import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Download, AlertCircle } from 'lucide-react'
import usePerk, { perkValues } from './usePerk'

export default function ImagePerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const { name, description, url } = perkValues(perk, {
    name: 'Limited Edition Artwork',
    description: 'Made exclusively for fans who own this drop. Yours to keep.',
  })

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive Artwork</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-4">{description}</p>

        {url ? (
          <div className="rounded-2xl overflow-hidden mb-5 bg-gray-100">
            <img src={url} alt={name} className="w-full h-64 object-cover" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-teal-200 via-purple-200 to-pink-200 h-64 flex items-center justify-center mb-5">
            <div className="text-center">
              <div className="text-6xl mb-2">🎨</div>
              <p className="text-sm font-semibold text-gray-700">Limited Edition</p>
              <p className="text-xs text-gray-500">#0042 / 500</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Format</p>
            <p className="text-sm font-bold text-gray-800">{url ? 'Image' : 'PNG · 4K'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Source</p>
            <p className="text-sm font-bold text-gray-800">Exclusive</p>
          </div>
        </div>

        {url ? (
          <a href={url} download target="_blank" rel="noreferrer"
            className="btn-primary rounded-full py-3.5 font-bold flex items-center justify-center gap-2">
            <Download size={18} /> Save Artwork
          </a>
        ) : (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>This artwork is still being prepared by the creator.</span>
          </div>
        )}
      </div>
    </MobileShell>
  )
}
