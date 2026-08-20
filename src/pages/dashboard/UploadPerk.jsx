import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Video, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { perksAPI, campaignAPI } from '../../services/apiClient'

// Backend enum — must match exactly, lowercase (confirmed via Swagger schema)
const contentTypes = [
  { label: 'Video', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'Link', value: 'link' },
  { label: 'Document', value: 'document' },
  { label: 'Discount', value: 'discount' },
]

// ─── Professional Error Parser ──────────────────────────
function parseErrorMessage(error) {
  const message = error?.message || '';
  
  if (message.includes('E11000') || message.includes('duplicate key')) {
    return 'A perk with this name already exists. Please use a different name.';
  }
  if (message.includes('validation') || message.includes('valid')) {
    if (message.includes('perkCategoryId')) {
      return 'Please select a valid perk category.';
    }
    if (message.includes('contentType')) {
      return 'Please select a valid content type.';
    }
    return 'Please check your input and try again.';
  }
  if (message.includes('discountCode')) {
    return 'Please enter a valid discount code.';
  }
  if (message.includes('required')) {
    if (message.includes('perkName')) return 'Perk name is required.';
    if (message.includes('perkCategoryId')) return 'Please select a perk category.';
    if (message.includes('contentType')) return 'Please select a content type.';
    return 'Please fill in all required fields.';
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to create perks.';
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    return 'Cannot connect to the server. Please check your internet connection.';
  }
  return message || 'An unexpected error occurred. Please try again.';
}

export default function UploadPerk() {
  const navigate = useNavigate()
  const [showTypeDrop, setShowTypeDrop] = useState(false)
  const [showCampDrop, setShowCampDrop] = useState(false)
  const [showCatDrop, setShowCatDrop] = useState(false)

  const [perkName, setPerkName] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [description, setDescription] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState(null)

  // ─── Categories ───
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')

  // ─── Campaigns ───
  const [campaigns, setCampaigns] = useState([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [campaignsError, setCampaignsError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uiError, setUiError] = useState(null)

  // ─── Load Categories ───
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await perksAPI.getCategories()
        setCategories(res.data || [])
      } catch (err) {
        console.error('Failed to load perk categories:', err)
        setCategoriesError('Could not load categories. Please refresh.')
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // ─── Load Campaigns ───
  useEffect(() => {
    async function loadCampaigns() {
      try {
        setLoadingCampaigns(true)
        const res = await campaignAPI.getAll()
        const list = Array.isArray(res.data) ? res.data : (res.data?.campaigns || [])
        setCampaigns(list)
      } catch (err) {
        console.error('Failed to load campaigns:', err)
        setCampaignsError('Could not load campaigns. Please refresh.')
      } finally {
        setLoadingCampaigns(false)
      }
    }
    loadCampaigns()
  }, [])

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    setFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    handleFile(file)
  }

  const handleSubmit = async () => {
    setError('')
    setUiError(null)

    if (!perkName.trim()) {
      setError('Perk name is required')
      return
    }
    if (!selectedCategory) {
      setError('Please choose a perk category')
      return
    }
    if (!selectedType) {
      setError('Please choose a content type')
      return
    }
    if (selectedType.value === 'discount' && !discountCode.trim()) {
      setError('Please enter a discount code')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('perkName', perkName.trim())
      formData.append('perkCategoryId', selectedCategory._id)
      formData.append('contentType', selectedType.value)
      
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      if (selectedType.value === 'discount') {
        formData.append('discountCode', discountCode.trim())
      }
      
      if (selectedCampaign) {
        const campaignId = selectedCampaign._id || selectedCampaign.id
        formData.append('campaignId', campaignId)
      }
      
      // If there's a file, append it (backend supports file upload)
      if (file) {
        formData.append('file', file)
      }

      const response = await perksAPI.create(formData)
      
      navigate('/dashboard/perks')
    } catch (err) {
      console.error('Failed to create perk:', err)
      const friendlyMessage = parseErrorMessage(err)
      setUiError(friendlyMessage)
      setError(friendlyMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Perk</h1>
          <p className="text-gray-500 text-sm">Upload a new perk for your fans</p>
        </div>
        <button onClick={() => navigate('/dashboard/perks')} className="btn-outline w-auto px-5 text-sm">
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="card max-w-4xl">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Perk Details</h2>

        {/* ─── UI Error Display ─── */}
        {uiError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">{uiError}</p>
              <button 
                onClick={() => setUiError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && !uiError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* ─── Perk Name ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Perk Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              placeholder="e.g. Exclusive Behind the Scenes Video"
              value={perkName}
              onChange={(e) => setPerkName(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* ─── Perk Category ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Perk Category <span className="text-red-500">*</span>
            </label>
            {categoriesError ? (
              <p className="text-xs text-red-500">{categoriesError}</p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowCatDrop(!showCatDrop); setShowTypeDrop(false); setShowCampDrop(false) }}
                  className="input-field text-left flex items-center justify-between"
                  disabled={loadingCategories || submitting}
                >
                  <span className={selectedCategory ? 'text-gray-800' : 'text-gray-400'}>
                    {loadingCategories
                      ? 'Loading categories...'
                      : selectedCategory?.name || 'Choose a perk category'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 shrink-0" />
                </button>
                {showCatDrop && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="px-4 py-2.5 text-sm text-gray-400">No categories found</p>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => { setSelectedCategory(cat); setShowCatDrop(false) }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          <div className={`w-4 h-4 border-2 rounded-full shrink-0 ${selectedCategory?._id === cat._id ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Content Type ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Content Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowTypeDrop(!showTypeDrop); setShowCatDrop(false); setShowCampDrop(false) }}
                className="input-field text-left flex items-center justify-between"
                disabled={submitting}
              >
                <span className={selectedType ? 'text-gray-800' : 'text-gray-400'}>
                  {selectedType?.label || 'Choose what kind of exclusive content this perk delivers'}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showTypeDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1">
                  {contentTypes.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setSelectedType(t); setShowTypeDrop(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <div className={`w-4 h-4 border-2 rounded-full ${selectedType?.value === t.value ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Discount Code ─── */}
          {selectedType?.value === 'discount' && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Discount Code <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. SUMMER25"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* ─── Upload File ─── */}
          {selectedType?.value !== 'discount' && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Upload File</label>
            <label
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl py-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragging ? 'border-primary bg-primary-light' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
            >
              <input type="file" className="hidden" onChange={handleFileInput} disabled={submitting} />
              <Video size={18} className="text-primary" />
              <span className="text-sm text-gray-500">
                {fileName || 'Tap to upload, or drag a file here'}
              </span>
            </label>
          </div>
          )}

          {/* ─── Link to Campaign ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Link to Campaign <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {campaignsError ? (
              <p className="text-xs text-red-500">{campaignsError}</p>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowCampDrop(!showCampDrop); setShowTypeDrop(false); setShowCatDrop(false) }}
                  className="input-field text-left flex items-center justify-between"
                  disabled={loadingCampaigns || submitting}
                >
                  <span className={selectedCampaign ? 'text-gray-800' : 'text-gray-400'}>
                    {loadingCampaigns
                      ? 'Loading campaigns...'
                      : selectedCampaign?.campaignName || selectedCampaign?.name || 'Select a campaign to link'}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 shrink-0" />
                </button>
                {showCampDrop && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedCampaign(null); setShowCampDrop(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-400"
                    >
                      None
                    </button>
                    {campaigns.length === 0 ? (
                      <p className="px-4 py-2.5 text-sm text-gray-400">No campaigns found</p>
                    ) : (
                      campaigns.map((c) => {
                        const id = c._id || c.id
                        const name = c.campaignName || c.name
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => { setSelectedCampaign(c); setShowCampDrop(false) }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                          >
                            <div className={`w-4 h-4 border-2 rounded ${selectedCampaign?._id === id || selectedCampaign?.id === id ? 'bg-primary border-primary' : 'border-gray-300'} flex items-center justify-center shrink-0`}>
                              {(selectedCampaign?._id === id || selectedCampaign?.id === id) && <Check size={10} className="text-white" />}
                            </div>
                            {name}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Description ─── */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description (optional)</label>
            <textarea
              className="input-field resize-none h-28"
              placeholder="Describe what fans will get when they unlock this perk..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* ─── Buttons ─── */}
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="btn-primary w-auto px-6 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Upload size={15} /> Save to Library</>
              )}
            </button>
            <button 
              onClick={() => navigate('/dashboard/perks')} 
              disabled={submitting} 
              className="btn-outline w-auto px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}