// src/pages/fan/ImagePerk.jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Download, Loader2, X } from 'lucide-react'

export default function ImagePerk() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)
  
  // 🚨 State to control the full-screen preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const title = searchParams.get('title') || 'Exclusive Artwork'
  const desc = searchParams.get('desc') || 'This piece was made exclusively for fans who own this drop.'
  const imageUrl = searchParams.get('url') || ''

  const handleDownload = async () => {
    if (!imageUrl) return
    setDownloading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download image:", error)
      window.open(imageUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive Artwork</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{desc}</p>

        {/* CLICKABLE IMAGE CONTAINER */}
        {imageUrl ? (
          <div 
            onClick={() => setIsPreviewOpen(true)}
            className="w-full h-[350px] bg-gray-100 rounded-2xl mb-5 flex items-center justify-center overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
          >
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        ) : (
          <div className="h-[350px] bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
            <p className="text-gray-400 text-sm">Image unavailable</p>
          </div>
        )}

        <button 
          onClick={handleDownload}
          disabled={!imageUrl || downloading}
          className="btn-primary rounded-full py-3.5 font-bold flex items-center justify-center gap-2 w-full disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {downloading ? (
            <><Loader2 size={18} className="animate-spin" /> Saving...</>
          ) : (
            <><Download size={18} /> Save Artwork</>
          )}
        </button>
      </div>

      {/* 🚨 FULL SCREEN PREVIEW MODAL */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)} // Click outside to close
        >
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
          
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
          
          <p className="text-white/60 text-sm mt-6">Tap anywhere to close</p>
        </div>
      )}
    </MobileShell>
  )
}