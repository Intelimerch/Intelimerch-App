import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../../components/AuthCard'
import { HelpCircle, MessageSquare, ArrowLeft, Home, Loader2, AlertCircle } from 'lucide-react'
import { authAPI } from '../../services/apiClient'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Please enter your email.')
    
    setLoading(true)
    setError('')
    try {
      await authAPI.requestPasswordOtp(email.trim())
      // Pass the email to the next step via state
      navigate('/verify', { state: { email: email.trim(), flow: 'reset-password' } })
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <HelpCircle size={28} className="text-gray-500" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Forgot Password?</h1>
      <p className="text-gray-500 text-sm text-center mb-6">No worries, we'll help you reset it.</p>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-6">
        <StepCircle num={1} active label="Email" />
        <div className="h-px w-10 bg-gray-200" />
        <StepCircle num={2} label="Verify" />
        <div className="h-px w-10 bg-gray-200" />
        <StepCircle num={3} label="Reset" />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input 
            type="email"
            className="input-field" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={16} />}
          {loading ? 'Sending...' : 'Send OTP'}
        </button>

        <button type="button" onClick={() => navigate('/signin')} className="flex items-center gap-2 text-sm text-gray-700 font-medium mx-auto hover:text-gray-900 mt-4">
          <ArrowLeft size={16} /> Back to Login
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Home size={13} className="inline text-primary mr-1" />
          <em>Need help? </em>
          <span className="text-primary font-semibold cursor-pointer">Contact Support</span>
        </p>
      </form>
    </AuthCard>
  )
}

function StepCircle({ num, active, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
        active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {num}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}