import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { useState } from 'react'
import usePerk, { perkValues } from './usePerk'

export default function DiscountPerk() {
  const navigate = useNavigate()
  const perk = usePerk()
  const [copied, setCopied] = useState(false)

  const { name, description } = perkValues(perk, {
    name: 'Discount Code',
    description: 'Tap the code to copy it. Valid on the current collection.',
  })

  const code = (perk?.discountCode || '').trim()

  const copy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Discount Code</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
        <p className="text-sm text-gray-500 mb-5">{description}</p>

        {code ? (
          <>
            <button onClick={copy}
              className="w-full border-2 border-dashed border-primary rounded-2xl bg-primary-light py-8 flex flex-col items-center justify-center mb-5 hover:bg-primary/10 transition-all">
              <p className="text-xs text-gray-500 mb-1">Your Exclusive Code</p>
              <p className="text-3xl font-black text-gray-900 tracking-widest">{code}</p>
            </button>

            <button onClick={copy} className="btn-primary rounded-full py-3.5 font-bold">
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </>
        ) : (
          <div className="bg-gray-50 rounded-2xl py-8 px-4 flex flex-col items-center text-center">
            <p className="text-sm text-gray-500 mb-2">No discount code on this perk yet.</p>
            <p className="text-xs text-gray-400">Check back soon — the creator may add one later.</p>
          </div>
        )}
      </div>
    </MobileShell>
  )
}
