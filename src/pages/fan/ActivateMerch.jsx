import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Loader2 } from 'lucide-react'
import { fanAPI } from '../../services/apiClient'

export default function ActivateMerch() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tagId = params.get('tag') || ''

  const [form, setForm] = useState({ firstName: '', email: '', phone: '', city: '' })
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!agreed) {
      setError('Please accept the consent checkbox to continue.')
      return
    }
    if (!form.firstName || !form.email) {
      setError('First name and email are required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await fanAPI.activate({
        tagId,
        firstName: form.firstName,
        email: form.email,
        phone: form.phone,
        city: form.city,
      })
      navigate('/fan/activated')
    } catch (err) {
      setError(err.message || 'Activation failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MobileShell>
      <div className="mb-8 pt-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Intelimerch"
          className="h-12 w-auto object-contain"
        />
      </div>

      <p className="text-xs font-bold text-primary tracking-widest mb-2">FIRST TAP DETECTED</p>
      <h1 className="text-5xl font-black leading-tight text-gray-900 mb-1">ACTIVATE</h1>
      <h1 className="text-5xl font-black leading-tight mb-4">
        YOUR <span className="text-primary">MERCH</span>
      </h1>
      <p className="text-sm text-gray-600 mb-8 leading-relaxed">
        You're holding something exclusive. Register to unlock perks, drops & direct access to the creator's world.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">First Name</label>
          <input className="input-field" placeholder="e.g. Jenny" value={form.firstName} onChange={set('firstName')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
          <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
          <input className="input-field" type="tel" placeholder="09020666789" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">City / Location</label>
          <input className="input-field" placeholder="Lagos, NG" value={form.city} onChange={set('city')} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-primary shrink-0" />
          <span className="text-sm text-gray-600">
            I agree to receive updates from this creator and understand my data is handled per their Privacy Policy.
          </span>
        </label>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary rounded-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          Activate Merch
        </button>
      </div>
    </MobileShell>
  )
}
