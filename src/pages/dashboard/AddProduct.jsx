// src/pages/dashboard/AddProduct.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { productAPI, campaignAPI } from "../../services/apiClient";
import { useFormPersistence } from "../../hooks/useFormPersistence";

// ─── Canonical Product Type → Code Map (EDIT THIS AS SOURCE OF TRUTH) ───
const PRODUCT_TYPE_CODES = {
  "T-Shirt": "TSH",
  Hoodie: "HD",
  Cap: "CAP",
  Bag: "BG",
};

const PRODUCT_TYPES = Object.keys(PRODUCT_TYPE_CODES);

// ─── Tier options for display (labels) and values (1-4 for backend) ───
const TIER_OPTIONS = [
  { value: "1", label: "Supporter" },
  { value: "2", label: "Insider" },
  { value: "3", label: "Superfan" },
  { value: "4", label: "Inner Circle" },
];

function parseErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("E11000") || message.includes("duplicate key")) {
    if (message.includes("product-type") || message.includes("productType"))
      return "This product type already exists. Please use a different product type.";
    if (message.includes("productName"))
      return "A product with this name already exists. Please use a different name.";
    return "This product already exists. Please check your details and try again.";
  }
  if (message.includes("validation") || message.includes("valid")) {
    if (message.includes("campaignId"))
      return "The selected campaign ID is not valid. Please select a campaign from the list.";
    if (message.includes("productTier"))
      return "Please select a valid product tier.";
    return "Please check your input and try again.";
  }
  if (message.includes("required")) {
    if (message.includes("productName")) return "Product name is required.";
    if (message.includes("productType")) return "Product type is required.";
    if (message.includes("color")) return "Color is required.";
    if (message.includes("size")) return "Size is required.";
    return "Please fill in all required fields.";
  }
  if (message.includes("401") || message.includes("Unauthorized"))
    return "Your session has expired. Please log in again.";
  if (message.includes("403") || message.includes("Forbidden"))
    return "You don't have permission to create products.";
  return message || "An unexpected error occurred. Please try again.";
}

function validateProduct(data) {
  const errors = {};
  if (!data.productName || data.productName.trim().length === 0)
    errors.productName = "Product name is required";
  else if (data.productName.trim().length < 2)
    errors.productName = "Product name must be at least 2 characters";
  if (!data.productType || data.productType.trim().length === 0)
    errors.productType = "Product type is required";
  if (!data.color || data.color.trim().length === 0)
    errors.color = "Color is required";
  if (!data.size || data.size.trim().length === 0)
    errors.size = "Size is required";
  if (data.description && data.description.trim().length > 500)
    errors.description = "Description cannot exceed 500 characters";
  if (data.campaignId && !data.productTier)
    errors.productTier = "Product tier is required when linking to a campaign";
  return errors;
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // ✅ Use useFormPersistence
  const [formData, setFormData, clearSavedForm] = useFormPersistence(
    "artist_add_product",
    {
      productName: "",
      productType: "",
      productCode: "",
      description: "",
      color: "",
      size: "",
      campaignId: "",
      productTier: "",
    },
  );

  // ─── New state for product type dropdown ───
  const [showTypeDrop, setShowTypeDrop] = useState(false);
  const [isManualType, setIsManualType] = useState(false); // true when "+ Add New Type" is clicked

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showCampaignDrop, setShowCampaignDrop] = useState(false);

  // Load campaigns - NO formData overwrite here
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await campaignAPI.getAll();
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.campaigns || [];
        setCampaigns(list);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, []);

  const selectedCampaign = campaigns.find(
    (c) => (c._id || c.id) === formData.campaignId,
  );

  // ─── Handle Product Type Selection ───
  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      productType: type,
      productCode: PRODUCT_TYPE_CODES[type] || "", // Auto-fill code
    }));
    setShowTypeDrop(false);
    setIsManualType(false);
  };

  // ─── Handle "+ Add New Type" ───
  const handleAddNewType = () => {
    setIsManualType(true);
    setShowTypeDrop(false);
    setFormData((prev) => ({ ...prev, productType: "", productCode: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name])
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    if (apiError) setApiError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);
    setSuccess(false);

    const errors = validateProduct(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.focus();
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName.trim(),
        productType: formData.productType.trim(),
        description: formData.description.trim() || "",
        color: formData.color.trim(),
        size: formData.size.trim(),
      };

      if (formData.productCode.trim())
        payload.productCode = formData.productCode.trim();
      if (formData.campaignId && formData.productTier) {
        payload.campaignId = formData.campaignId;
        payload.productTier = formData.productTier;
      }

      const response = await productAPI.create(payload);
      console.log("✅ Product created:", response);

      setSuccess(true);
      clearSavedForm(); // ✅ Clear after success

      setTimeout(() => {
        navigate("/dashboard/products");
      }, 1500);
    } catch (err) {
      console.error("❌ Error creating product:", err);
      setApiError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearSavedForm(); // ✅ Clear when navigating away
    navigate("/dashboard/products");
  };

  const renderError = (fieldName) =>
    fieldErrors[fieldName] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[fieldName]}</span>
      </div>
    ) : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">
            Create a new product for your NFC campaign
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
              <span>Product created successfully! Redirecting...</span>
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
              className={`input-field w-full ${fieldErrors.productName ? "border-red-500 focus:ring-red-500" : ""}`}
              placeholder="e.g. Classic Logo Tee"
              value={formData.productName}
              onChange={handleChange}
              disabled={loading || success}
            />
            {renderError("productName")}
          </div>

          {/* Product Type - DROPDOWN */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Product Type <span className="text-red-500">*</span>
            </label>

            {!isManualType ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypeDrop(!showTypeDrop)}
                  className={`input-field w-full text-left flex items-center justify-between ${fieldErrors.productType ? "border-red-500 focus:ring-red-500" : ""}`}
                  disabled={loading || success}
                >
                  <span
                    className={
                      formData.productType ? "text-gray-800" : "text-gray-400"
                    }
                  >
                    {formData.productType || "Select a product type"}
                  </span>
                  <ChevronDown size={15} className="text-gray-400 shrink-0" />
                </button>
                {showTypeDrop && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                    {PRODUCT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeSelect(type)}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                      >
                        <span>{type}</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {PRODUCT_TYPE_CODES[type]}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleAddNewType}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary hover:bg-primary/5 font-medium"
                      >
                        <Plus size={14} /> Add New Type
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    New Type Name
                  </label>
                  <input
                    type="text"
                    name="productType"
                    className={`input-field w-full ${fieldErrors.productType ? "border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="e.g. Sweatshirt"
                    value={formData.productType}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Type Code
                  </label>
                  <input
                    type="text"
                    name="productCode"
                    className={`input-field w-full ${fieldErrors.productCode ? "border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="e.g. SWT"
                    value={formData.productCode}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualType(false);
                    setFormData((prev) => ({
                      ...prev,
                      productType: "",
                      productCode: "",
                    }));
                  }}
                  className="col-span-2 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to existing types
                </button>
              </div>
            )}
            {renderError("productType")}
          </div>

          {/* Product Code */}
          {!isManualType && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Product Code{" "}
                <span className="text-gray-400 font-normal">(auto-filled)</span>
              </label>
              <input
                type="text"
                name="productCode"
                className={`input-field w-full ${fieldErrors.productCode ? "border-red-500 focus:ring-red-500" : ""}`}
                placeholder="e.g. TSH"
                value={formData.productCode}
                onChange={handleChange}
                disabled={loading || success}
              />
              <p className="text-xs text-gray-400 mt-1">
                Auto-filled from the selected product type.
              </p>
              {renderError("productCode")}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              className={`input-field w-full resize-none h-24 ${fieldErrors.description ? "border-red-500 focus:ring-red-500" : ""}`}
              placeholder="Describe your product..."
              value={formData.description}
              onChange={handleChange}
              disabled={loading || success}
            />
            {renderError("description")}
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
                className={`input-field w-full ${fieldErrors.color ? "border-red-500 focus:ring-red-500" : ""}`}
                placeholder="e.g. Black, White"
                value={formData.color}
                onChange={handleChange}
                disabled={loading || success}
              />
              {renderError("color")}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Size <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="size"
                className={`input-field w-full ${fieldErrors.size ? "border-red-500 focus:ring-red-500" : ""}`}
                placeholder="e.g. S, M, L, XL"
                value={formData.size}
                onChange={handleChange}
                disabled={loading || success}
              />
              {renderError("size")}
            </div>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Link to Campaign{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCampaignDrop(!showCampaignDrop)}
                disabled={loadingCampaigns || loading || success}
                className="input-field w-full text-left flex items-center justify-between"
              >
                <span
                  className={
                    selectedCampaign ? "text-gray-800" : "text-gray-400"
                  }
                >
                  {loadingCampaigns
                    ? "Loading campaigns..."
                    : selectedCampaign?.campaignName ||
                      selectedCampaign?.name ||
                      "Select a campaign"}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showCampaignDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((f) => ({ ...f, campaignId: "" }));
                      setShowCampaignDrop(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-400"
                  >
                    None
                  </button>
                  {campaigns.length === 0 ? (
                    <p className="px-4 py-2.5 text-sm text-gray-400">
                      No campaigns found
                    </p>
                  ) : (
                    campaigns.map((c) => {
                      const id = c._id || c.id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setFormData((f) => ({ ...f, campaignId: id }));
                            setShowCampaignDrop(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          {c.campaignName || c.name}
                        </button>
                      );
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
              <div className="relative">
                <select
                  name="productTier"
                  value={formData.productTier}
                  onChange={handleChange}
                  className={`input-field w-full appearance-none pr-10 ${fieldErrors.productTier ? "border-red-500 focus:ring-red-500" : ""}`}
                  disabled={loading || success}
                >
                  <option value="">Select a tier</option>
                  {TIER_OPTIONS.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              {renderError("productTier")}
              <p className="text-xs text-amber-600 mt-1">
                Required when linked to a campaign.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating
                Product...
              </>
            ) : success ? (
              <>
                <CheckCircle size={18} /> Created Successfully!
              </>
            ) : (
              <>
                <Plus size={18} /> Create Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
