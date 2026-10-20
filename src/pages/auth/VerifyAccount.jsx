import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthCard from '../../components/AuthCard'
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { authAPI } from '../../services/apiClient'

export default function VerifyAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // State passed from previous step
  const email = location.state?.email
  const flow = location.state?.flow || 'confirm-email' // 'confirm-email' or 'reset-password'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(60)
  const [expired, setExpired] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If someone lands here directly without an email, send them back
  useEffect(() => {
    if (!email) navigate('/forgot-password')
  }, [email, navigate])

  useEffect(() => {
    if (timeLeft <= 0) { setExpired(true); return }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  const handleOtp = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus()
  }

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const handleSubmit = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return setError('Please enter all 6 digits.')
    
    setLoading(true)
    setError('')
    
    try {
      if (flow === 'confirm-email') {
        // POST /auth/confirm-email
        await authAPI.confirmEmail(email, otpString)
        // Typically, email confirmation logs the user in, or sends them to login
        navigate('/signin', { state: { message: 'Email confirmed! Please log in.' } })
      } else {
        // POST /auth/forgot-password/verify-otp
        const res = await authAPI.verifyPasswordOtp(email, otpString)
        
        // The API returns a resetToken
        const resetToken = res.data?.resetToken || res.resetToken
        
        // Pass token and email to the final reset screen
        navigate('/reset-password', { 
          state: { email, resetToken } 
        })
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setTimeLeft(60)
    setExpired(false)
    setOtp(['','','','','',''])
    setError('')
    
    if (flow === 'reset-password') {
      try {
        await authAPI.requestPasswordOtp(email)
      } catch (err) {
        setError('Failed to resend OTP.')
      }
    }
  }

  return (
    <AuthCard>
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
        {flow === 'confirm-email' ? 'Verify Account' : 'Verify Reset'}
      </h1>

      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
          <Mail size={22} className="text-primary" />
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center mb-5">
        We've sent a code to <br/>
        <span className="font-semibold text-gray-900">{email}</span>
      </p>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs font-medium text-gray-600 text-center mb-3">Enter OTP</p>
      <div className="flex justify-center gap-2 mb-4">
        {otp.map((v, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            maxLength={1}
            value={v}
            onChange={e => handleOtp(i, e.target.value)}
            className="w-11 h-12 border border-gray-200 rounded-xl text-center text-lg font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        ))}
      </div>

      <p className="text-xs text-center text-gray-500 mb-4">
        ⏱ Time remaining:{' '}
        <span className="text-primary font-semibold">{fmt(timeLeft)}</span>
      </p>

      <button 
        onClick={handleSubmit} 
        disabled={loading || otp.join('').length !== 6}
        className="btn-primary mb-3 w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      {expired ? (
        <button onClick={resend} className="text-primary font-semibold text-sm text-center w-full hover:underline">
          Resend OTP
        </button>
      ) : (
        <p className="text-xs text-gray-500 text-center">
          Didn't receive code? Resend in: {fmt(timeLeft)}
        </p>
      )}
    </AuthCard>
  )
}