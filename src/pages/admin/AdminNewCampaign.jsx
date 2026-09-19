import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Save, Zap, Type, AlignLeft, Image, Video, Music, Link2,
  LayoutTemplate, Trash2, Copy, ChevronDown, Loader2, AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { campaignAPI } from "../../services/apiClient";

const blockTypes = [
  { type: "Header", icon: Type, color: "text-violet-500" },
  { type: "Text", icon: AlignLeft, color: "text-gray-600" },
  { type: "Image", icon: Image, color: "text-green-500" },
  { type: "Video", icon: Video, color: "text-red-500" },
  { type: "Audio", icon: Music, color: "text-yellow-500" },
  { type: "Button", icon: Link2, color: "text-purple-500" },
  { type: "Footer", icon: LayoutTemplate, color: "text-pink-500" },
];

const defaultBlocks = [
  { id: 1, type: "Header", content: "", meta: {} },
  { id: 2, type: "Text", content: "", meta: {} },
  { id: 3, type: "Button", content: "Claim Your Perk", meta: { url: "" } },
];

function PublishSuccessModal({ isOpen, onClose, campaignName, onDone }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        <div className="px-8 pt-10 pb-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-6" style={{ width: 96, height: 96, borderRadius: "50%", background: "#DCFCE7" }}>
            <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: "50%", background: "#22C55E" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Campaign Published!</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            <span className="text-amber-500 font-semibold">{campaignName}</span> is now live and ready to receive NFC scans.
          </p>
          <button onClick={onDone} className="btn-primary w-full">Back to Campaigns</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewCampaign() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCampaignId = location.state?.campaignId;
  const initialCampaignName = location.state?.campaignName || "New Campaign Page";

  const [tab, setTab] = useState("canvas");
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [editingId, setEditingId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignId, setCampaignId] = useState(initialCampaignId || "");
  const [campaignDropOpen, setCampaignDropOpen] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await campaignAPI.getAll();
        const list = Array.isArray(res.data) ? res.data : (res.data?.campaigns || []);
        setCampaigns(list);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, []);

  const selectedCampaign = campaigns.find(c => (c._id || c.id) === campaignId);
  const campaignName = selectedCampaign?.campaignName || selectedCampaign?.name || initialCampaignName;

  const addBlock = (type) => {
    const defaults = {
      Header: "New Header", Text: "Add your text here...", Button: "Click Me",
      Image: null, Video: null, Audio: null, Footer: "© 2026 · Powered by InteliMerch",
    };
    setBlocks(b => [...b, { id: Date.now(), type, content: defaults[type] || "", meta: {} }]);
  };

  const duplicateBlock = (id) => {
    setBlocks(b => {
      const idx = b.findIndex(x => x.id === id);
      if (idx === -1) return b;
      const copy = { ...b[idx], id: Date.now() };
      const next = [...b];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const removeBlock = (id) => setBlocks(b => b.filter(x => x.id !== id));

  const updateBlock = (id, field, value) => {
    if (field === "content") {
      setBlocks(b => b.map(x => x.id === id ? { ...x, content: value } : x));
    } else {
      setBlocks(b => b.map(x => x.id === id ? { ...x, meta: { ...x.meta, [field]: value } } : x));
    }
  };

  const onDragStart = (e, id) => { setDraggingId(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e, id) => { e.preventDefault(); if (id !== draggingId) setDragOverId(id); };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    setBlocks(prev => {
      const from = prev.findIndex(b => b.id === draggingId);
      const to = prev.findIndex(b => b.id === targetId);
      const updated = [...prev];
      const [item] = updated.splice(from, 1);
      updated.splice(to, 0, item);
      return updated;
    });
    setDraggingId(null);
    setDragOverId(null);
  };

  const buildDummyUrl = (name) =>
    `https://placeholder.intelimerch.com/pending-upload/${encodeURIComponent(name || "file")}`;

  const handlePublish = async () => {
    setError("");
    if (!campaignId) {
      setError("Select a campaign first (see 'Assign Campaign' in the sidebar).");
      return;
    }

    setPublishing(true);
    try {
      // Fully flexible page structure — backend just stores this JSON as-is
      // and returns it for rendering. No fixed section types required.
      const pageStructure = { blocks };

      const response = await campaignAPI.createPage(campaignId, { pageStructure });
      console.log("✅ Campaign page created:", response);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Error publishing campaign page:", err);
      setError(err.message || "Failed to publish campaign page.");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    // No draft-save endpoint exists yet — this is local only for now.
    console.log("Draft (local only):", { campaignId, blocks });
    alert("Draft saved locally — there's no backend draft endpoint yet, so this isn't persisted remotely.");
  };

  if (!initialCampaignId && campaigns.length === 0 && !loadingCampaigns) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">No campaigns yet</h2>
        <p className="text-sm text-gray-500 mb-5">Create a campaign first, then build its page here.</p>
        <button onClick={() => navigate("/admin/campaigns/create")} className="btn-primary w-auto px-6 mx-auto">
          Create a Campaign
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex -m-8 h-screen overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Blocks</h3>
            <div className="space-y-1">
              {blockTypes.map(({ type, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                >
                  <Icon size={14} className={color} />
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assign Campaign</h3>
            <div className="relative">
              <button
                onClick={() => setCampaignDropOpen(o => !o)}
                disabled={loadingCampaigns}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <span className={campaignId ? "text-gray-800" : "text-gray-400"}>
                  {loadingCampaigns ? "Loading..." : campaignName || "Select Campaign"}
                </span>
                <ChevronDown size={13} className="text-gray-400 shrink-0" />
              </button>
              {campaignDropOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 mt-1 max-h-56 overflow-y-auto">
                  {campaigns.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-gray-400">No campaigns found</p>
                  ) : (
                    campaigns.map(c => {
                      const id = c._id || c.id;
                      return (
                        <button
                          key={id}
                          onClick={() => { setCampaignId(id); setCampaignDropOpen(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-gray-50 text-left"
                        >
                          {c.campaignName || c.name}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">New Campaign For {campaignName}</h1>
              <p className="text-xs text-gray-400">Drag blocks to reorder · click to edit</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSaveDraft} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                <Save size={14} /> Save Draft
              </button>
              <button onClick={handlePublish} disabled={publishing} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50">
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {publishing ? "Publishing..." : "Publish"}
              </button>
              <button onClick={() => navigate("/admin/campaigns")} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2 mb-5 max-w-2xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
              {["canvas", "preview"].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? "bg-primary text-white" : "text-gray-500"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "canvas" ? (
              <div className="space-y-2 max-w-2xl">
                {blocks.map(block => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={e => onDragStart(e, block.id)}
                    onDragOver={e => onDragOver(e, block.id)}
                    onDrop={e => onDrop(e, block.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                    className={`border rounded-xl bg-white transition-all select-none
                      ${editingId === block.id ? "border-primary ring-1 ring-primary/20 shadow-sm" : "border-gray-200 hover:border-gray-300"}
                      ${dragOverId === block.id && draggingId !== block.id ? "border-primary bg-amber-50/50" : ""}
                      ${draggingId === block.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60 rounded-t-xl border-b border-gray-100">
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">{block.type}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingId(editingId === block.id ? null : block.id)} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${editingId === block.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {editingId === block.id ? "✓ Done" : "Edit"}
                        </button>
                        <button onClick={() => duplicateBlock(block.id)} className="p-1 hover:bg-gray-100 rounded-lg">
                          <Copy size={12} className="text-gray-400" />
                        </button>
                        <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-50 rounded-lg">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {editingId === block.id
                        ? <BlockEditor block={block} onChange={updateBlock} onFile={(field, file) => updateBlock(block.id, field, buildDummyUrl(file?.name))} />
                        : <BlockPreview block={block} onClick={() => setEditingId(block.id)} />}
                    </div>
                  </div>
                ))}
                <button onClick={() => addBlock("Text")} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-primary hover:text-primary transition-all">
                  + Add Block
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
                    intelimerch.app/{(campaignName || "campaign").toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
                <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 p-5 space-y-4 min-h-64">
                  {blocks.map(block => (
                    <div key={block.id}>
                      {block.type === "Header" && <h2 className="text-lg font-bold text-gray-900">{block.content}</h2>}
                      {block.type === "Text" && <p className="text-sm text-gray-600">{block.content}</p>}
                      {block.type === "Button" && <button className="px-5 py-3 text-sm font-medium text-white bg-primary rounded-xl w-full">{block.content}</button>}
                      {block.type === "Video" && (
                        <div className="h-40 bg-purple-100 rounded-xl flex items-center justify-center text-purple-400 text-sm">▶ Video</div>
                      )}
                      {block.type === "Image" && (
                        <div className="h-32 bg-green-50 rounded-xl flex items-center justify-center text-green-400 text-sm">📷 Image</div>
                      )}
                      {block.type === "Audio" && (
                        <div className="bg-yellow-50 rounded-xl p-3 flex items-center gap-3">
                          <span className="text-yellow-500">🎵</span>
                          <span className="text-sm text-gray-700">{block.content || "Audio"}</span>
                        </div>
                      )}
                      {block.type === "Footer" && <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-3">{block.content}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PublishSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        campaignName={campaignName}
        onDone={() => navigate("/admin/campaigns")}
      />
    </>
  );
}

function BlockEditor({ block, onChange, onFile }) {
  return (
    <div className="space-y-2.5" onClick={e => e.stopPropagation()}>
      {(block.type === "Header" || block.type === "Footer") && (
        <input autoFocus value={block.content || ""} onChange={e => onChange(block.id, "content", e.target.value)} className="input-field" placeholder={`${block.type} text...`} />
      )}
      {block.type === "Text" && (
        <textarea autoFocus value={block.content || ""} onChange={e => onChange(block.id, "content", e.target.value)} className="input-field resize-none h-20" placeholder="Body text..." />
      )}
      {block.type === "Button" && (
        <>
          <input autoFocus value={block.content || ""} onChange={e => onChange(block.id, "content", e.target.value)} className="input-field" placeholder="Button label..." />
          <input value={block.meta?.url || ""} onChange={e => onChange(block.id, "url", e.target.value)} className="input-field" placeholder="Link URL (optional)..." />
        </>
      )}
      {(block.type === "Video" || block.type === "Image" || block.type === "Audio") && (
        <>
          <label className="border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-1 cursor-pointer border-gray-300 hover:border-primary hover:bg-gray-50 transition-all">
            <input type="file" className="hidden" onChange={e => onFile("url", e.target.files?.[0])} />
            <span className="text-sm text-gray-500">{block.meta?.url ? "File selected ✓" : `Tap to upload ${block.type.toLowerCase()}`}</span>
          </label>
          <p className="text-xs text-gray-400">No upload endpoint yet — sends a placeholder URL for testing.</p>
          {block.type === "Audio" && (
            <input value={block.content || ""} onChange={e => onChange(block.id, "content", e.target.value)} className="input-field" placeholder="Track title..." />
          )}
        </>
      )}
    </div>
  );
}

function BlockPreview({ block, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer group min-h-[28px]">
      {block.type === "Header" && (
        <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
          {block.content || <span className="text-gray-300 font-normal text-sm italic">Click to edit header</span>}
        </h2>
      )}
      {block.type === "Text" && (
        <p className="text-sm text-gray-600">{block.content || <span className="text-gray-300 italic">Click to add text...</span>}</p>
      )}
      {block.type === "Button" && (
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold">{block.content || "Button"}</div>
          {block.meta?.url && <span className="text-xs text-gray-400">→ {block.meta.url}</span>}
        </div>
      )}
      {block.type === "Video" && (
        <div className="h-24 bg-purple-50 rounded-xl flex items-center justify-center text-purple-400 text-sm gap-2">
          <Video size={16} /> {block.meta?.url ? "Video linked ✓" : "Click to add video"}
        </div>
      )}
      {block.type === "Image" && (
        <div className="h-24 bg-green-50 rounded-xl flex items-center justify-center text-green-400 text-sm gap-2">
          <Image size={16} /> {block.meta?.url ? "Image linked ✓" : "Click to add image"}
        </div>
      )}
      {block.type === "Audio" && (
        <div className="bg-yellow-50 rounded-xl p-3 flex items-center gap-3">
          <Music size={16} className="text-yellow-500 shrink-0" />
          <span className="text-sm text-gray-700">{block.content || <span className="italic text-gray-400">Click to add audio</span>}</span>
        </div>
      )}
      {block.type === "Footer" && (
        <p className="text-xs text-gray-400">{block.content || <span className="italic">Click to add footer text</span>}</p>
      )}
    </div>
  );
}