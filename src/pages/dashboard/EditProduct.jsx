import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle, ChevronDown, X } from 'lucide-react'
import { productAPI, campaignAPI } from '../../services/apiClient'

// ─── Professional Error Parser ──────────────────────────
function parseErrorMessage(error) {
  const message = error?.message || '';
  
  if (message.includes('E11000') || message.includes('duplicate key')) {
    if (message.includes('productName')) {
      return 'A product with this name already exists. Please use a different name.';
    }
    if (message.includes('code')) {
      return 'This product code is already in use. Please use a different code.';
    }
    return 'This product already exists. Please check your details and try again.';
  }

  if (message.includes('Cannot read properties of null') || message.includes("'_id'")) {
    if (message.includes('campaign')) {
      return 'The selected campaign could not be found. Please try selecting it again.';
    }
    if (message.includes('tier') || message.includes('Tier')) {
      return 'Please enter a valid product tier name.';
    }
    return 'Something went wrong. Please try again.';
  }

  if (message.includes('validation') || message.includes('valid')) {
    if (message.includes('campaignId') && message.includes('ObjectId')) {
      return 'The selected campaign ID is not valid. Please select a campaign from the list.';
    }
    if (message.includes('productTier')) {
      return 'Please enter a valid product tier name.';
    }
    return 'Please check your input and try again.';
  }

  if (message.includes('required')) {
    if (message.includes('productName')) return 'Product name is required.';
    if (message.includes('productType')) return 'Product type is required.';
    if (message.includes('color')) return 'Color is required.';
    if (message.includes('size')) return 'Size is required.';
    if (message.includes('campaign')) return 'Please select a campaign.';
    if (message.includes('tier')) return 'Product tier is required when linking to a campaign.';
    return 'Please fill in all required fields.';
  }

  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to edit products.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The product you\'re trying to edit no longer exists.';
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    return 'Cannot connect to the server. Please check your internet connection.';
  }

  return message || 'An unexpected error occurred. Please try again.';
}

// ─── Validation ──────────────────────────────────────────
function validateProduct(data) {
  const errors = {}

  if (!data.productName || data.productName.trim().length === 0) {
    errors.productName = 'Product name is required'
  } else if (data.productName.trim().length < 2) {
    errors.productName = 'Product name must be at least 2 characters'
  }

  if (!data.productType || data.productType.trim().length === 0) {
    errors.productType = 'Product type is required'
  } else if (data.productType.trim().length < 2) {
    errors.productType = 'Product type must be at least 2 characters'
  }

  if (!data.color || data.color.trim().length === 0) {
    errors.color = 'Color is required'
  } else if (data.color.trim().length > 50) {
    errors.color = 'Color cannot exceed 50 characters'
  }

  if (!data.size || data.size.trim().length === 0) {
    errors.size = 'Size is required'
  } else if (data.size.trim().length > 20) {
    errors.size = 'Size cannot exceed 20 characters'
  }

  if (data.description && data.description.trim().length > 500) {
    errors.description = 'Description cannot exceed 500 characters'
  }

  if (data.productTier && data.productTier.trim().length > 50) {
    errors.productTier = 'Product tier cannot exceed 50 characters'
  }

  return errors
}

export default function EditProduct() {
  const navigate = useNavigate()
  const { productId } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [product, setProduct] = useState(null)

  const [formData, setFormData] = useState({
    productName: '',
    productType: '',
    description: '',
    color: '',
    size: '',
    campaignId: '',
    productTier: '',
  })

  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [showCampaignDrop, setShowCampaignDrop] = useState(false)

  // ─── Load Product and Campaigns ───
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Fetch campaigns
        const campaignRes = await campaignAPI.getAll()
        const campaignList = Array.isArray(campaignRes.data) ? campaignRes.data : (campaignRes.data?.campaigns || [])
        setCampaigns(campaignList)
        setLoadingCampaigns(false)

        // Fetch product
        const productRes = await productAPI.getAll()
        let productList = []
        if (Array.isArray(productRes.data)) {
          productList = productRes.data
        } else if (Array.isArray(productRes)) {
          productList = productRes
        } else if (productRes.data?.products) {
          productList = productRes.data.products
        } else {
          productList = productRes || []
        }

        const foundProduct = productList.find(p => 
          (p.id === productId || p.productId === productId || p._id === productId)
        )

        if (!foundProduct) {
          setApiError('Product not found')
          setLoading(false)
          return
        }

        setProduct(foundProduct)

        // ─── PRE-FILL ALL FIELDS ───
        // Map the API response to form fields
        setFormData({
          productName: foundProduct.productName || foundProduct.name || '',
          productType: foundProduct.productType || foundProduct.type || foundProduct.productCategory || '',
          description: foundProduct.description || foundProduct.productDescription || '',
          color: foundProduct.color || '',
          size: foundProduct.size || '',
          campaignId: foundProduct.campaignId || foundProduct.campaign?._id || '',
          productTier: foundProduct.productTier || foundProduct.tier || '',
        })


      } catch (err) {
        console.error('Error loading product:', err)
        setApiError(parseErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadData()
    }
  }, [productId])

  const selectedCampaign = campaigns.find(c => (c._id || c.id) === formData.campaignId)

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

    const errors = validateProduct(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstErrorField = Object.keys(errors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      if (element) element.focus()
      return
    }

    setSaving(true)
    try {
      const payload = {
        productName: formData.productName.trim(),
        productType: formData.productType.trim(),
        description: formData.description.trim() || '',
        color: formData.color.trim(),
        size: formData.size.trim(),
      }

      if (formData.campaignId && formData.productTier.trim()) {
        payload.campaignId = formData.campaignId
        payload.productTier = formData.productTier.trim()
      }

      const response = await productAPI.update(productId, payload)

      setSuccess(true)

      setTimeout(() => {
        navigate('/dashboard/products')
      }, 1500)
    } catch (err) {
      console.error('❌ Error updating product:', err)
      const friendlyMessage = parseErrorMessage(err)
      setApiError(friendlyMessage)
    } finally {
      setSaving(false)
    }
  }

  const renderError = (fieldName) =>
    fieldErrors[fieldName] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[fieldName]}</span>
      </div>
    ) : null

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading product...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">Update your product details</p>
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
              <span>Product updated successfully! Redirecting...</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productName"
              className={`input-field w-full ${fieldErrors.productName ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. Classic Logo Tee"
              value={formData.productName}
              onChange={handleChange}
              disabled={saving || success}
            />
            {renderError('productName')}
          </div>

          {/* Product Type / Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Product Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productType"
              className={`input-field w-full ${fieldErrors.productType ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g. T-Shirt, Hoodie, Cap"
              value={formData.productType}
              onChange={handleChange}
              disabled={saving || success}
            />
            {renderError('productType')}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description</label>
            <textarea
              name="description"
              className={`input-field w-full resize-none h-24 ${fieldErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Describe your product..."
              value={formData.description}
              onChange={handleChange}
              disabled={saving || success}
            />
            {renderError('description')}
            <p className="text-xs text-gray-400 mt-1">Maximum 500 characters</p>
          </div>

          {/* Color & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="color"
                className={`input-field w-full ${fieldErrors.color ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Black, White"
                value={formData.color}
                onChange={handleChange}
                disabled={saving || success}
              />
              {renderError('color')}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="size"
                className={`input-field w-full ${fieldErrors.size ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. S, M, L, XL"
                value={formData.size}
                onChange={handleChange}
                disabled={saving || success}
              />
              {renderError('size')}
            </div>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Link to Campaign <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCampaignDrop(!showCampaignDrop)}
                disabled={loadingCampaigns || saving || success}
                className="input-field w-full text-left flex items-center justify-between"
              >
                <span className={selectedCampaign ? 'text-gray-800' : 'text-gray-400'}>
                  {loadingCampaigns
                    ? 'Loading campaigns...'
                    : selectedCampaign?.campaignName || selectedCampaign?.name || 'Select a campaign'}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showCampaignDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setFormData(f => ({ ...f, campaignId: '' })); setShowCampaignDrop(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-400"
                  >
                    None
                  </button>
                  {campaigns.length === 0 ? (
                    <p className="px-4 py-2.5 text-sm text-gray-400">No campaigns found</p>
                  ) : (
                    campaigns.map((c) => {
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
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Tier */}
          {formData.campaignId && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Product Tier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productTier"
                className={`input-field w-full ${fieldErrors.productTier ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="e.g. Premium, Standard"
                value={formData.productTier}
                onChange={handleChange}
                disabled={saving || success}
              />
              {renderError('productTier')}
              <p className="text-xs text-amber-600 mt-1">
                Required when linked to a campaign. Must match an existing tier name.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/products')}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || success}
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : success ? (
                <><CheckCircle size={18} /> Saved!</>
              ) : (
                <><Save size={18} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}