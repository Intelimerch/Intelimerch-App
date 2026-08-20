import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react'
import usePerk, { perkValues } from './usePerk'

export default function DocumentPerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const { name, description, url } = perkValues(perk, {
    name: 'Exclusive Document',
    description: 'A document unlocked just for you.',
  })

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive Document</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-5">{description}</p>

        {url ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={28} className="text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Exclusive document</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-5 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>This document is still being prepared by the creator.</span>
          </div>
        )}

        <div className="flex gap-3">
          {url ? (
            <>
              <a href={url} download target="_blank" rel="noreferrer"
                className="btn-primary rounded-full py-3.5 font-bold flex-1 flex items-center justify-center gap-2">
                <Download size={18} /> Download
              </a>
              <a href={url} target="_blank" rel="noreferrer"
                className="btn-outline rounded-full py-3.5 w-auto px-5 flex items-center gap-2">
                <ExternalLink size={16} /> View
              </a>
            </>
          ) : (
            <div className="w-full bg-gray-50 text-gray-500 text-sm p-3 rounded-xl text-center">
              Not available yet
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  )
}
