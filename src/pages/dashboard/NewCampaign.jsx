import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Zap, Type, AlignLeft, Image, Video, Music,
  Link2, LayoutTemplate, Trash2, ChevronDown, Check, GripVertical, Plus
} from 'lucide-react'

const blockTypes = [
  { type: 'Header', icon: Type, color: 'text-violet-500' },
  { type: 'Text', icon: AlignLeft, color: 'text-gray-600' },
  { type: 'Image', icon: Image, color: 'text-green-500' },
  { type: 'Video', icon: Video, color: 'text-red-500' },
  { type: 'Audio', icon: Music, color: 'text-yellow-500' },
  { type: 'Button', icon: Link2, color: 'text-purple-500' },
  { type: 'Footer', icon: LayoutTemplate, color: 'text-pink-500' },
]

const productList = ['Premium hoodie', 'Cargo shorts', 'Canvas tote', 'Classic logo tee']

const socialPlatforms = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: 'text-pink-500' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel', color: 'text-red-500' },
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...', color: 'text-green-600' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@handle', color: 'text-gray-700' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/handle', color: 'text-sky-500' },
]

const defaultBlocks = [
  { id: 1, type: 'Header', content: "Summer Drop '25", meta: {} },
  { id: 2, type: 'Text', content: 'Exclusive content unlocked for this piece. Thank you for being part of the movement.', meta: {} },
  { id: 3, type: 'Button', content: 'Claim Your Perk', meta: { url: '#' } },
  { id: 4, type: 'Video', content: null, meta: { url: '' } },
]

// ============================================
// SUCCESS MODAL COMPONENT with inline animations
// ============================================

function PublishSuccessModal({ isOpen, onClose, campaignName, campaignLink, onViewCampaign }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const copyToClipboard = () => {
    navigator.clipboard.writeText(campaignLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm"
          style={{ animation: 'zoomIn 0.2s ease-out' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>

          <div className="px-8 pt-10 pb-8 flex flex-col items-center">

            {/* Concentric circles icon — 3 rings matching Figma */}
            <div className="flex items-center justify-center mb-6"
              style={{ width: 120, height: 120, borderRadius: '50%', background: '#F0FDF4' }}>
              <div className="flex items-center justify-center"
                style={{ width: 92, height: 92, borderRadius: '50%', background: '#DCFCE7' }}>
                <div className="flex items-center justify-center"
                  style={{ width: 64, height: 64, borderRadius: '50%', background: '#22C55E' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Campaign Published!
            </h2>

            {/* Subtitle with campaign name in amber */}
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              <span className="text-amber-500 font-semibold">{campaignName}</span>
              {' '}is now live and ready to receive NFC scans.
            </p>

            {/* Campaign Link */}
            <div className="w-full mb-6">
              <p className="text-xs text-gray-500 mb-1.5">Campaign Link</p>
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 bg-white gap-3">
                <span className="text-sm text-gray-700 truncate flex-1 min-w-0">
                  {campaignLink}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="text-sm font-semibold text-amber-500 hover:text-amber-500 transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// MAIN NEW CAMPAIGN COMPONENT
// ============================================
export default function NewCampaign() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('canvas')
  const [blocks, setBlocks] = useState(defaultBlocks)
  const [editingId, setEditingId] = useState(null)
  const [showProductDrop, setShowProductDrop] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [campaign, setCampaign] = useState({ 
    name: "Summer Drop '25", 
    startDate: '2025-06-01', 
    endDate: '2025-08-31', 
    status: 'Draft' 
  })
  const [socialLinks, setSocialLinks] = useState({ 
    instagram: '', 
    youtube: '', 
    spotify: '', 
    tiktok: '', 
    twitter: '' 
  })
  
  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [publishedCampaign, setPublishedCampaign] = useState({ name: '', link: '', id: null })

  const addBlock = (type) => {
    const defaults = { 
      Header: 'New Header', 
      Text: 'Add your text here...', 
      Button: 'Click Me', 
      Image: null, 
      Video: null, 
      Audio: null, 
      Footer: '© 2025 · Powered by InteliMerch' 
    }
    setBlocks(b => [...b, { id: Date.now(), type, content: defaults[type] || '', meta: {} }])
  }
  
  const removeBlock = (id) => setBlocks(b => b.filter(x => x.id !== id))
  
  const updateBlock = (id, field, value) => {
    if (field === 'content') {
      setBlocks(b => b.map(x => x.id === id ? { ...x, content: value } : x))
    } else {
      setBlocks(b => b.map(x => x.id === id ? { ...x, meta: { ...x.meta, [field]: value } } : x))
    }
  }
  
  const toggleProduct = (p) => setSelectedProducts(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p])

  const onDragStart = (e, id) => { 
    setDraggingId(id); 
    e.dataTransfer.effectAllowed = 'move' 
  }
  
  const onDragOver = (e, id) => { 
    e.preventDefault(); 
    if (id !== draggingId) setDragOverId(id) 
  }
  
  const onDrop = (e, targetId) => {
    e.preventDefault()
    if (draggingId === targetId) { 
      setDraggingId(null); 
      setDragOverId(null); 
      return 
    }
    setBlocks(prev => {
      const from = prev.findIndex(b => b.id === draggingId)
      const to = prev.findIndex(b => b.id === targetId)
      const updated = [...prev]
      const [item] = updated.splice(from, 1)
      updated.splice(to, 0, item)
      return updated
    })
    setDraggingId(null); 
    setDragOverId(null)
  }

  const handlePublish = () => {
    // Generate campaign link from campaign name
    const slug = campaign.name.toLowerCase().replace(/\s+/g, '-')
    const link = `https://nfctagio.io/c/${slug}`
    
    setPublishedCampaign({
      name: campaign.name,
      link: link,
      id: Date.now()
    })
    setShowSuccessModal(true)
    
    // Here you would also save the campaign to your backend
    console.log('Campaign published:', { ...campaign, blocks, selectedProducts, socialLinks })
  }

  const handleViewCampaign = () => {
    // Navigate to campaign details page
    console.log('View campaign:', publishedCampaign)
    // Uncomment when route is ready:
    // navigate(`/dashboard/campaigns/${publishedCampaign.id}`)
  }

  const handleSaveDraft = () => {
    console.log('Draft saved:', { ...campaign, blocks, selectedProducts, socialLinks })
    alert('Draft saved successfully!')
  }

  return (
    <>
      <div className="flex -m-8 h-screen overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto">
          {/* Campaign Details */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Campaign Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                <input 
                  value={campaign.name} 
                  onChange={e => setCampaign(c => ({ ...c, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  placeholder="Campaign name..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start</label>
                  <input 
                    type="date" 
                    value={campaign.startDate} 
                    onChange={e => setCampaign(c => ({ ...c, startDate: e.target.value }))} 
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End</label>
                  <input 
                    type="date" 
                    value={campaign.endDate} 
                    onChange={e => setCampaign(c => ({ ...c, endDate: e.target.value }))} 
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select 
                  value={campaign.status} 
                  onChange={e => setCampaign(c => ({ ...c, status: e.target.value }))} 
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Paused</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Add Blocks */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Blocks</h3>
            <div className="space-y-1">
              {blockTypes.map(({ type, icon: Icon, color }) => (
                <button 
                  key={type} 
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                >
                  <Icon size={14} className={color} />{type}
                </button>
              ))}
            </div>
          </div>
          
          {/* Attach Product */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attach Product</h3>
            <div className="relative">
              <button 
                onClick={() => setShowProductDrop(!showProductDrop)}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <span className={selectedProducts.length ? 'text-gray-800' : 'text-gray-400'}>
                  {selectedProducts.length ? `${selectedProducts.length} selected` : 'Select products'}
                </span>
                <ChevronDown size={13} className="text-gray-400 shrink-0" />
              </button>
              {showProductDrop && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 mt-1">
                  {productList.map(p => (
                    <button 
                      key={p} 
                      onClick={() => toggleProduct(p)} 
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <div className={`w-4 h-4 border-2 rounded ${selectedProducts.includes(p) ? 'bg-primary border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                        {selectedProducts.includes(p) && <Check size={10} className="text-white" />}
                      </div>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Social Links */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Social Links</h3>
            <p className="text-xs text-gray-400 mb-3">CTA links shown on the fan page</p>
            <div className="space-y-2.5">
              {socialPlatforms.map(({ key, label, placeholder, color }) => (
                <div key={key}>
                  <label className={`block text-xs font-semibold mb-1 ${color}`}>{label}</label>
                  <input 
                    value={socialLinks[key]} 
                    onChange={e => setSocialLinks(s => ({ ...s, [key]: e.target.value }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                    placeholder={placeholder} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{campaign.name || 'New Campaign'}</h1>
              <p className="text-xs text-gray-400">Drag blocks to reorder · click to edit · canvas & preview</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveDraft}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Save size={14} /> Save Draft
              </button>
              <button 
                onClick={handlePublish}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <Zap size={14} /> Publish
              </button>
              <button 
                onClick={() => navigate('/dashboard/campaigns')} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
              {['canvas', 'preview'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setTab(t)}
                  className={`px-5 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? 'bg-primary text-white' : 'text-gray-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'canvas' ? (
              <div className="space-y-2 max-w-2xl">
                {blocks.map(block => (
                  <div 
                    key={block.id} 
                    draggable
                    onDragStart={e => onDragStart(e, block.id)}
                    onDragOver={e => onDragOver(e, block.id)}
                    onDrop={e => onDrop(e, block.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                    className={`border rounded-xl bg-white transition-all select-none
                      ${editingId === block.id ? 'border-primary ring-1 ring-primary/20 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
                      ${dragOverId === block.id && draggingId !== block.id ? 'border-primary bg-amber-50/50' : ''}
                      ${draggingId === block.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60 rounded-t-xl border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-gray-300 cursor-grab" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">{block.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingId(editingId === block.id ? null : block.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${editingId === block.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {editingId === block.id ? '✓ Done' : 'Edit'}
                        </button>
                        <button 
                          onClick={() => removeBlock(block.id)} 
                          className="p-1 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {editingId === block.id
                        ? <BlockEditor block={block} onChange={updateBlock} />
                        : <BlockPreview block={block} onClick={() => setEditingId(block.id)} />}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addBlock('Text')}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Block
                </button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <div className="bg-gray-800 px-4 py-2.5 flex items-center rounded-t-3xl justify-center">
                  <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
                </div>
                <div className="bg-gray-100 px-4 py-2 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400 ml-2 flex-1 bg-white rounded px-2 py-0.5 truncate">
                    intelimerch.app/{campaign.name.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                </div>
                <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 p-5 space-y-4 min-h-64">
                  {blocks.map(block => (
                    <div key={block.id}>
                      {block.type === 'Header' && <h2 className="text-lg font-bold text-gray-900">{block.content}</h2>}
                      {block.type === 'Text' && <p className="text-sm text-gray-600">{block.content}</p>}
                      {block.type === 'Button' && <button className="px-5 py-3 text-sm font-medium text-white bg-primary rounded-xl w-full">{block.content}</button>}
                      {block.type === 'Video' && <div className="h-40 bg-purple-100 rounded-xl flex items-center justify-center text-purple-400 text-sm">▶ Video</div>}
                      {block.type === 'Image' && <div className="h-32 bg-green-50 rounded-xl flex items-center justify-center text-green-400 text-sm">📷 Image</div>}
                      {block.type === 'Audio' && <div className="bg-yellow-50 rounded-xl p-3 flex items-center gap-3"><span className="text-yellow-500">🎵</span><span className="text-sm text-gray-700">{block.content || 'Audio'}</span></div>}
                      {block.type === 'Footer' && <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-3">{block.content}</p>}
                    </div>
                  ))}
                  {Object.values(socialLinks).some(v => v) && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-400 text-center mb-3">Follow on socials</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs font-medium">Instagram</a>}
                        {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium">YouTube</a>}
                        {socialLinks.spotify && <a href={socialLinks.spotify} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">Spotify</a>}
                        {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">TikTok</a>}
                        {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium">X</a>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <PublishSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        campaignName={publishedCampaign.name}
        campaignLink={publishedCampaign.link}
        onViewCampaign={handleViewCampaign}
      />
    </>
  )
}

// ============================================
// BLOCK EDITOR COMPONENT
// ============================================
function BlockEditor({ block, onChange }) {
  return (
    <div className="space-y-2.5" onClick={e => e.stopPropagation()}>
      {(block.type === 'Header' || block.type === 'Footer') && (
        <input 
          autoFocus 
          value={block.content || ''} 
          onChange={e => onChange(block.id, 'content', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
          placeholder={`${block.type} text...`} 
        />
      )}
      {block.type === 'Text' && (
        <textarea 
          autoFocus 
          value={block.content || ''} 
          onChange={e => onChange(block.id, 'content', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-20" 
          placeholder="Body text..." 
        />
      )}
      {block.type === 'Button' && (
        <>
          <input 
            autoFocus 
            value={block.content || ''} 
            onChange={e => onChange(block.id, 'content', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Button label..." 
          />
          <input 
            value={block.meta?.url || ''} 
            onChange={e => onChange(block.id, 'url', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Link URL (optional)..." 
          />
        </>
      )}
      {block.type === 'Video' && (
        <input 
          autoFocus 
          value={block.meta?.url || ''} 
          onChange={e => onChange(block.id, 'url', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
          placeholder="Video embed URL (YouTube, Vimeo...)..." 
        />
      )}
      {block.type === 'Audio' && (
        <>
          <input 
            autoFocus 
            value={block.content || ''} 
            onChange={e => onChange(block.id, 'content', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Track title..." 
          />
          <input 
            value={block.meta?.url || ''} 
            onChange={e => onChange(block.id, 'url', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Audio file URL..." 
          />
        </>
      )}
      {block.type === 'Image' && (
        <>
          <input 
            autoFocus 
            value={block.meta?.url || ''} 
            onChange={e => onChange(block.id, 'url', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Image URL..." 
          />
          <input 
            value={block.content || ''} 
            onChange={e => onChange(block.id, 'content', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
            placeholder="Caption / alt text..." 
          />
        </>
      )}
    </div>
  )
}

// ============================================
// BLOCK PREVIEW COMPONENT
// ============================================
function BlockPreview({ block, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer group min-h-[28px]">
      {block.type === 'Header' && (
        <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
          {block.content || <span className="text-gray-300 font-normal text-sm italic">Click to edit header</span>}
        </h2>
      )}
      {block.type === 'Text' && (
        <p className="text-sm text-gray-600">
          {block.content || <span className="text-gray-300 italic">Click to add text...</span>}
        </p>
      )}
      {block.type === 'Button' && (
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold">{block.content || 'Button'}</div>
          {block.meta?.url && <span className="text-xs text-gray-400">→ {block.meta.url}</span>}
        </div>
      )}
      {block.type === 'Video' && (
        <div className="h-24 bg-purple-50 rounded-xl flex items-center justify-center text-purple-400 text-sm gap-2">
          <Video size={16} />{block.meta?.url ? 'Video linked ✓' : 'Click to add video URL'}
        </div>
      )}
      {block.type === 'Image' && (
        <div className="h-24 bg-green-50 rounded-xl flex items-center justify-center text-green-400 text-sm gap-2">
          <Image size={16} />{block.meta?.url ? 'Image linked ✓' : 'Click to add image URL'}
        </div>
      )}
      {block.type === 'Audio' && (
        <div className="bg-yellow-50 rounded-xl p-3 flex items-center gap-3">
          <Music size={16} className="text-yellow-500 shrink-0" />
          <span className="text-sm text-gray-700">{block.content || <span className="italic text-gray-400">Click to add audio</span>}</span>
        </div>
      )}
      {block.type === 'Footer' && (
        <p className="text-xs text-gray-400">{block.content || <span className="italic">Click to add footer text</span>}</p>
      )}
    </div>
  )
}