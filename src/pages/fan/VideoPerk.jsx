// src/pages/fan/VideoPerk.jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileShell from '../../components/MobileShell'
import { Download, Loader2 } from 'lucide-react'

export default function VideoPerk() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)

  const title = searchParams.get('title') || 'Exclusive Video'
  const desc = searchParams.get('desc') || 'Watch this exclusive video.'
  const videoUrl = searchParams.get('url') || ''

  const handleDownload = async () => {
    if (!videoUrl) return
    setDownloading(true)
    
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to download video:", error)
      window.open(videoUrl, '_blank') // Fallback
    } finally {
      setDownloading(false)
    }
  }

  return (
    <MobileShell>
      <button onClick={() => navigate('/fan/perks')} className="text-sm text-gray-500 mb-5">← Back</button>
      <div className="card">
        <p className="text-xs font-bold text-primary mb-1">Exclusive</p>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">{desc}</p>

        {/* Video Player */}
        <div className="rounded-2xl overflow-hidden bg-black mb-5">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              controlsList="nodownload" // Prevents default browser download, forces our button
              className="w-full max-h-[300px] object-contain" 
            />
          ) : (
             <div className="h-48 flex items-center justify-center text-white text-sm">
               Video unavailable
             </div>
          )}
        </div>

        {/* Changed from 'Watch Now' to 'Save to Device' */}
        <button 
          onClick={handleDownload}
          disabled={!videoUrl || downloading}
          className="btn-primary rounded-full py-3.5 font-bold flex items-center justify-center gap-2 w-full disabled:opacity-50"
        >
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {downloading ? 'Saving...' : 'Download Video'}
        </button>
      </div>
    </MobileShell>
  )
}