// src/pages/dashboard/PerksLibrary.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Video,
  Link2,
  Image,
  FileText,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Gift,
  Save,
  ChevronDown,
} from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { perksAPI } from "../../services/apiClient";
import { useFormPersistence } from "../../hooks/useFormPersistence";
import ServerError from "../../components/ServerError";

const typeBadge = {
  video: "bg-red-50 text-red-500",
  link: "bg-purple-50 text-purple-500",
  image: "bg-teal-50 text-teal-600",
  // document: "bg-yellow-50 text-yellow-600",
};

const typeIconMap = {
  video: Video,
  link: Link2,
  image: Image,
  // document: FileText,
};
const typeIconBg = {
  video: "bg-red-50",
  link: "bg-purple-50",
  image: "bg-teal-50",
  // document: "bg-yellow-50",
};
const typeIconColor = {
  video: "text-red-400",
  link: "text-purple-400",
  image: "text-teal-400",
  // document: "text-yellow-500",
};

const statusMap = { active: "Active", expired: "Expired", draft: "Draft" };

const KNOWN_CATEGORIES = [
  { _id: "6a47f7bd57683e966000296e", name: "Supporter" },
  { _id: "6a47dff4b09ae7642a078972", name: "Insider" },
  { _id: "6a494f1aa4164eab48bf52aa", name: "Superfan" },
  { _id: "6a494f1aa4164eab48bf52bb", name: "Inner Circle" },
];

// Validators for the edit modal
const isImageFile = (f) => !!f && f.type.startsWith("image/");
const isVideoFile = (f) => !!f && f.type.startsWith("video/");
const isDocumentFile = (f) =>
  !!f &&
  (f.type === "application/pdf" ||
    f.type.startsWith("application/msword") ||
    f.type.includes("officedocument") ||
    f.type.startsWith("text/"));

const FILE_VALIDATORS = {
  image: {
    test: isImageFile,
    error: "That's not an image. Please choose an image file.",
    accept: "image/*",
  },
  video: {
    test: isVideoFile,
    error: "That's not a video. Please choose a video file.",
    accept: "video/*",
  },
  document: {
    test: isDocumentFile,
    error: "That's not a supported document. Use PDF, DOC, DOCX, or TXT.",
    accept: ".pdf,.doc,.docx,.txt,application/pdf",
  },
};

function parseErrorMessage(error) {
  const message = error?.message || "";
  if (message.includes("<!DOCTYPE") || message.includes("HTML"))
    return "Server error. Please check your connection and try again.";
  if (message.includes("401") || message.includes("Unauthorized"))
    return "Your session has expired. Please log in again.";
  if (message.includes("403") || message.includes("Forbidden"))
    return "You don't have permission to perform this action.";
  if (message.includes("404") || message.includes("Not Found"))
    return "The item you're trying to delete no longer exists.";
  if (message.includes("500") || message.includes("Internal Server Error"))
    return "Something went wrong on our server. Please try again later.";
  if (message.includes("ECONNREFUSED") || message.includes("NetworkError"))
    return "Cannot connect to the server. Please check your internet connection.";
  if (message.includes("Uploaded file type does not match")) {
    return "The file type doesn't match the content type you selected.";
  }
  return message || "An unexpected error occurred. Please try again.";
}

export default function PerksLibrary() {
  const navigate = useNavigate();
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPerk, setEditingPerk] = useState(() => {
    try {
      const saved = sessionStorage.getItem("editing_perk");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (editingPerk) {
      sessionStorage.setItem("editing_perk", JSON.stringify(editingPerk));
    } else {
      sessionStorage.removeItem("editing_perk");
    }
  }, [editingPerk]);

  const [editForm, setEditForm, clearEditForm] = useFormPersistence(
    "edit_perk_form",
    {
      perkName: "",
      contentType: "link",
      description: "",
      perkCategoryId: "",
      status: "Active",
    },
  );

  // File state for the edit modal
  const editFileRef = useRef(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [, forceRender] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    perkId: null,
    perkName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCatDrop, setShowCatDrop] = useState(false);

  const fetchPerks = async () => {
    try {
      setLoading(true);
      setError(null);
      setUiError(null);
      const response = await perksAPI.getAll();
      setPerks(response.data || []);
    } catch (err) {
      console.error("Error fetching perks:", err);
      const friendlyMessage = parseErrorMessage(err);
      setError(friendlyMessage);
      setUiError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerks();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await perksAPI.getCategories();
        const live = res.data || [];
        const deduped = live.filter((cat, index, self) =>
          index === self.findIndex(c => c.name === cat.name)
        );
        const hasNewCategories = deduped.some(cat => 
          ["Supporter", "Insider", "Superfan", "Inner Circle"].includes(cat.name)
        );
        setCategories(hasNewCategories ? deduped : KNOWN_CATEGORIES);
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

  const confirmDelete = (id, name) => {
    setUiError(null);
    setDeleteModal({ isOpen: true, perkId: id, perkName: name || "this perk" });
  };

  const handleDelete = async () => {
    const { perkId } = deleteModal;
    if (!perkId) return;
    setIsDeleting(true);
    setUiError(null);
    try {
      await perksAPI.remove(perkId);
      await fetchPerks();
      setDeleteModal({ isOpen: false, perkId: null, perkName: "" });
    } catch (err) {
      console.error("Error deleting perk:", err);
      setUiError(parseErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () =>
    setDeleteModal({ isOpen: false, perkId: null, perkName: "" });

  const clearEditFile = () => {
    editFileRef.current = null;
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    setEditFileName("");
    forceRender((n) => n + 1);
  };

  const handleEditFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      clearEditFile();
      return;
    }

    // Validate based on current editForm.contentType
    const validator = FILE_VALIDATORS[editForm.contentType];
    if (validator && !validator.test(file)) {
      setUiError(validator.error);
      e.target.value = "";
      return;
    }

    setUiError(null);
    
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    
    editFileRef.current = file;
    setEditPreviewUrl(
      editForm.contentType === "document" ? null : URL.createObjectURL(file)
    );
    setEditFileName(file.name);
    forceRender((n) => n + 1);
  };

  const saveEdit = async () => {
    if (!editingPerk) return;
    const id = editingPerk._id || editingPerk.id;

    setIsSubmitting(true);
    setUiError(null);
    try {
      // Build payload for multipart/form-data
      const fields = {
        perkName: editForm.perkName,
        contentType: editForm.contentType,
        description: editForm.description || "",
      };
      if (editForm.perkCategoryId) {
        fields.perkCategoryId = editForm.perkCategoryId;
      }

      const fileToUpload = editFileRef.current;

      // Use the updated perksAPI.update which handles FormData
      const updated = await perksAPI.update(id, fields, fileToUpload);
      
      console.log("Update response:", updated);
      await fetchPerks();

      clearEditForm();
      closeEdit();
    } catch (err) {
      console.error("Error updating perk:", err);
      setUiError(parseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (perk) => {
    setUiError(null);
    const status = perk.status || "active";

    setEditForm({
      perkName: perk.perkName || perk.title || "",
      contentType: perk.contentType || perk.perkType || perk.type || "link",
      description: perk.description || "",
      perkCategoryId: perk.perkCategoryId?._id || perk.perkCategoryId || "",
      status: statusMap[status.toLowerCase()] || "Active",
    });

    // Reset any previously staged file
    clearEditFile();
    setEditingPerk(perk);
  };

  const closeEdit = () => {
    clearEditForm();
    clearEditFile();
    setEditingPerk(null);
    setShowCatDrop(false);
  };

  const getPerkIcon = (type) =>
    typeIconMap[type?.toLowerCase() || "link"] || Link2;
  const getPerkBg = (type) =>
    typeIconBg[type?.toLowerCase() || "link"] || "bg-gray-50";
  const getPerkColor = (type) =>
    typeIconColor[type?.toLowerCase() || "link"] || "text-gray-400";
  const getBadgeClass = (type) =>
    typeBadge[type?.toLowerCase() || "link"] || "bg-gray-100 text-gray-600";

  const selectedCategory = categories.find(
    (c) => c._id === editForm.perkCategoryId,
  );

  const activeValidator = FILE_VALIDATORS[editForm.contentType];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading perks...</p>
      </div>
    );
  }

  if (error && !uiError) {
    return <ServerError onRetry={fetchPerks} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perks Library</h1>
          <p className="text-gray-500 text-sm">
            Reusable exclusive content for your fans
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/perks/upload")}
          className="btn-primary w-auto px-5"
        >
          <Upload size={16} /> Upload Perk
        </button>
      </div>

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

      {perks.length === 0 ? (
        <EmptyState
          icon={<Gift size={40} className="text-gray-300" />}
          title="No perks uploaded yet"
          description="Create your first perk — exclusive videos, discount codes, images, or documents for your fans."
          action={() => navigate("/dashboard/perks/upload")}
          actionLabel="Upload Perk"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {perks.map((perk) => {
            const id = perk._id || perk.id;
            const perkType =
              perk.contentType || perk.perkType || perk.type || "link";
            const Icon = getPerkIcon(perkType);
            const status = perk.status || "active";
            const isActive = status.toLowerCase() === "active";
            const displayStatus = statusMap[status.toLowerCase()] || "Active";

            return (
              <div key={id} className="card hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 ${getPerkBg(perkType)} rounded-xl flex items-center justify-center`}
                  >
                    <Icon size={18} className={getPerkColor(perkType)} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(perk)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil size={13} className="text-primary" />
                    </button>
                    <button
                      onClick={() =>
                        confirmDelete(id, perk.perkName || perk.title)
                      }
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1.5">
                  {perk.perkName || perk.title}
                </h3>
                {perk.description && (
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                    {perk.description}
                  </p>
                )}
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 ${getBadgeClass(perkType)}`}
                >
                  {perkType.charAt(0).toUpperCase() + perkType.slice(1)}
                </span>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 mb-1">Category:</p>
                  <p className="text-xs text-primary">
                    {perk.perkCategoryId?.name || "Uncategorized"}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {perk.createdAt
                      ? new Date(perk.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {displayStatus}
                    </span>
                  ) : (
                    <span className="badge-paused text-xs">
                      {displayStatus}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingPerk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Edit Perk</h2>
              <button
                onClick={closeEdit}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Perk Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={editForm.perkName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, perkName: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Perk name..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.contentType}
                  onChange={(e) => {
                    setEditForm((f) => ({ ...f, contentType: e.target.value }));
                    // Clear staged file if they change type, to avoid MIME mismatch
                    clearEditFile(); 
                  }}
                  className="input-field w-full"
                >
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  {/* <option value="document">Document</option> */}
                </select>
              </div>

              {/* File Upload Section for Edit */}
              {editForm.contentType !== "link" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Replace File (optional)
                  </label>

                  {editFileName ? (
                    <div className="relative border rounded-xl overflow-hidden bg-gray-50">
                      {editPreviewUrl && editForm.contentType === "image" && (
                        <img
                          src={editPreviewUrl}
                          alt="Preview"
                          className="w-full max-h-32 object-contain bg-black"
                        />
                      )}
                      {editPreviewUrl && editForm.contentType === "video" && (
                        <video
                          src={editPreviewUrl}
                          controls
                          className="w-full max-h-32 object-contain bg-black"
                        />
                      )}
                      {editForm.contentType === "document" && (
                        <div className="flex items-center justify-center py-6">
                          <FileText size={32} className="text-primary" />
                        </div>
                      )}
                      <div className="flex items-center justify-between p-2 bg-white border-t">
                        <span className="text-xs text-gray-600 truncate">
                          {editFileName}
                        </span>
                        <button
                          type="button"
                          onClick={clearEditFile}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-gray-50 transition-all">
                      <input
                        type="file"
                        accept={activeValidator?.accept}
                        className="hidden"
                        onChange={handleEditFile}
                        disabled={isSubmitting}
                      />
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Tap to upload a new {editForm.contentType}
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="input-field w-full resize-none h-20"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Perk Category
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCatDrop((o) => !o)}
                    disabled={loadingCategories || isSubmitting}
                    className="input-field w-full text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        selectedCategory ? "text-gray-800" : "text-gray-400"
                      }
                    >
                      {loadingCategories
                        ? "Loading categories..."
                        : selectedCategory?.name || "Select a category"}
                    </span>
                    <ChevronDown size={15} className="text-gray-400 shrink-0" />
                  </button>
                  {showCatDrop && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 mt-1 max-h-48 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            setEditForm((f) => ({
                              ...f,
                              perkCategoryId: cat._id,
                            }));
                            setShowCatDrop(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="input-field w-full"
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEdit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete Perk</h2>
              <button
                onClick={closeDeleteModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-500" />
              </div>
            </div>
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{deleteModal.perkName}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}