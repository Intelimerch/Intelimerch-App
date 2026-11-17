// src/pages/fan/CampaignPageRenderer.jsx
import { useNavigate } from "react-router-dom";
import {
  FONT_FAMILIES,
  resolveStyle,
  styleToCss,
  styleToClasses,
  normalizeTheme,
  normalizeBlockStyle,
} from "../../utils/campaignPageStyles";

export const REVEAL_PERKS_EVENT = "campaign:reveal-perks";

export default function CampaignPageRenderer({ pageStructure }) {
  if (!pageStructure) return null;

  const theme = normalizeTheme(pageStructure.styles?.theme || pageStructure.theme);
  const blocks = Array.isArray(pageStructure.blocks) ? pageStructure.blocks : [];

  if (blocks.length === 0) return null;

  return (
    <div 
      className="w-full pb-6" 
      style={{ 
        backgroundColor: theme.bgColor,
        fontFamily: FONT_FAMILIES.find(f => f.value === theme.fontFamily)?.stack 
      }}
    >
      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => (
          <RenderBlock 
            key={block.blockId || block.id || `block-${index}`} 
            block={block} 
            theme={theme} 
          />
        ))}
      </div>
    </div>
  );
}

function RenderBlock({ block, theme }) {
  const navigate = useNavigate();
  const style = normalizeBlockStyle(block.styles || block.style);
  const resolved = resolveStyle(theme, style);
  const css = styleToCss(resolved);
  const className = styleToClasses(resolved);

  const type = String(block.type || "").toLowerCase().trim();

  // Extract text safely
  const textContent = block.content?.text || (typeof block.content === "string" ? block.content : "");

  // Extract media URL safely. Browser-only preview URLs (blob:...) must be
  // ignored: pages published before this was stripped still have the editor's
  // local file preview saved in meta.url, and it shadows the real uploaded URL
  // which made the image render as a broken blob on the fan page.
  const isUsableMediaUrl = (value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.startsWith("blob:");

  const mediaUrl =
    [
      block.meta?.url,
      block.content?.meta?.url,
      block.content?.url,
    ].find(isUsableMediaUrl) || "";

  const handleButtonClick = (url) => {
    const target = (url || "").trim();
    if (!target || target === "#perks") {
      window.dispatchEvent(new CustomEvent(REVEAL_PERKS_EVENT));
      return;
    }
    if (target.startsWith("/")) {
      navigate(target);
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  switch (type) {
    case "header":
      return (
        <h1 className={`px-4 leading-tight ${className || "text-2xl font-bold"}`} style={css}>
          {textContent}
        </h1>
      );

    case "text":
      return (
        <p className={`px-4 leading-relaxed whitespace-pre-wrap ${className || "text-base"}`} style={css}>
          {textContent}
        </p>
      );

    case "button":
      return (
        <div className="px-4">
          <button
            type="button"
            onClick={() => handleButtonClick(block.content?.meta?.url || block.meta?.url)}
            className={`w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] ${className || "text-center"}`}
            style={{
              ...css,
              backgroundColor: resolved.bgColor || theme.primaryColor || "#F97316",
              color: resolved.textColor || "#FFFFFF",
            }}
          >
            {textContent || "Claim Your Perk"}
          </button>
        </div>
      );

    case "image":
      return mediaUrl ? (
        <div className="px-4">
          <img
            src={mediaUrl}
            alt={textContent || "Campaign image"}
            className="w-full rounded-2xl object-cover max-h-72 shadow-sm"
            style={{ backgroundColor: resolved.bgColor || undefined }}
          />
        </div>
      ) : null;

    case "video":
      // An empty media block should render nothing on a fan-facing page
      // rather than a developer placeholder.
      return mediaUrl ? (
        <div className="px-4">
          <video
            src={mediaUrl}
            controls
            className="w-full rounded-2xl object-cover max-h-72 bg-black shadow-sm"
            style={{ backgroundColor: resolved.bgColor || "#000" }}
          />
        </div>
      ) : null;

    case "audio":
      // Nothing to show for an empty audio block.
      if (!textContent && !mediaUrl) return null;

      return (
        <div className="px-4">
          <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: resolved.bgColor || "#FEF3C7" }}>
            {textContent && <p className={`${className || "text-sm"}`} style={css}>{textContent}</p>}
            {mediaUrl ? (
              <audio src={mediaUrl} controls className="w-full" />
            ) : null}
          </div>
        </div>
      );

    case "footer":
      return (
        <p className={`px-4 pt-4 border-t border-gray-100 ${className || "text-xs text-center"}`} style={css}>
          {textContent}
        </p>
      );

    default:
      return textContent ? (
        <div className="px-4 text-sm text-gray-700">{textContent}</div>
      ) : null;
  }
}