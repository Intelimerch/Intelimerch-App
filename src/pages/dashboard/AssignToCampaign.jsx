import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, ChevronDown, Link } from 'lucide-react'
import { productAPI, campaignAPI, tiersAPI } from '../../services/apiClient'

// ─── Hardcoded tiers as fallback ───
const FALLBACK_TIERS = [
  { _id: '6a5f4c406eec4d7749091fc5', name: '1', label: 'Supporter' },
  { _id: '6a5f4cff56d1060a3b050298', name: '2', label: 'Insider' },
  { _id: '6a5f4d0656d1060a3b050299', name: '3', label: 'Superfan' },
  { _id: '6a5f4d0d56d1060a3b05029a', name: '4', label: 'Inner Circle' },
]

function parseErrorMessage(error) {
  const message = error?.message || ''
  if (message.includes('Invalid ObjectId')) {
    return 'Something is wrong with a selected value. Please re-select the campaign and tier.'
  }
  if (message.includes('401') || message.includes('Unauthorized')) return 'Your session has expired. Please log in again.'
  if (message.includes('403') || message.includes('Forbidden')) return "You don't have permission to assign products."
  if (message.includes('404') || message.includes('Not Found')) return "The product you're trying to assign no longer exists."
  return message || 'An unexpected error occurred. Please try again.'
}

function getTierLabel(tier) {
  if (tier?.label) return tier.label
  if (tier?.name) {
    const labelMap = { '1': 'Supporter', '2': 'Insider', '3': 'Superfan', '4': 'Inner Circle' }
    return labelMap[tier.name] || tier.name
  }
  if (tier?.tierName) {
    const labelMap = { '1': 'Supporter', '2': 'Insider', '3': 'Superfan', '4': 'Inner Circle' }
    return labelMap[tier.tierName] || tier.tierName
  }
  return tier?.tier || 'Tier'
}

export default function AssignToCampaign() {
  const navigate = useNavigate()
  const { productId } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const [product, setProduct] = useState(null)
  const [variantId, setVariantId] = useState(null)
  const [realProductId, setRealProductId] = useState(null)
  const [productName, setProductName] = useState('')

  const [formData, setFormData] = useState({
    campaignId: '',
    tierId: '',
  })

  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [showCampaignDrop, setShowCampaignDrop] = useState(false)
  const [showTierDrop, setShowTierDrop] = useState(false)

  const [isProductInCampaign, setIsProductInCampaign] = useState(false)

  // ─── Tiers state ───
  const [tiers, setTiers] = useState(FALLBACK_TIERS)
  const [loadingTiers, setLoadingTiers] = useState(true)

  // ─── Load Tiers ───
  useEffect(() => {
    async function loadTiers() {
      try {
        const res = await tiersAPI.getAll()
        if (res.data && res.data.length > 0) {
          const mappedTiers = res.data.map(tier => ({
            ...tier,
            label: getTierLabel(tier)
          }))
          setTiers(mappedTiers)
        }
      } catch (err) {
        console.warn('Failed to load tiers, using fallback:', err)
      } finally {
        setLoadingTiers(false)
      }
    }
    loadTiers()
  }, [])

  // ─── Load Product and Campaigns ───
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const campaignRes = await campaignAPI.getAll()
        const campaignList = Array.isArray(campaignRes.data) ? campaignRes.data : (campaignRes.data?.campaigns || [])
        setCampaigns(campaignList)
        setLoadingCampaigns(false)

        const productRes = await productAPI.getAll()
        const list = Array.isArray(productRes.data) ? productRes.data : []

        const found = list.find(p => p._id === productId || p.product?._id === productId || p.productId === productId)

        if (!found) {
          setApiError('Product not found')
          setLoading(false)
          return
        }

        setProduct(found)
        setVariantId(found._id)
        setRealProductId(found.product?._id || found.productId)
        setProductName(found.product?.productName || found.productName || 'Unnamed Product')

        // ─── Check if already in a campaign ───
        const existingCampaignId = found.campaignId || found.campaign?._id || ''
        if (existingCampaignId) {
          setFormData(prev => ({ ...prev, campaignId: existingCampaignId }))
          setIsProductInCampaign(true)
          const existingTierId = found.tierId || found.campaign?.tierId || ''
          if (existingTierId) {
            setFormData(prev => ({ ...prev, tierId: existingTierId }))
          }
        }

        console.log('Product loaded for assignment:', found)

      } catch (err) {
        console.error('Error loading data:', err)
        setApiError(parseErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    if (productId) loadData()
  }, [productId])

  // ─── Check if product is already in the selected campaign ───
  useEffect(() => {
    async function check() {
      if (!realProductId || !formData.campaignId) {
        setIsProductInCampaign(false)
        return
      }
      try {
        const res = await productAPI.checkCampaignProduct(realProductId, formData.campaignId)
        if (res.data) {
          setIsProductInCampaign(true)
          if (res.data.tierId) {
            setFormData(prev => ({ ...prev, tierId: res.data.tierId }))
          }
        } else {
          setIsProductInCampaign(false)
        }
      } catch (err) {
        console.error('Error checking campaign product:', err)
        setIsProductInCampaign(false)
      }
    }
    check()
  }, [formData.campaignId, realProductId])

  const selectedCampaign = campaigns.find(c => (c._id || c.id) === formData.campaignId)
  const selectedTier = tiers.find(t => (t._id || t.id) === formData.tierId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }))
    if (apiError) setApiError(null)
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setApiError(null)
    setSuccess(false)

    // ─── Validate ───
    if (!formData.campaignId) {
      setFieldErrors({ campaignId: 'Please select a campaign' })
      return
    }
    if (!formData.tierId) {
      setFieldErrors({ tierId: 'Please select a tier' })
      return
    }

    setSaving(true)
    try {
      await productAPI.assignToCampaign(variantId, {
        campaignId: formData.campaignId,
        tierId: formData.tierId,
        variantId,
      })
      console.log('Product assigned to campaign')

      setSuccess(true)
      setTimeout(() => navigate('/dashboard/products'), 1200)
    } catch (err) {
      console.error('Error assigning product:', err)
      setApiError(parseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const renderError = (field) =>
    fieldErrors[field] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[field]}</span>
      </div>
    ) : null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard/products')} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign to Campaign</h1>
          <p className="text-gray-500 text-sm">
            Assign <span className="font-medium text-gray-800">{productName}</span> to a campaign
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {apiError && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>Product assigned successfully! Redirecting...</span>
            </div>
          )}

          {/* Product Name - Read Only */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Product</label>
            <div className="input-field w-full bg-gray-50 cursor-not-allowed">
              <span className="text-gray-700">{productName}</span>
            </div>
          </div>

          {/* Campaign - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Select Campaign <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowCampaignDrop(o => !o); setShowTierDrop(false) }}
                disabled={loadingCampaigns || saving || success}
                className={`input-field w-full text-left flex items-center justify-between ${fieldErrors.campaignId ? 'border-red-500' : ''}`}
              >
                <span className={selectedCampaign || formData.campaignId ? 'text-gray-800' : 'text-gray-400'}>
                  {loadingCampaigns ? 'Loading campaigns...' : (selectedCampaign?.campaignName || selectedCampaign?.name || 'Select a campaign')}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showCampaignDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                  {campaigns.map((c) => {
                    const id = c._id || c.id
                    return (
                      <button 
                        key={id} 
                        type="button" 
                        onClick={() => { setFormData(f => ({ ...f, campaignId: id })); setShowCampaignDrop(false) }} 
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                      >
                        {c.campaignName || c.name}
                      </button>
                    )
                  })}
                  {campaigns.length === 0 && (
                    <p className="px-4 py-2.5 text-sm text-gray-400">No campaigns available</p>
                  )}
                </div>
              )}
            </div>
            {renderError('campaignId')}
            {isProductInCampaign && formData.campaignId && (
              <p className="text-xs text-green-600 mt-1">This product is already linked to this campaign.</p>
            )}
          </div>

          {/* Product Tier - Only appears after campaign is selected */}
          {formData.campaignId && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Product Tier <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTierDrop(o => !o)}
                  disabled={isProductInCampaign || loadingTiers || saving || success}
                  className={`input-field w-full text-left flex items-center justify-between ${fieldErrors.tierId ? 'border-red-500' : ''} ${isProductInCampaign ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <span className={selectedTier || formData.tierId ? 'text-gray-800' : 'text-gray-400'}>
                    {loadingTiers ? 'Loading tiers...' : (selectedTier?.label || 'Product Tier')}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 shrink-0" />
                </button>
                {showTierDrop && !isProductInCampaign && !loadingTiers && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1">
                    {tiers.map(t => {
                      const id = t._id || t.id
                      const label = t.label || t.name || t.tierName || t.tier
                      return (
                        <button key={id} type="button" onClick={() => { setFormData(f => ({ ...f, tierId: id })); setShowTierDrop(false) }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
                {loadingTiers && (
                  <p className="text-xs text-gray-400 mt-1">Loading tiers...</p>
                )}
              </div>
              {renderError('tierId')}
              {isProductInCampaign && (
                <p className="text-xs text-green-600 mt-1">This product is already linked — tier is locked.</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard/products')} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || success} className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Assigning...</> : success ? <><CheckCircle size={18} /> Assigned!</> : <><Link size={18} /> Assign to Campaign</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}