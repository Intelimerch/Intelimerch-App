import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthCard, { LogoMark } from '../../components/AuthCard'
import { KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { authAPI } from '../../services/apiClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is invalid or missing. Request a new one.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await authAPI.resetPassword(token, newPassword)
      navigate('/signin', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to reset your password. Try requesting a new link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <LogoMark />
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
          <KeyRound size={26} className="text-primary" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Reset Password</h1>
      <p className="text-gray-500 text-sm text-center mb-6">Choose a new password for your account.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!token ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-start gap-3 mb-4">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
          <p className="text-sm">
            This reset link is invalid or has expired.{' '}
            <Link to="/forgot-password" className="font-semibold underline">Request a new one</Link>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 size={16} /> Reset Password</>
            )}
          </button>
        </form>
      )}

      <Link to="/signin" className="flex items-center gap-2 text-sm text-gray-700 font-medium mx-auto mt-5 hover:text-gray-900 w-fit">
        <ArrowLeft size={16} /> Back to Login
      </Link>
    </AuthCard>
  )
}