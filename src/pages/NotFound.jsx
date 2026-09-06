// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SearchX size={40} className="text-red-500" />
                </div>
                <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Page Not Found</h2>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 flex items-center gap-2">
                        <Home size={18} /> Go Home
                    </Link>
                    <button onClick={() => window.history.back()} className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2">
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}