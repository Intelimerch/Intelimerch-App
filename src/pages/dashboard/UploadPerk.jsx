// src/pages/dashboard/UploadPerk.jsx
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Video,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { perksAPI } from "../../services/apiClient";
import { useFormPersistence } from "../../hooks/useFormPersistence";

const contentTypes = [
  { label: "Video", value: "video" },
  { label: "Image", value: "image" },
  { label: "Link", value: "link" },
  { label: "Document", value: "document" },
];

// GET /admin/perks/categories is intermittently flaky on the backend
// (confirmed via curl — same failure outside the browser entirely, not a
// frontend bug). These are real, confirmed category IDs to fall back to
// so the form stays usable when the live fetch fails.
// FIXED: Removed duplicate "Premium Access" and replaced with "VIP Access"
const KNOWN_CATEGORIES = [
  { _id: "6a47f7bd57683e966000296e", name: "Classic Access" },
  { _id: "6a47dff4b09ae7642a078972", name: "Premium Access" },
  { _id: "6a494f1aa4164eab48bf52aa", name: "VIP Access" },
];

function parseErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("E11000") || message.includes("duplicate key")) {
    return "A perk with this name already exists. Please use a different name.";
  }
  if (message.includes("perkCategoryId"))
    return "Please select a valid perk category.";
  if (message.includes("contentType"))
    return "Please select a valid content type.";
  if (message.includes("required")) {
    if (message.includes("perkName")) return "Perk name is required.";
    return "Please fill in all required fields.";
  }
  if (message.includes("401"))
    return "Your session has expired. Please log in again.";
  if (message.includes("403"))
    return "You don't have permission to create perks.";
  if (message.includes("500"))
    return "Something went wrong on our server. Please try again later.";
  return message || "An unexpected error occurred. Please try again.";
}

export default function UploadPerk() {
  const navigate = useNavigate();
  const [showTypeDrop, setShowTypeDrop] = useState(false);
  const [showCatDrop, setShowCatDrop] = useState(false);

  // ✅ Use useFormPersistence for all form fields
  const [formData, setFormData, clearSavedForm] = useFormPersistence(
    "artist_upload_perk",
    {
      perkName: "",
      selectedType: null,
      selectedCategory: null,
      description: "",
      fileName: "",
      file: null,
    },
  );

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState(null);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await perksAPI.getCategories();
        const live = res.data || [];
        
        // ─── FIXED: Deduplicate categories by name ───
        const deduped = live.filter((cat, index, self) =>
          index === self.findIndex(c => c.name === cat.name)
        );
        
        console.log('📋 Categories loaded:', deduped);
        setCategories(deduped.length > 0 ? deduped : KNOWN_CATEGORIES);
      } catch (err) {
        console.error(
          "Failed to load perk categories, using known fallback:",
          err,
        );
        setCategories(KNOWN_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    setFormData((prev) => ({ ...prev, fileName: f.name, file: f }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
  setFieldError("");
  setUiError(null);

  if (!formData.perkName.trim()) {
    setFieldError("Perk name is required");
    return;
  }
  if (!formData.selectedCategory) {
    setFieldError("Please choose a perk category");
    return;
  }
  if (!formData.selectedType) {
    setFieldError("Please choose a content type");
    return;
  }

  setSubmitting(true);
  try {
    const payload = {
      perkName: formData.perkName.trim(),
      perkCategoryId: formData.selectedCategory._id,
      contentType: formData.selectedType.value,
      // POST /perks is JSON-only and requires fileUrl (string).
      // No upload endpoint exists yet, so this is a placeholder.
      fileUrl: formData.file
        ? `https://placeholder.intelimerch.com/pending-upload/${encodeURIComponent(formData.file.name)}`
        : "https://placeholder.intelimerch.com/pending-upload/none",
    };
    if (formData.description.trim())
      payload.description = formData.description.trim();

    const response = await perksAPI.create(payload);
    console.log("✅ Perk created:", response);
    clearSavedForm();
    navigate("/dashboard/perks");
  } catch (err) {
    console.error("Failed to create perk:", err);
    setUiError(parseErrorMessage(err));
  } finally {
    setSubmitting(false);
  }
};

  const handleBack = () => {
    clearSavedForm(); // ✅ Clear when navigating away
    navigate("/dashboard/perks");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Perk</h1>
          <p className="text-gray-500 text-sm">
            Upload a new perk for your fans
          </p>
        </div>
        <button
          onClick={handleBack}
          className="btn-outline w-auto px-5 text-sm"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="card max-w-4xl">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Perk Details</h2>

        {uiError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm font-medium">{uiError}</p>
          </div>
        )}
        {fieldError && !uiError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {fieldError}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Perk Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              placeholder="e.g. Exclusive Behind the Scenes Video"
              value={formData.perkName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, perkName: e.target.value }))
              }
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Perk Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCatDrop(!showCatDrop);
                  setShowTypeDrop(false);
                }}
                className="input-field text-left flex items-center justify-between"
                disabled={submitting || loadingCategories}
              >
                <span
                  className={
                    formData.selectedCategory
                      ? "text-gray-800"
                      : "text-gray-400"
                  }
                >
                  {loadingCategories
                    ? "Loading categories..."
                    : formData.selectedCategory?.name ||
                      "Choose a perk category"}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showCatDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-56 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="px-4 py-2.5 text-sm text-gray-400">
                      No categories found
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            selectedCategory: cat,
                          }));
                          setShowCatDrop(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                      >
                        <div
                          className={`w-4 h-4 border-2 rounded-full shrink-0 ${formData.selectedCategory?._id === cat._id ? "bg-primary border-primary" : "border-gray-300"}`}
                        />
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {categoriesError && (
              <p className="text-xs text-red-500 mt-1">{categoriesError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Content Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowTypeDrop(!showTypeDrop);
                  setShowCatDrop(false);
                }}
                className="input-field text-left flex items-center justify-between"
                disabled={submitting}
              >
                <span
                  className={
                    formData.selectedType ? "text-gray-800" : "text-gray-400"
                  }
                >
                  {formData.selectedType?.label ||
                    "Choose what kind of exclusive content this perk delivers"}
                </span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
              {showTypeDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1">
                  {contentTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, selectedType: t }));
                        setShowTypeDrop(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded-full ${formData.selectedType?.value === t.value ? "bg-primary border-primary" : "border-gray-300"}`}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Upload File
            </label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl py-10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragging ? "border-primary bg-primary-light" : "border-gray-300 hover:border-primary hover:bg-gray-50"}`}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
                disabled={submitting}
              />
              <Video size={18} className="text-primary" />
              <span className="text-sm text-gray-500">
                {formData.fileName || "Tap to upload, or drag a file here"}
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              File uploads aren't supported on creation yet — this sends a
              placeholder URL for testing.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description (optional)
            </label>
            <textarea
              className="input-field resize-none h-28"
              placeholder="Describe what fans will get when they unlock this perk..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={submitting}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-auto px-6 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Upload size={15} /> Save to Library
                </>
              )}
            </button>
            <button
              onClick={handleBack}
              disabled={submitting}
              className="btn-outline w-auto px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}