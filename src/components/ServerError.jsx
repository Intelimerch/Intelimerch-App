// src/components/ServerError.jsx
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ServerError({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 mb-8">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 flex items-center gap-2 mx-auto transition-all"
          >
            <RefreshCw size={18} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}