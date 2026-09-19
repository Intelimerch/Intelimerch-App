// src/pages/admin/AdminSettings.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Plus, Trash2, Loader2, AlertCircle, CheckCircle, 
  Shield, Mail, User, Lock, Bell, ChevronDown, X, Save
} from 'lucide-react'
import { adminAPI } from '../../services/apiClient'
import { useFormPersistence } from '../../hooks/useFormPersistence'
import { useAuth } from '../../context/AuthContext'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { user } = useAuth() // ✅ Get logged-in admin user
  const [activeSection, setActiveSection] = useState('staff')
  
  const [staff, setStaff] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffError, setStaffError] = useState(null)
  
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ─── Profile Form (Populated from auth user) ───
  const [profileForm, setProfileForm, clearProfileForm] = useFormPersistence("admin_profile", {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  // ─── Load ONLY Staff / Admins (NOT Artists) ───
  const loadStaff = async () => {
    try {
      setLoadingStaff(true)
      setStaffError(null)
      
      const res = await adminAPI.getCreators()
      const list = Array.isArray(res.data) ? res.data : (res.data?.creators || [])
      
      // ✅ Filter ONLY for admin-like accounts (NOT artists)
      const adminStaff = list.filter(u => {
        const type = (u.accountType || u.role || u.userType || '').toUpperCase()
        return type === 'ADMIN' || 
               type === 'INTERNAL_TEAM' || 
               type === 'INTERNAL' || 
               type === 'SUPER_ADMIN' || 
               type === 'STAFF'
      })
      
      // ✅ If no admin-like accounts found, show empty state (NOT all users)
      setStaff(adminStaff)
    } catch (err) {
      console.error('Failed to load staff:', err)
      setStaffError(err.message || 'Failed to load staff')
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  // ─── Add Staff Form ───
  const [staffForm, setStaffForm, clearStaffForm] = useFormPersistence("admin_add_staff", {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roleId: 'ADMIN',
  })

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    // Validate
    if (staffForm.password !== staffForm.confirmPassword) {
      setSubmitError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        userName: staffForm.userName,
        email: staffForm.email,
        phone: staffForm.phone,
        roleId: staffForm.roleId,
        password: staffForm.password,
      }

      console.log('📤 Registering staff:', payload)
      
      await adminAPI.registerStaff(payload)
      
      setSubmitSuccess(true)
      clearStaffForm()
      
      setTimeout(() => {
        setShowAddStaff(false)
        setSubmitSuccess(false)
        loadStaff()
      }, 1500)
    } catch (err) {
      console.error('Failed to register staff:', err)
      setSubmitError(err.message || 'Failed to register staff')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return
    try {
      await adminAPI.deleteCreator(id)
      setStaff(staff.filter(s => (s._id || s.id) !== id))
      alert('Staff member removed successfully!')
    } catch (err) {
      alert(err.message || 'Failed to remove staff member')
    }
  }

  // ─── Save Profile ───
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileSaved(false)
    try {
      // TODO: Call your profile update API here
      console.log('📤 Saving profile:', profileForm)
      
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // ─── Section Components ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your admin account, staff, and preferences</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveSection('staff')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'staff' 
              ? 'bg-primary text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={16} className="inline mr-1.5" /> Staff Management
        </button>
        <button
          onClick={() => setActiveSection('profile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'profile' 
              ? 'bg-primary text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <User size={16} className="inline mr-1.5" /> Profile
        </button>
        <button
          onClick={() => setActiveSection('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'notifications' 
              ? 'bg-primary text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bell size={16} className="inline mr-1.5" /> Notifications
        </button>
      </div>

      {/* ─── STAFF MANAGEMENT SECTION ─── */}
      {activeSection === 'staff' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Staff & Admins</h2>
              <p className="text-gray-500 text-sm">Manage platform administrators and staff members</p>
            </div>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              {showAddStaff ? <X size={16} /> : <Plus size={16} />}
              {showAddStaff ? 'Cancel' : 'Add Staff'}
            </button>
          </div>

          {/* Add Staff Form */}
          {showAddStaff && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Add New Admin/Staff</h3>
              
              {submitError && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitSuccess && (
                <div className="mb-4 bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <span>Staff member added successfully!</span>
                </div>
              )}

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. John"
                      value={staffForm.firstName}
                      onChange={(e) => setStaffForm({...staffForm, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      value={staffForm.lastName}
                      onChange={(e) => setStaffForm({...staffForm, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. johndoe"
                    value={staffForm.userName}
                    onChange={(e) => setStaffForm({...staffForm, userName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Role</label>
                  <select
                    value={staffForm.roleId}
                    onChange={(e) => setStaffForm({...staffForm, roleId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="INTERNAL_TEAM">Internal Team</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      placeholder="Create password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={staffForm.confirmPassword}
                      onChange={(e) => setStaffForm({...staffForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : <><Plus size={16} /> Add Staff</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff List - Only Shows REAL Staff/Admins */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingStaff ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center">
                        <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Loading staff...</p>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center">
                        <div className="flex flex-col items-center">
                          <Shield size={32} className="text-gray-300 mb-2" />
                          <p className="text-gray-400">No staff members found</p>
                          <p className="text-xs text-gray-300">Click "Add Staff" to add the first admin</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => {
                      const id = s._id || s.id
                      const name = s.firstName || s.name || s.userName || 'Unknown'
                      const email = s.email || 'No email'
                      const role = s.accountType || s.role || 'STAFF'
                      const isActive = s.status === 'Active' || s.accountStatus === 'ACTIVE'
                      
                      return (
                        <tr key={id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-4 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{name[0]?.toUpperCase()}</span>
                              </div>
                              {name}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{email}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                              <Shield size={12} className="mr-1" /> {role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleDeleteStaff(id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROFILE SECTION (Populated from Auth) ─── */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Admin Profile</h2>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {savingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : profileSaved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">First Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="First Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Last Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Last Name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS SECTION ─── */}
      {activeSection === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive email updates about platform activity</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded accent-primary" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">New Creator Signups</p>
                <p className="text-xs text-gray-500">Get notified when a new creator registers</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded accent-primary" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">Campaign Updates</p>
                <p className="text-xs text-gray-500">Get notified about campaign performance</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded accent-primary" defaultChecked />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}