import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard, { LogoMark } from '../../components/AuthCard'
import { HelpCircle, AlertCircle, CheckCircle2, Loader2, Mail, ArrowLeft } from 'lucide-react'
import { authAPI } from '../../services/apiClient'

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [devLink, setDevLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setDevLink('')

    if (!identifier.trim()) {
      setError('Please enter your email or phone number.')
      return
    }

    setSubmitting(true)
    try {
      const res = await authAPI.forgotPassword(identifier)
      setInfo(res.message || 'If an account exists, a reset link has been generated.')
      if (res.resetLink) {
        setDevLink(res.resetLink)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard>
      <LogoMark />
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <HelpCircle size={28} className="text-gray-500" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Forgot Password?</h1>
      <p className="text-gray-500 text-sm text-center mb-6">No worries, we'll help you reset it.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {info && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-500" />
          <p className="text-sm">{info}</p>
        </div>
      )}

      {devLink && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-4">
          <p className="text-xs font-semibold mb-1">Development mode — no email configured yet. Use this link:</p>
          <a href={devLink} className="text-sm font-mono break-all underline">{devLink}</a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone</label>
          <input
            className="input-field"
            placeholder="Enter your email or phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={submitting || !!info}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting || !!info}>
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Sending...</>
          ) : (
            <><Mail size={16} /> Send Reset Link</>
          )}
        </button>

        <Link to="/signin" className="flex items-center gap-2 text-sm text-gray-700 font-medium mx-auto hover:text-gray-900 w-fit">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </form>
    </AuthCard>
  )
}