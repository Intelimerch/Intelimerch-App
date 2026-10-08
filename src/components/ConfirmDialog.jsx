// src/components/ConfirmDialog.jsx
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  icon: Icon = AlertTriangle,
  itemName = null,
}) {
  if (!isOpen) return null;

  const tones = {
    danger: {
      accent: 'text-red-500',
      iconBg: 'bg-red-50',
      button: 'bg-red-500 hover:bg-red-600',
    },
    primary: {
      accent: 'text-primary',
      iconBg: 'bg-primary/10',
      button: 'bg-primary hover:bg-primary-dark',
    },
  };
  const toneStyles = tones[tone] || tones.danger;

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 ${toneStyles.iconBg} rounded-full flex items-center justify-center`}>
            <Icon size={32} className={toneStyles.accent} />
          </div>
        </div>

        <p className="text-center text-gray-600 mb-6">
          {itemName ? (
            <>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">"{itemName}"</span>?
              This action cannot be undone.
            </>
          ) : (
            message
          )}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${toneStyles.button}`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}