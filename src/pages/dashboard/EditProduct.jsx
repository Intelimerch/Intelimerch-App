// src/pages/dashboard/EditProduct.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { productAPI } from "../../services/apiClient";
import { useForm } from "../../context/FormContext";

function parseErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("E11000") || message.includes("duplicate key")) {
    if (message.includes("productName"))
      return "A product with this name already exists.";
    if (message.includes("code")) return "This product code is already in use.";
    return "This product already exists.";
  }
  if (message.includes("401") || message.includes("Unauthorized"))
    return "Your session has expired. Please log in again.";
  if (message.includes("403") || message.includes("Forbidden"))
    return "You don't have permission to edit products.";
  if (message.includes("404") || message.includes("Not Found"))
    return "The product you're trying to edit no longer exists.";
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
  return errors;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { getFormData, setFormData, clearForm } = useForm(); // ✅ Use global context

  const storageKey = `artist_edit_product_${productId}`;
  const hasHydrated = useRef(false); // ✅ Track if we've loaded from context/API
  const formDataRef = useRef(null); // ✅ Keep latest form data for cleanup

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [realProductId, setRealProductId] = useState(null);

  // ✅ Initialize form data from context (if exists) or empty
  const [formData, setFormDataState] = useState(() => {
    const saved = getFormData(storageKey);
    return (
      saved || {
        productName: "",
        productType: "",
        description: "",
        color: "",
        size: "",
      }
    );
  });

  // ✅ Keep formDataRef updated with latest formData (for cleanup)
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // ✅ Load from API ONLY on first visit (no saved data)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const saved = getFormData(storageKey);
        if (saved) {
          // ✅ FIX 1: Set realProductId from saved data
          setFormDataState(saved);
          if (saved._realProductId) setRealProductId(saved._realProductId);
          setLoading(false);
          hasHydrated.current = true; // ✅ FIX 2: Stop infinite logging
          return;
        }

        console.log("📝 No saved data - loading from API");

        const productRes = await productAPI.getAll();
        const list = Array.isArray(productRes.data) ? productRes.data : [];
        const found = list.find(
          (p) =>
            p._id === productId ||
            p.product?._id === productId ||
            p.productId === productId,
        );

        if (!found) {
          setApiError("Product not found");
          setLoading(false);
          return;
        }

        const foundRealId = found.product?._id || found.productId || found._id;
        setRealProductId(foundRealId);

        const productObj = found.product || found;

        let productType = "";
        if (productObj.productType) {
          productType = productObj.productType;
        } else if (productObj.productTypeId) {
          const typeMap = {
            "6a7094d9ccc599c16bea46d7": "T-Shirt",
            "6a747ba83427b9d628f80375": "Hoodie",
            "6a747c7b3427b9d628f8037b": "Hoodie",
            "6a747d0f3427b9d628f80387": "Bag",
            "6a74a16b3427b9d628f80392": "T-Shirt",
            "6a7f3c6216995eaa4c0e71b2": "Hoodie",
            "6a82eb283daf2628ab4807fa": "T-Shirt",
          };
          productType =
            typeMap[productObj.productTypeId] || productObj.productTypeId;
        }

        const loadedData = {
          productName: productObj.productName || found.productName || "",
          productType: productType || "",
          description: productObj.description || found.description || "",
          color: found.colorId || found.color || productObj.color || "",
          size: found.sizeId || found.size || productObj.size || "",
        };

        setFormDataState(loadedData);
        // ✅ FIX: Save realProductId in context data too
        setFormData(storageKey, { 
          ...loadedData, 
          _realProductId: foundRealId 
        });

        console.log("✅ Product loaded and form populated:", loadedData);
      } catch (err) {
        console.error("Error loading product:", err);
        setApiError(parseErrorMessage(err));
      } finally {
        setLoading(false);
        hasHydrated.current = true; // ✅ Mark as hydrated
      }
      console.log('found product:', JSON.stringify(found))
    }

    if (productId) loadData();
  }, [productId, storageKey, getFormData, setFormData]);

  // ✅ ONLY save to context on component unmount (leaving the page) or refresh
  const syncTimeout = useRef(null);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      setFormData(storageKey, {
        ...formData,
        _realProductId: realProductId || formData._realProductId
      });
    }, 500);
  }, [formData, storageKey, setFormData, realProductId]);

  // ✅ Save to context on beforeunload (refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (formDataRef.current) {
        sessionStorage.setItem(
          `form_${storageKey}`,
          JSON.stringify({
            ...formDataRef.current,
            _realProductId: realProductId
          }),
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [storageKey, realProductId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormDataState((prev) => ({ ...prev, [name]: value }));
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
      return;
    }

    setSaving(true);
    try {
      // ✅ FIX: Use realProductId or productId from params as fallback
      const targetId = realProductId || productId;
      console.log("🔧 Updating product with ID:", targetId);

      await productAPI.update(targetId, {
        productName: formData.productName.trim(),
        productType: formData.productType.trim(),
        color: formData.color.trim(),
        size: formData.size.trim(),
      });

      setSuccess(true);
      clearForm(storageKey); // ✅ Clear from context

      setTimeout(() => {
        navigate("/dashboard/products");
      }, 1200);
    } catch (err) {
      console.error("Error updating product:", err);
      setApiError(parseErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    clearForm(storageKey); // ✅ Clear from context
    navigate("/dashboard/products");
  };

  const renderError = (field) =>
    fieldErrors[field] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[field]}</span>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">Update your product details</p>
        </div>
      </div>

      <div className="card">
        {/* ✅ Add key to force remount when productId changes - prevents stale state */}
        <form key={productId} onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productName"
              className={`input-field w-full ${fieldErrors.productName ? "border-red-500" : ""}`}
              value={formData.productName}
              onChange={handleChange}
              disabled={saving || success}
              placeholder="e.g. Classic Logo Tee"
            />
            {renderError("productName")}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Product Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productType"
              className={`input-field w-full ${fieldErrors.productType ? "border-red-500" : ""}`}
              value={formData.productType}
              onChange={handleChange}
              disabled={saving || success}
              placeholder="e.g. T-Shirt, Hoodie, Cap"
            />
            {renderError("productType")}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              className={`input-field w-full resize-none h-24 ${fieldErrors.description ? "border-red-500" : ""}`}
              value={formData.description}
              onChange={handleChange}
              disabled={saving || success}
              placeholder="Describe your product..."
            />
            {renderError("description")}
            <p className="text-xs text-gray-400 mt-1">Maximum 500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Color <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="color"
                className={`input-field w-full ${fieldErrors.color ? "border-red-500" : ""}`}
                value={formData.color}
                onChange={handleChange}
                disabled={saving || success}
                placeholder="e.g. Black, White"
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
                className={`input-field w-full ${fieldErrors.size ? "border-red-500" : ""}`}
                value={formData.size}
                onChange={handleChange}
                disabled={saving || success}
                placeholder="e.g. S, M, L, XL"
              />
              {renderError("size")}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} /> Saved!
                </>
              ) : (
                <>
                  <Save size={18} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}