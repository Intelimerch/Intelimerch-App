// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { FormProvider } from './context/FormContext'
import ServerError from './components/ServerError';

// Auth Pages
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyAccount from './pages/auth/VerifyAccount'

// Dashboard Pages (Creator)
import DashboardLayout from './components/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Campaigns from './pages/dashboard/Campaigns'
import CreateCampaign from './pages/dashboard/CreateCampaign'
import NewCampaign from './pages/dashboard/NewCampaign'
import Products from './pages/dashboard/Products'
import AddProduct from './pages/dashboard/AddProduct'
import EditProduct from './pages/dashboard/EditProduct'
import AssignToCampaign from './pages/dashboard/AssignToCampaign'
import PerksLibrary from './pages/dashboard/PerksLibrary'
import UploadPerk from './pages/dashboard/UploadPerk'
import TagGroups from './pages/dashboard/TagGroups'
import Fans from './pages/dashboard/Fans'
import Profile from './pages/dashboard/Profile'
import Notifications from './pages/dashboard/Notifications'

// Fan Pages (Mobile)
import TapEntry from './pages/fan/TapEntry'
import ActivateMerch from './pages/fan/ActivateMerch'
import Activated from './pages/fan/Activated'
import AlreadyClaimed from './pages/fan/AlreadyClaimed'
import PerksLanding from './pages/fan/PerksLanding'
import VideoPerk from './pages/fan/VideoPerk'
import DiscountPerk from './pages/fan/DiscountPerk'
import AudioPerk from './pages/fan/AudioPerk'
import ImagePerk from './pages/fan/ImagePerk'
import DocumentPerk from './pages/fan/DocumentPerk'
import LinkPerk from './pages/fan/LinkPerk'

// New Dashboard Pages
import CampaignAnalytics from './pages/dashboard/CampaignAnalytics'

// Admin Pages
import AdminLayout from './components/AdminLayout'
import AdminOverview from './pages/admin/AdminOverview'
import CreatorsManagement from './pages/admin/CreatorsManagement'
import AdminCampaigns from './pages/admin/AdminCampaigns'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminTags from './pages/admin/AdminTags'
import AdminCreateCampaign from './pages/admin/AdminCreateCampaign'
import AdminSettings from './pages/admin/AdminSettings'
import AdminPerks from './pages/admin/AdminPerks'
import AdminNewCampaign from './pages/admin/AdminNewCampaign'

// 404 Page
import NotFound from './pages/NotFound';

// ─── Protected Route Component ───
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return children
}

// ─── Admin Route Component ───
function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  const accountType = user.accountType || user.role || ''
  const isAdmin = ['ADMIN', 'INTERNAL_TEAM', 'INTERNAL', 'SUPER_ADMIN', 'STAFF'].includes(accountType)

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ─── Global Error Boundary ───
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ServerError onRetry={() => window.location.reload()} />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/signin" replace />} />

              {/* Auth */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify" element={<VerifyAccount />} />

              {/* Creator Dashboard - Protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Overview />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="campaigns/create" element={<CreateCampaign />} />
                <Route path="campaigns/new" element={<NewCampaign />} />
                <Route path="campaigns/:campaignId/analytics" element={<CampaignAnalytics />} />

                <Route path="products" element={<Products />} />
                <Route path="products/add" element={<AddProduct />} />
                <Route path="products/edit/:productId" element={<EditProduct />} />
                <Route path="products/assign/:productId" element={<AssignToCampaign />} />

                <Route path="fans" element={<Fans />} />
                <Route path="perks" element={<PerksLibrary />} />
                <Route path="perks/upload" element={<UploadPerk />} />
                <Route path="tag-groups" element={<TagGroups />} />
                <Route path="profile" element={<Profile />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>

              {/* Fan (mobile) */}
              <Route path="/nfc/io/:tagId" element={<TapEntry />} />
              <Route path="/fan/activate" element={<ActivateMerch />} />
              <Route path="/fan/activated" element={<Activated />} />
              <Route path="/fan/claimed" element={<AlreadyClaimed />} />
              <Route path="/fan/perks" element={<PerksLanding />} />
              <Route path="/fan/perks/video" element={<VideoPerk />} />
              <Route path="/fan/perks/discount" element={<DiscountPerk />} />
              <Route path="/fan/perks/audio" element={<AudioPerk />} />
              <Route path="/fan/perks/image" element={<ImagePerk />} />
              <Route path="/fan/perks/document" element={<DocumentPerk />} />
              <Route path="/fan/perks/link" element={<LinkPerk />} />

              {/* Admin - Protected */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<AdminOverview />} />
                <Route path="creators" element={<CreatorsManagement />} />
                <Route path="campaigns/create" element={<AdminCreateCampaign />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="campaigns/new" element={<AdminNewCampaign />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="perks" element={<AdminPerks />} />
                <Route path="tags" element={<AdminTags />} />
              </Route>

              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </FormProvider>
    </AuthProvider>
  )
}