import { useState, useEffect } from "react";
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
  Save
} from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { perksAPI } from "../../services/apiClient";

const typeBadge = {
  video: "bg-red-50 text-red-500",
  link: "bg-purple-50 text-purple-500",
  image: "bg-teal-50 text-teal-600",
  document: "bg-yellow-50 text-yellow-600",
};

const typeIconMap = {
  video: Video,
  link: Link2,
  image: Image,
  document: FileText,
};

const typeIconBg = {
  video: "bg-red-50",
  link: "bg-purple-50",
  image: "bg-teal-50",
  document: "bg-yellow-50",
};

const typeIconColor = {
  video: "text-red-400",
  link: "text-purple-400",
  image: "text-teal-400",
  document: "text-yellow-500",
};

const statusMap = {
  'active': 'Active',
  'expired': 'Expired',
  'draft': 'Draft',
};

// ─── Professional Error Parser ──────────────────────────
function parseErrorMessage(error) {
  const message = error?.message || '';
  
  if (message.includes('<!DOCTYPE') || message.includes('HTML')) {
    return 'Server error. Please check your connection and try again.';
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The item you\'re trying to delete no longer exists.';
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    return 'Cannot connect to the server. Please check your internet connection.';
  }
  return message || 'An unexpected error occurred. Please try again.';
}

export default function PerksLibrary() {
  const navigate = useNavigate();
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPerk, setEditingPerk] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ─── Delete Modal State ───
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, perkId: null, perkName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [uiError, setUiError] = useState(null); // For professional UI error display

  // ─── Fetch Perks from API ───
  const fetchPerks = async () => {
    try {
      setLoading(true);
      setError(null);
      setUiError(null);
      const response = await perksAPI.getAll();
      console.log("Perks fetched:", response);
      setPerks(response.data || response || []);
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

  // ─── Delete Perk ───
  const confirmDelete = (id, name) => {
    setUiError(null);
    setDeleteModal({ isOpen: true, perkId: id, perkName: name || 'this perk' });
  };

  const handleDelete = async () => {
    const { perkId } = deleteModal;
    if (!perkId) return;
    
    setIsDeleting(true);
    setUiError(null);
    try {
      console.log(`🗑️ Deleting perk: ${perkId}`);
      await perksAPI.remove(perkId);
      console.log(`✅ Perk deleted successfully`);
      await fetchPerks();
      setDeleteModal({ isOpen: false, perkId: null, perkName: '' });
    } catch (err) {
      console.error("Error deleting perk:", err);
      const friendlyMessage = parseErrorMessage(err);
      setUiError(friendlyMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, perkId: null, perkName: '' });
  };

  // ─── Save Edit ───
  const saveEdit = async () => {
    if (!editingPerk) return;
    const id = editingPerk._id || editingPerk.id;
    
    setIsSubmitting(true);
    setUiError(null);
    try {
      const formData = new FormData();
      formData.append("perkName", editForm.perkName);
      formData.append("contentType", editForm.contentType);
      formData.append("description", editForm.description || "");
      
      if (editForm.perkCategoryId) {
        formData.append("perkCategoryId", editForm.perkCategoryId);
      }
      if (editForm.campaignId) {
        formData.append("campaignId", editForm.campaignId);
      }
      if (editForm.file) {
        formData.append("file", editForm.file);
      }

      const updated = await perksAPI.update(id, formData);
      console.log("Update response:", updated);
      await fetchPerks();
      closeEdit();
    } catch (err) {
      console.error("Error updating perk:", err);
      const friendlyMessage = parseErrorMessage(err);
      setUiError(friendlyMessage);
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
      perkCategoryId: perk.perkCategoryId || "",
      campaignId: perk.campaignId || "",
      status: statusMap[status.toLowerCase()] || 'Active',
      file: null,
    });
    setEditingPerk(perk);
  };

  const closeEdit = () => {
    setEditingPerk(null);
    setEditForm({});
  };

  // ─── Get icon for perk type ───
  const getPerkIcon = (type) => {
    const key = type?.toLowerCase() || "link";
    return typeIconMap[key] || Link2;
  };

  const getPerkBg = (type) => {
    const key = type?.toLowerCase() || "link";
    return typeIconBg[key] || "bg-gray-50";
  };

  const getPerkColor = (type) => {
    const key = type?.toLowerCase() || "link";
    return typeIconColor[key] || "text-gray-400";
  };

  const getBadgeClass = (type) => {
    const key = type?.toLowerCase() || "link";
    return typeBadge[key] || "bg-gray-100 text-gray-600";
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading perks...</p>
      </div>
    );
  }

  // ─── Error State ───
  if (error && !uiError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center max-w-md">{error}</p>
        <button onClick={fetchPerks} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perks Library</h1>
          <p className="text-gray-500 text-sm">
            Hey Jenny 👋, Reusable exclusive content for your fans
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/perks/upload")}
          className="btn-primary w-auto px-5"
        >
          <Upload size={16} /> Upload Perk
        </button>
      </div>

      {/* ─── Professional UI Error Display ─── */}
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
            const perkType = perk.contentType || perk.perkType || perk.type || "link";
            const Icon = getPerkIcon(perkType);
            const iconBg = getPerkBg(perkType);
            const iconColor = getPerkColor(perkType);
            const badgeClass = getBadgeClass(perkType);
            const status = perk.status || "active";
            const isActive = status.toLowerCase() === "active";
            const displayStatus = statusMap[status.toLowerCase()] || 'Active';
            const campaigns = perk.campaigns || [];

            return (
              <div
                key={id}
                className="card hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(perk)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil size={13} className="text-primary" />
                    </button>
                    <button
                      onClick={() => confirmDelete(id, perk.perkName || perk.title)}
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
                  className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 ${badgeClass}`}
                >
                  {perkType.charAt(0).toUpperCase() + perkType.slice(1)}
                </span>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 mb-1">
                    Used in campaigns:
                  </p>
                  {campaigns.length > 0 ? (
                    campaigns.map((c, index) => (
                      <p key={index} className="text-xs text-primary">
                        · {c}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Not linked to any campaign</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Added {perk.createdAt ? new Date(perk.createdAt).toLocaleDateString() : "—"}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {displayStatus}
                    </span>
                  ) : (
                    <span className="badge-paused text-xs">{displayStatus}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Edit Modal ─── */}
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
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, contentType: e.target.value }))
                  }
                  className="input-field w-full"
                >
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  <option value="document">Document</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="input-field w-full resize-none h-20"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Perk Category ID <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  value={editForm.perkCategoryId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, perkCategoryId: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Enter perk category ID..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Campaign ID <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  value={editForm.campaignId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, campaignId: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Enter campaign ID..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Upload File <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, file: e.target.files[0] }))
                  }
                  className="input-field w-full"
                />
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
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
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
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
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.perkName}"</span>? 
              This action cannot be undone.
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
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
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