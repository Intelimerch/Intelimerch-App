import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'
import usePerk, { perkValues } from './usePerk'

export default function LinkPerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const [copied, setCopied] = useState(false)

  const { name, description, url } = perkValues(perk, {
    name: 'VIP Access Link',
    description: 'Your exclusive access link — tap to visit, valid for this drop only.',
  })

  const target = url || ''

  const copy = () => {
    if (!target) return
    navigator.clipboard.writeText(target)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive Access</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-5">{description}</p>

        {target ? (
          <>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-5">
              <p className="text-xs text-gray-400 mb-2">Your Exclusive Link</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <ExternalLink size={14} className="text-purple-500" />
                </div>
                <p className="text-sm font-mono text-purple-700 font-semibold truncate flex-1">{target}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <a href={target} target="_blank" rel="noreferrer"
                className="btn-primary rounded-full py-3.5 font-bold flex-1 flex items-center justify-center gap-2">
                <ExternalLink size={18} /> Open Link
              </a>
              <button onClick={copy} className="btn-outline rounded-full py-3.5 w-auto px-5 flex items-center gap-2">
                {copied ? <><Check size={16} className="text-green-500" /> Copied</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-2xl py-8 px-4 flex flex-col items-center text-center">
            <AlertCircle size={20} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">This link is still being prepared by the creator.</p>
            <p className="text-xs text-gray-400">Check back soon.</p>
          </div>
        )}
      </div>
    </MobileShell>
  )
}
