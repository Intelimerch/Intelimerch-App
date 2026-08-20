import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { useState } from 'react'
import { SkipBack, SkipForward, Play, Pause, AlertCircle } from 'lucide-react'
import usePerk, { perkValues } from './usePerk'

const tracks = [
  { num: 1, title: 'Golden Hours', duration: '03.07' },
  { num: 2, title: 'Slow Motion', duration: '03.07' },
  { num: 3, title: 'Running Low', duration: '03.07' },
  { num: 4, title: 'After Glow', duration: '03.07' },
]

export default function AudioPerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(2)

  const { name, description, url } = perkValues(perk, {
    name: 'Exclusive EP',
    description: 'A few exclusive tracks, just for you.',
  })

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive Audio</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-5">{description}</p>

        {url ? (
          <audio controls className="w-full mb-5">
            <source src={url} />
            Your browser does not support audio playback.
          </audio>
        ) : (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>This audio is still being prepared by the creator.</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <div className="flex items-end gap-0.5 h-14 mb-3">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.4) * 15 + Math.random() * 20
              return (
                <div key={i} className={`flex-1 rounded-full ${i < 15 ? 'bg-gray-300' : 'bg-gray-200'}`}
                  style={{ height: `${h}px` }} />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>00.00</span><span>03.07</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-5">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <SkipBack size={16} className="text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 text-xs font-bold text-gray-600">-15s</button>
          <button onClick={() => setPlaying(!playing)}
            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark">
            {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 text-xs font-bold text-gray-600">+15s</button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <SkipForward size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          {tracks.map(t => (
            <button key={t.num} onClick={() => setActive(t.num)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${active === t.num ? 'bg-primary-light' : 'hover:bg-gray-50'}`}>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${active === t.num ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>{t.num}</span>
              <span className={`flex-1 text-sm font-medium ${active === t.num ? 'text-primary' : 'text-gray-700'}`}>{t.title}</span>
              <span className="text-xs text-gray-400">{t.duration}</span>
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  )
}
