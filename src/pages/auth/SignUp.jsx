import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthCard, { LogoMark } from '../../components/AuthCard'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

// ─── Professional Error Parser ──────────────────────────
function parseErrorMessage(error) {
  const message = error?.message || ''
  
  // Duplicate key errors
  if (message.includes('E11000') || message.includes('duplicate key')) {
    if (message.includes('userName')) {
      return 'This username is already taken. Please choose a different one.'
    }
    if (message.includes('email')) {
      return 'This email is already registered. Please use a different email or sign in.'
    }
    if (message.includes('phone')) {
      return 'This phone number is already registered. Please use a different number or sign in.'
    }
    return 'This information is already registered. Please use different credentials.'
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('valid')) {
    if (message.includes('email')) {
      return 'Please enter a valid email address.'
    }
    if (message.includes('phone')) {
      return 'Please enter a valid phone number (10 digits after +234).'
    }
    if (message.includes('password')) {
      return 'Password must be at least 8 characters long.'
    }
    return 'Please check your input and try again.'
  }
  
  // Required field errors
  if (message.includes('required')) {
    if (message.includes('firstName')) {
      return 'First name is required.'
    }
    if (message.includes('lastName')) {
      return 'Last name is required.'
    }
    if (message.includes('userName')) {
      return 'Username is required.'
    }
    if (message.includes('password')) {
      return 'Password is required.'
    }
    if (message.includes('email')) {
      return 'Email is required.'
    }
    if (message.includes('phone')) {
      return 'Phone number is required.'
    }
    return 'Please fill in all required fields.'
  }
  
  // Fallback
  return 'Something went wrong. Please try again.'
}

// ─── Main Component ─────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // For phone field, only allow digits and max 10
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // ─── Validations ──────────────────────────────────
    if (!agreed) {
      setError('Please accept the Terms and Conditions')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return
    }

    if (!formData.userName.trim()) {
      setError('Username is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    // ─── Phone Validation ──────────────────────────────
    const phone = formData.phone.trim()

    if (!phone) {
      setError('Phone number is required')
      return
    }

    if (phone.length !== 10) {
      setError('Please enter exactly 10 digits after +234 (e.g. 8012345678)')
      return
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter only numbers (e.g. 8012345678)')
      return
    }

    // ─── Build full phone number ──────────────────────
    const fullPhoneNumber = `234${phone}`

    setIsLoading(true)

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        phone: fullPhoneNumber,
        password: formData.password,
      }

      if (formData.middleName.trim()) {
        payload.middleName = formData.middleName.trim()
      }

      console.log('📤 Sending payload:', payload)

      const response = await register(payload)
      console.log('✅ Registration response:', response)

      navigate('/verify', { state: { email: formData.email } })
    } catch (err) {
      console.error('❌ Registration error:', err)
      const userFriendlyMessage = parseErrorMessage(err)
      setError(userFriendlyMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <LogoMark />
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Create Account</h1>
      <p className="text-gray-500 text-sm text-center mb-6">Start your creator journey with us</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ─── Error Message ──────────────────────────── */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── First Name ─────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            className="input-field w-full"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* ─── Middle Name (Optional) ──────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Middle Name <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            name="middleName"
            className="input-field w-full"
            placeholder="Enter your middle name (optional)"
            value={formData.middleName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        {/* ─── Last Name ────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            className="input-field w-full"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* ─── Username ─────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="userName"
            className="input-field w-full"
            placeholder="Choose a username"
            value={formData.userName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* ─── Email ────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            className="input-field w-full"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* ─── Phone Number with +234 Prefix ───────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium">
              +234
            </span>
            <input
              type="tel"
              name="phone"
              className="input-field w-full rounded-l-none"
              placeholder="8012345678"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              required
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Enter the remaining 10 digits after +234 (e.g. 8012345678)
          </p>
        </div>

        {/* ─── Password ─────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="input-field w-full pr-10"
              placeholder="Create a password (min 8 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
        </div>

        {/* ─── Confirm Password ─────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              className="input-field w-full pr-10"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex="-1"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* ─── Terms & Conditions ───────────────────────── */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-primary shrink-0"
            disabled={isLoading}
          />
          <span className="text-sm text-gray-600">
            I accept the{' '}
            <span className="text-primary font-medium">Terms</span> and{' '}
            <span className="text-primary font-medium">Conditions</span>
          </span>
        </label>

        {/* ─── Submit Button ────────────────────────────── */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* ─── Divider ───────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">Or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ─── Social Buttons ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="border border-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <GoogleIcon />Google
          </button>
          <button
            type="button"
            className="border border-gray-200 rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <AppleIcon />Apple
          </button>
        </div>

        {/* ─── Sign In Link ──────────────────────────────── */}
        <p className="text-center text-sm text-gray-600 font-medium">
          Already have an account?{' '}
          <Link to="/signin" className="text-primary font-semibold">
            Sign In
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

// ─── Google Icon ────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── Apple Icon ──────────────────────────────
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}