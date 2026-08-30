// src/pages/admin/AdminCreateCampaign.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Check,
} from "lucide-react";
import { campaignAPI, perksAPI } from "../../services/apiClient"; // ✅ Use campaignAPI

const mediaTypes = ["image", "video", "link"];

function validateCampaign(data) {
  const errors = {};
  if (!data.campaignName || data.campaignName.trim().length === 0) {
    errors.campaignName = "Campaign name is required";
  } else if (data.campaignName.trim().length < 2) {
    errors.campaignName = "Campaign name must be at least 2 characters";
  }
  if (!data.startDate) errors.startDate = "Start date is required";
  if (!data.endDate) errors.endDate = "End date is required";
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.endDate = "End date must be after start date";
  }
  if (!data.selectedPerkIds || data.selectedPerkIds.length === 0) {
    errors.perks = "Select at least one perk";
  }
  return errors;
}

export default function AdminCreateCampaign() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaFileName, setMediaFileName] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const [perks, setPerks] = useState([]);
  const [selectedPerkIds, setSelectedPerkIds] = useState([]);
  const [perksOpen, setPerksOpen] = useState(false);
  const [loadingPerks, setLoadingPerks] = useState(true);

  // ─── Load Perks (same as existing) ───
  useEffect(() => {
    async function loadPerks() {
      try {
        const res = await perksAPI.getAll();
        setPerks(res.data || []);
      } catch (err) {
        console.error("Failed to load perks:", err);
      } finally {
        setLoadingPerks(false);
      }
    }
    loadPerks();
  }, []);

  const togglePerk = (id) => {
    setSelectedPerkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleChange = (field, value) => {
    const setters = {
      campaignName: setCampaignName,
      status: setStatus,
      startDate: setStartDate,
      endDate: setEndDate,
      mediaType: setMediaType,
      mediaUrl: setMediaUrl,
    };
    if (setters[field]) setters[field](value);
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    if (apiError) setApiError(null);
    if (success) setSuccess(false);
  };

  const buildDummyMediaUrl = (name) =>
    `https://placeholder.intelimerch.com/pending-upload/${encodeURIComponent(name || "campaign-media")}`;

  

const handleSubmit = async (e) => {
  e.preventDefault()
  setFieldErrors({})
  setApiError(null)
  setSuccess(false)

  const errors = validateCampaign({ campaignName, startDate, endDate, selectedPerkIds })
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }

  // Resolve mediaUrl BEFORE building payload — backend requires it to always be defined
  let resolvedMediaUrl = 'https://placeholder.intelimerch.com/campaign-default.jpg'
  if (mediaType === 'link' && mediaUrl) {
    resolvedMediaUrl = mediaUrl
  } else if ((mediaType === 'image' || mediaType === 'video') && mediaFileName) {
    resolvedMediaUrl = buildDummyMediaUrl(mediaFileName)
  }

  setLoading(true)
  try {
    const payload = {
      campaignName: campaignName.trim(),
      perks: selectedPerkIds, // ✅ Array of ObjectIds (strings)
      startDate: new Date(startDate).toISOString(), // ✅ ISO format
      endDate: new Date(endDate).toISOString(), // ✅ ISO format
      mediaType,
      mediaUrl: resolvedMediaUrl,
      status, // ✅ lowercase: 'active', 'draft', etc.
    }

    console.log('📤 Admin sending payload:', payload)

    // ✅ Use campaignAPI.create() (POST /campaigns) - This endpoint works!
    const response = await campaignAPI.create(payload)
    console.log('✅ Admin campaign created:', response)
    setSuccess(true)

    const newCampaignId =
      response.campaign?._id ||
      response.campaign?.id ||
      response.data?._id ||
      response.data?.campaignId ||
      response._id

    setTimeout(() => {
      // ✅ Navigate to AdminNewCampaign (the edit page)
      navigate('/admin/campaigns/new', {
        state: { campaignId: newCampaignId, campaignName: campaignName.trim() }
      })
    }, 1000)
  } catch (err) {
    console.error('❌ Error creating campaign:', err)
    setApiError(err.message || 'Failed to create campaign')
  } finally {
    setLoading(false)
  }
}
  

  const renderError = (field) =>
    fieldErrors[field] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[field]}</span>
      </div>
    ) : null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Campaign
          </h1>
          <p className="text-gray-500 text-sm">Create a new campaign</p>
        </div>
        <button
          onClick={() => navigate("/admin/campaigns")}
          className="btn-outline w-auto px-5 text-sm"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="w-full max-w-xl mx-auto">
        <div className="card w-full">
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {apiError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <span>Campaign created successfully! Redirecting...</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field w-full ${fieldErrors.campaignName ? "border-red-500 focus:ring-red-500" : ""}`}
                placeholder="enter campaign name"
                value={campaignName}
                onChange={(e) => handleChange("campaignName", e.target.value)}
                disabled={loading || success}
              />
              {renderError("campaignName")}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Campaign Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input-field w-full appearance-none pr-10"
                  disabled={loading || success}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateField
                label="Start Date"
                value={startDate}
                onChange={(v) => handleChange("startDate", v)}
                error={fieldErrors.startDate}
                disabled={loading || success}
              />
              <DateField
                label="End Date"
                value={endDate}
                onChange={(v) => handleChange("endDate", v)}
                error={fieldErrors.endDate}
                disabled={loading || success}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Campaign Media
              </label>
              <div className="flex gap-2 mb-2">
                {mediaTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMediaType(t)}
                    disabled={loading || success}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-all ${mediaType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {mediaType === "image" || mediaType === "video" ? (
                <label className="border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-1 cursor-pointer border-gray-300 hover:border-primary hover:bg-gray-50 transition-all">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setMediaFileName(e.target.files?.[0]?.name || "")
                    }
                    disabled={loading || success}
                  />
                  <span className="text-sm text-gray-500">
                    {mediaFileName || "Tap to upload campaign banner"}
                  </span>
                </label>
              ) : (
                <input
                  type="url"
                  className="input-field w-full"
                  placeholder="Enter media URL (e.g. https://example.com/image.jpg)"
                  value={mediaUrl}
                  onChange={(e) => handleChange("mediaUrl", e.target.value)}
                  disabled={loading || success}
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                {mediaType === "link"
                  ? "Provide a direct URL to your media"
                  : "Upload a file for your campaign banner"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Link Perks <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPerksOpen((o) => !o)}
                  disabled={loadingPerks || loading || success}
                  className="input-field w-full text-left flex items-center justify-between"
                >
                  <span
                    className={
                      selectedPerkIds.length ? "text-gray-800" : "text-gray-400"
                    }
                  >
                    {loadingPerks
                      ? "Loading perks..."
                      : selectedPerkIds.length
                        ? `${selectedPerkIds.length} perk${selectedPerkIds.length > 1 ? "s" : ""} selected`
                        : "Select perks to link to this campaign"}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 shrink-0" />
                </button>
                {perksOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                    {perks.length === 0 ? (
                      <p className="px-4 py-2.5 text-sm text-gray-400">
                        No perks found
                      </p>
                    ) : (
                      perks.map((perk) => (
                        <button
                          key={perk._id}
                          type="button"
                          onClick={() => togglePerk(perk._id)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          <div
                            className={`w-4 h-4 border-2 rounded shrink-0 flex items-center justify-center ${selectedPerkIds.includes(perk._id) ? "bg-primary border-primary" : "border-gray-300"}`}
                          >
                            {selectedPerkIds.includes(perk._id) && (
                              <Check size={10} className="text-white" />
                            )}
                          </div>
                          {perk.perkName}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {fieldErrors.perks && (
                <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
                  <AlertCircle size={14} />
                  <span>{fieldErrors.perks}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} /> Created!
                </>
              ) : (
                <>
                  <Plus size={18} /> Create Campaign
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DateField({ label, value, onChange, error, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="date"
          className={`input-field w-full pr-10 ${error ? "border-red-500 focus:ring-red-500" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <Calendar
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}