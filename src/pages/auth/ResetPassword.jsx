import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthCard from '../../components/AuthCard'
import { KeyRound, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { authAPI } from '../../services/apiClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const email = location.state?.email
  const resetToken = location.state?.resetToken

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Protect route if someone navigates here directly
  useEffect(() => {
    if (!email || !resetToken) navigate('/forgot-password')
  }, [email, resetToken, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    setError('')
    
    try {
      await authAPI.resetPassword({
        email,
        resetToken,
        newPassword: password,
        confirmPassword: confirmPassword
      })
      setSuccess(true)
      // Wait 2 seconds, then redirect to login
      setTimeout(() => navigate('/signin'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-sm text-gray-500">Your password has been changed successfully. Redirecting to login...</p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={20} />
      </button>
      
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <KeyRound size={28} className="text-gray-500" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Set New Password</h1>
      <p className="text-gray-500 text-sm text-center mb-6">Must be at least 8 characters.</p>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <input 
            type="password"
            className="input-field" 
            placeholder="Enter new password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input 
            type="password"
            className="input-field" 
            placeholder="Confirm new password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </AuthCard>
  )
}