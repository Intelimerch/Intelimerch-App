// src/pages/dashboard/NewCampaign.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft, Save, Zap, Type, AlignLeft, Image, Video, Music, Link2,
  LayoutTemplate, Trash2, Copy, ChevronDown, Loader2, AlertCircle,
  AlertTriangle, Palette, GripVertical,
} from "lucide-react";
import { campaignAPI } from "../../services/apiClient";
import { useFormPersistence } from "../../hooks/useFormPersistence";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  TEXT_ALIGNS,
  COLOR_SWATCHES,
  DEFAULT_THEME,
  defaultBlockStyle,
  normalizeTheme,
  normalizeBlockStyle,
  resolveStyle,
  styleToCss,
  styleToClasses,
  SOCIAL_PLATFORMS,
  EMPTY_SOCIALS,
  normalizeSocials,
} from "../../utils/campaignPageStyles";

// ─────────────────────────────────────────────
// Block palette
// ─────────────────────────────────────────────
const blockTypes = [
  { type: "Header", icon: Type, color: "text-violet-500" },
  { type: "Text", icon: AlignLeft, color: "text-gray-600" },
  { type: "Image", icon: Image, color: "text-green-500" },
  { type: "Video", icon: Video, color: "text-red-500" },
  { type: "Audio", icon: Music, color: "text-yellow-500" },
  { type: "Button", icon: Link2, color: "text-purple-500" },
  { type: "Footer", icon: LayoutTemplate, color: "text-pink-500" },
];

const BLOCK_DEFAULTS = {
  Header: "New Header",
  Text: "Add your text here...",
  Button: "Claim Your Perk",
  Image: null,
  Video: null,
  Audio: null,
  Footer: "© 2026 · Powered by InteliMerch",
};

const defaultBlocks = [
  { id: 1, type: "Header", content: "", meta: {}, style: defaultBlockStyle("Header") },
  { id: 2, type: "Text", content: "", meta: {}, style: defaultBlockStyle("Text") },
  { id: 3, type: "Button", content: "Claim Your Perk", meta: { url: "" }, style: defaultBlockStyle("Button") },
  { id: 4, type: "Video", content: null, meta: {}, style: defaultBlockStyle("Video") },
];

// ─────────────────────────────────────────────
// Publish success modal
// ─────────────────────────────────────────────
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
            <span className="text-amber-500 font-semibold">{campaignName}</span>'s page is now live.
          </p>
          <button onClick={onDone} className="btn-primary w-full">Back to Campaigns</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main editor
// ─────────────────────────────────────────────
export default function NewCampaign() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCampaignId = location.state?.campaignId;
  const initialCampaignName = location.state?.campaignName || "New Campaign Page";

  const [tab, setTab] = useState("canvas");

  const [rawBlocks, setBlocks, clearSavedBlocks] = useFormPersistence(
    "artist_campaign_blocks",
    defaultBlocks
  );
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : defaultBlocks;

  const [rawTheme, setRawTheme, clearSavedTheme] = useFormPersistence(
    "artist_campaign_theme",
    DEFAULT_THEME
  );
  const theme = normalizeTheme(
    rawTheme && typeof rawTheme === "object" && !Array.isArray(rawTheme)
      ? rawTheme
      : DEFAULT_THEME
  );

  const setTheme = (updater) => {
    setRawTheme(prev => {
      const safePrev = normalizeTheme(
        prev && typeof prev === "object" && !Array.isArray(prev) ? prev : DEFAULT_THEME
      );
      const next = typeof updater === "function" ? updater(safePrev) : updater;
      return normalizeTheme(next);
    });
  };

  // ── Social links ──
  const [rawSocials, setRawSocials, clearSavedSocials] = useFormPersistence(
    "artist_campaign_socials",
    EMPTY_SOCIALS
  );
  const socials = normalizeSocials(
    rawSocials && typeof rawSocials === "object" && !Array.isArray(rawSocials)
      ? rawSocials
      : EMPTY_SOCIALS
  );

  const updateSocial = (key, value) => {
    setRawSocials(prev => {
      const safePrev = normalizeSocials(
        prev && typeof prev === "object" && !Array.isArray(prev) ? prev : EMPTY_SOCIALS
      );
      return { ...safePrev, [key]: value };
    });
  };

  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignId, setCampaignId] = useState(initialCampaignId || "");
  const [campaignDropOpen, setCampaignDropOpen] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canvasRef = useRef(null);
  const sidebarRef = useRef(null);
  const selectedBlock = blocks.find(b => b.id === selectedId) || null;

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

  useEffect(() => {
    const handler = (e) => {
      const insideBlock = e.target.closest("[data-block-id]");
      const insideSidebar = e.target.closest("[data-sidebar]");
      if (!insideBlock && !insideSidebar) setSelectedId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: BLOCK_DEFAULTS[type] || "",
      meta: type === "Button" ? { url: "" } : {},
      style: defaultBlockStyle(type),
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  const duplicateBlock = (id) => {
    setBlocks(prev => {
      const idx = prev.findIndex(x => x.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: Date.now(), style: { ...(prev[idx].style || {}) } };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateBlockContent = (id, value) => {
    setBlocks(prev => prev.map(x => x.id === id ? { ...x, content: value } : x));
  };

  const updateBlockMeta = (id, key, value) => {
    setBlocks(prev => prev.map(x =>
      x.id === id ? { ...x, meta: { ...(x.meta || {}), [key]: value } } : x
    ));
  };

  const updateBlockStyle = (id, key, value) => {
    setBlocks(prev => prev.map(x =>
      x.id === id ? { ...x, style: { ...(x.style || {}), [key]: value } } : x
    ));
  };

  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  };
  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (draggingId === targetId || draggingId == null) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
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
      const pageStructure = {
        version: 1,
        theme: normalizeTheme(theme),
        socials: normalizeSocials(socials),
        blocks: blocks.map(b => ({
          ...b,
          style: normalizeBlockStyle(b.style),
        })),
      };

      const response = await campaignAPI.createPage(campaignId, { pageStructure });
      console.log("✅ Campaign page created:", response);

      clearSavedBlocks();
      clearSavedTheme();
      clearSavedSocials();
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Error publishing campaign page:", err);
      setError(err.message || "Failed to publish campaign page.");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    console.log("Draft (local only):", { campaignId, theme, socials, blocks });
    alert("Draft saved locally — there's no backend draft endpoint yet, so this isn't persisted remotely.");
  };

  const handleBack = () => {
    clearSavedBlocks();
    clearSavedTheme();
    clearSavedSocials();
    navigate("/dashboard/campaigns");
  };

  if (!initialCampaignId && campaigns.length === 0 && !loadingCampaigns) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">No campaigns yet</h2>
        <p className="text-sm text-gray-500 mb-5">Create a campaign first, then build its page here.</p>
        <button onClick={() => navigate("/dashboard/campaigns/create")} className="btn-primary w-auto px-6 mx-auto">
          Create a Campaign
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex -m-8 h-screen overflow-hidden">
        {/* ──────────────────────────────
            LEFT SIDEBAR
        ────────────────────────────── */}
        <div
          data-sidebar
          ref={sidebarRef}
          className="w-72 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto"
        >
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

          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assign Campaign</h3>
            <div className="relative">
              <button
                onClick={() => setCampaignDropOpen(o => !o)}
                disabled={loadingCampaigns}
                className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg flex items-center justify-between"
              >
                <span className={campaignId ? "text-gray-800 truncate" : "text-gray-400"}>
                  {loadingCampaigns ? "Loading..." : campaignName || "Select Campaign"}
                </span>
                <ChevronDown size={13} className="text-gray-400 shrink-0 ml-2" />
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

          {/* ── Social Links ── */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Social Links
            </h3>
            <p className="text-[11px] text-gray-400 mb-3">
              Shown on the "already claimed" page when someone else taps your merch.
            </p>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.key}>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: platform.brandColor }}
                  >
                    {platform.label}
                  </label>
                  <input
                    type="url"
                    value={socials[platform.key] || ""}
                    onChange={(e) => updateSocial(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Theme OR Block Style panel ── */}
          {selectedBlock ? (
            <BlockStylePanel
              block={selectedBlock}
              onStyle={(k, v) => updateBlockStyle(selectedBlock.id, k, v)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <CampaignThemePanel theme={theme} setTheme={setTheme} />
          )}
        </div>

        {/* ──────────────────────────────
            MAIN — canvas / preview
        ────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Campaign Page Editor</h1>
              <p className="text-xs text-gray-400">
                Click a block to edit inline · drag <GripVertical size={10} className="inline" /> to reorder
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePublish} disabled={publishing} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50">
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {publishing ? "Publishing..." : "Publish"}
              </button>
              <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
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
              <div className="max-w-2xl" ref={canvasRef}>
                <div
                  className="rounded-2xl p-4 border border-gray-100"
                  style={{ backgroundColor: theme.bgColor }}
                >
                  <div className="space-y-1">
                    {blocks.map(block => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        theme={theme}
                        isSelected={selectedId === block.id}
                        isDragging={draggingId === block.id}
                        isDragOver={dragOverId === block.id && draggingId !== block.id}
                        onSelect={() => setSelectedId(block.id)}
                        onContentChange={(v) => updateBlockContent(block.id, v)}
                        onMetaChange={(k, v) => updateBlockMeta(block.id, k, v)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        onFile={(field, file) => updateBlockMeta(block.id, field, buildDummyUrl(file?.name))}
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={(e) => onDragOver(e, block.id)}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => addBlock("Text")}
                  className="mt-4 w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-400 hover:border-primary hover:text-primary transition-all"
                >
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
                <div
                  className="rounded-b-2xl border border-gray-200 border-t-0 p-5 space-y-4 min-h-64"
                  style={{
                    backgroundColor: theme.bgColor,
                    fontFamily: FONT_FAMILIES.find(f => f.value === theme.fontFamily)?.stack,
                  }}
                >
                  {blocks.map(block => (
                    <PreviewBlock key={block.id} block={block} theme={theme} />
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
        onDone={() => navigate("/dashboard/campaigns")}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Canvas block — renders live and editable
// ─────────────────────────────────────────────
function CanvasBlock({
  block, theme, isSelected, isDragging, isDragOver,
  onSelect, onContentChange, onMetaChange,
  onDuplicate, onRemove, onFile,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const resolved = resolveStyle(theme, block.style);
  const css = styleToCss(resolved);
  const cls = styleToClasses(resolved);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el && block.type === "Text") {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [block.content, block.type]);

  return (
    <div
      data-block-id={block.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative rounded-xl transition-all
        ${isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-gray-200 hover:ring-offset-1"}
        ${isDragging ? "opacity-40" : ""}
        ${isDragOver ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}
    >
      <div
        className={`absolute -top-3 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-500 transition-opacity
          ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <GripVertical size={10} className="text-gray-300 cursor-grab" />
        <span className="uppercase tracking-wider">{block.type}</span>
      </div>

      <div
        className={`absolute -top-3 right-2 z-10 flex items-center gap-1 transition-opacity
          ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
          title="Duplicate"
        >
          <Copy size={11} className="text-gray-500" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-red-50"
          title="Delete"
        >
          <Trash2 size={11} className="text-red-500" />
        </button>
      </div>

      <div className="p-3">
        {block.type === "Header" && (
          <input
            value={block.content || ""}
            onChange={(e) => onContentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add a header..."
            className={`w-full bg-transparent border-none outline-none ${cls || "text-2xl font-bold"}`}
            style={css}
          />
        )}

        {block.type === "Text" && (
          <textarea
            ref={textareaRef}
            value={block.content || ""}
            onChange={(e) => onContentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add your text here..."
            rows={1}
            className={`w-full bg-transparent border-none outline-none resize-none ${cls || "text-base"}`}
            style={{ ...css, overflow: "hidden" }}
          />
        )}

        {block.type === "Button" && (
          <div className={`space-y-2 ${cls}`}>
            <input
              value={block.content || ""}
              onChange={(e) => onContentChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Button label"
              className="w-full px-5 py-3 rounded-xl font-semibold outline-none border-none"
              style={{
                backgroundColor: resolved.bgColor || theme.primaryColor,
                color: resolved.textColor || "#FFFFFF",
                fontFamily: css.fontFamily,
                textAlign: resolved.textAlign || "center",
              }}
            />
          </div>
        )}

        {(block.type === "Image" || block.type === "Video" || block.type === "Audio") && (
          <MediaBlock
            block={block}
            theme={theme}
            resolved={resolved}
            css={css}
            onFile={onFile}
            onContentChange={onContentChange}
          />
        )}

        {block.type === "Footer" && (
          <input
            value={block.content || ""}
            onChange={(e) => onContentChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Footer text"
            className={`w-full bg-transparent border-none outline-none ${cls || "text-xs text-gray-400 text-center"}`}
            style={css}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Media block
// ─────────────────────────────────────────────
function MediaBlock({ block, theme, resolved, css, onFile, onContentChange }) {
  const hasUrl = Boolean(block.meta?.url);
  const bg = resolved.bgColor || "#F3F4F6";
  const label = { Image: "image", Video: "video", Audio: "audio" }[block.type];

  return (
    <div className="space-y-2">
      {hasUrl && block.type === "Image" && (
        <img src={block.meta.url} alt="" className="w-full rounded-xl" />
      )}
      {hasUrl && block.type === "Video" && (
        <video src={block.meta.url} controls className="w-full rounded-xl" style={{ backgroundColor: bg }} />
      )}
      {hasUrl && block.type === "Audio" && (
        <audio src={block.meta.url} controls className="w-full" />
      )}

      {!hasUrl && (
        <label
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-6 cursor-pointer transition-all border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5"
          style={{ backgroundColor: bg }}
        >
          <input
            type="file"
            className="hidden"
            onChange={(e) => onFile("url", e.target.files?.[0])}
          />
          <span className="text-xs font-medium text-gray-500">Upload {label}</span>
          <span className="text-[10px] text-gray-400">Placeholder URL for now</span>
        </label>
      )}

      {hasUrl && block.type === "Audio" && (
        <input
          value={block.content || ""}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Track title"
          className="w-full text-sm bg-transparent border-none outline-none"
          style={css}
        />
      )}

      {hasUrl && (
        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span className="truncate">{block.meta.url}</span>
          <label className="cursor-pointer hover:text-primary shrink-0">
            Replace
            <input
              type="file"
              className="hidden"
              onChange={(e) => onFile("url", e.target.files?.[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Campaign Theme panel
// ─────────────────────────────────────────────
function CampaignThemePanel({ theme, setTheme }) {
  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Palette size={12} /> Campaign Theme
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Applies to the whole page. Select a block to override its styles.
        </p>
      </div>

      <Section label="Primary color">
        <div className="flex flex-wrap gap-1.5 items-center">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => setTheme(t => ({ ...t, primaryColor: c }))}
              className={`w-6 h-6 rounded-full border-2 transition-all ${theme.primaryColor === c ? "border-primary scale-110" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </Section>

      <Section label="Background">
        <div className="flex flex-wrap gap-1.5 items-center">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => setTheme(t => ({ ...t, bgColor: c }))}
              className={`w-6 h-6 rounded-full border-2 transition-all ${theme.bgColor === c ? "border-primary scale-110" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </Section>

      <Section label="Base font">
        <select
          value={theme.fontFamily}
          onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Section>

      <Section label="Base size">
        <select
          value={theme.baseFontSize}
          onChange={e => setTheme(t => ({ ...t, baseFontSize: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
        >
          {FONT_SIZES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Block Style panel
// ─────────────────────────────────────────────
function BlockStylePanel({ block, onStyle, onClose }) {
  const s = block.style || {};
  const setStyle = (k, v) => onStyle(k, v);

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editing</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{block.type}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Per-block overrides. Leave on "Theme" to inherit.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-medium text-gray-400 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-all"
          title="Deselect and go back to theme"
        >
          Done
        </button>
      </div>

      <Section label="Text color">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setStyle("textColor", null)}
            className={`text-xs px-2 py-1 rounded border transition-all ${!s.textColor ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500"}`}
          >
            Theme
          </button>
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => setStyle("textColor", c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${s.textColor === c ? "border-primary scale-110" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </Section>

      <Section label="Background">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setStyle("bgColor", null)}
            className={`text-xs px-2 py-1 rounded border transition-all ${!s.bgColor ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500"}`}
          >
            None
          </button>
          {COLOR_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => setStyle("bgColor", c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${s.bgColor === c ? "border-primary scale-110" : "border-gray-200"}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </Section>

      <Section label="Font">
        <select
          value={s.fontFamily || ""}
          onChange={(e) => setStyle("fontFamily", e.target.value || null)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
        >
          <option value="">Use campaign theme</option>
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Section>

      <Section label="Size">
        <ChipRow
          value={s.fontSize}
          options={[{ value: null, label: "Auto" }, ...FONT_SIZES]}
          onSelect={(v) => setStyle("fontSize", v)}
        />
      </Section>

      <Section label="Weight">
        <ChipRow
          value={s.fontWeight}
          options={[{ value: null, label: "Auto" }, ...FONT_WEIGHTS]}
          onSelect={(v) => setStyle("fontWeight", v)}
        />
      </Section>

      <Section label="Alignment">
        <ChipRow
          value={s.textAlign}
          options={TEXT_ALIGNS}
          onSelect={(v) => setStyle("textAlign", s.textAlign === v ? null : v)}
        />
      </Section>

      <button
        onClick={() => {
          setStyle("textColor", null);
          setStyle("bgColor", null);
          setStyle("fontFamily", null);
          setStyle("fontSize", null);
          setStyle("fontWeight", null);
          setStyle("textAlign", null);
        }}
        className="w-full text-xs text-gray-500 hover:text-gray-800 py-2 border border-dashed border-gray-200 rounded-lg transition-all"
      >
        Reset styles to theme
      </button>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function ChipRow({ value, options, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(opt => {
        const isActive = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value)}
            className={`text-xs px-2 py-1 rounded border transition-all ${isActive ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Phone preview block
// ─────────────────────────────────────────────
function PreviewBlock({ block, theme }) {
  const resolved = resolveStyle(theme, block.style);
  const css = styleToCss(resolved);
  const cls = styleToClasses(resolved);

  switch (block.type) {
    case "Header":
      return <h2 className={cls || "text-2xl font-bold"} style={css}>{block.content}</h2>;
    case "Text":
      return <p className={cls || "text-base"} style={css}>{block.content}</p>;
    case "Button":
      return (
        <button
          className="px-5 py-3 text-sm rounded-xl w-full font-medium"
          style={{
            backgroundColor: resolved.bgColor || theme.primaryColor,
            color: resolved.textColor || "#FFFFFF",
            fontFamily: css.fontFamily,
            textAlign: resolved.textAlign || "center",
          }}
        >
          {block.content}
        </button>
      );
    case "Video":
      return block.meta?.url ? (
        <video src={block.meta.url} controls className="w-full rounded-xl" />
      ) : (
        <div className="h-40 rounded-xl flex items-center justify-center text-sm bg-gray-100 text-gray-400">▶ Video</div>
      );
    case "Image":
      return block.meta?.url ? (
        <img src={block.meta.url} alt="" className="w-full rounded-xl" />
      ) : (
        <div className="h-32 rounded-xl flex items-center justify-center text-sm bg-gray-100 text-gray-400">📷 Image</div>
      );
    case "Audio":
      return (
        <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: resolved.bgColor || "#FEF3C7" }}>
          {block.content && <p className={`text-sm ${cls}`} style={css}>{block.content}</p>}
          {block.meta?.url && <audio src={block.meta.url} controls className="w-full" />}
        </div>
      );
    case "Footer":
      return <p className={`${cls || "text-xs text-center"}`} style={css}>{block.content}</p>;
    default:
      return null;
  }
}