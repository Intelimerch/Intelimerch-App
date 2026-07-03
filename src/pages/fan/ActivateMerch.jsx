import { useNavigate } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'

export default function ActivateMerch() {
  const navigate = useNavigate()
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
        You're holding something exclusive. Register to unlock perks, drops & direct access to Jenny's world.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">First Name</label>
          <input className="input-field" placeholder="e.g. Jenny" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
          <input className="input-field" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
          <input className="input-field" type="tel" placeholder="09020666789" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">City / Location</label>
          <input className="input-field" placeholder="Lagos, NG" />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-primary shrink-0" />
          <span className="text-sm text-gray-600">
            I agree to receive updates from this creator and understand my data is handled per their Privacy Policy.
          </span>
        </label>

        <button onClick={() => navigate('/fan/activated')} className="btn-primary rounded-full py-4 text-base font-bold">
          Activate Merch
        </button>
      </div>
    </MobileShell>
  )
}