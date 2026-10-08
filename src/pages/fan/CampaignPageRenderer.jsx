// src/pages/fan/CampaignPageRenderer.jsx
import { useNavigate } from "react-router-dom";
import { Video, Image as ImageIcon, Music } from "lucide-react";
import {
  FONT_FAMILIES,
  resolveStyle,
  styleToCss,
  styleToClasses,
  normalizeTheme,
  normalizeBlockStyle,
} from "../../utils/campaignPageStyles";

// Special in-page anchor that scrolls to the perks list on the same page.
const PERKS_ANCHOR = "#perks";

// Custom event dispatched when a no-URL button is tapped. The host page
// (PerksLanding) listens for this and reveals the perks section.
export const REVEAL_PERKS_EVENT = "campaign:reveal-perks";

export default function CampaignPageRenderer({ pageStructure }) {
  if (!pageStructure) return null;

  const theme = normalizeTheme(pageStructure.theme);
  const blocks = Array.isArray(pageStructure.blocks) ? pageStructure.blocks : [];

  if (blocks.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: theme.bgColor,
        fontFamily: FONT_FAMILIES.find(f => f.value === theme.fontFamily)?.stack,
      }}
      className="w-full"
    >
      <div className="space-y-4">
        {blocks.map(block => (
          <RenderBlock key={block.id} block={block} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function RenderBlock({ block, theme }) {
  const navigate = useNavigate();
  const style = normalizeBlockStyle(block.style);
  const resolved = resolveStyle(theme, style);
  const css = styleToCss(resolved);
  const className = styleToClasses(resolved);

  const handleButtonClick = (url) => {
    const target = (url || "").trim();

    // 1 & 2 — no URL or the perks anchor → ask the page to reveal perks
    if (!target || target === PERKS_ANCHOR) {
      window.dispatchEvent(new CustomEvent(REVEAL_PERKS_EVENT));
      return;
    }

    // 3 — internal app path
    if (target.startsWith("/")) {
      navigate(target);
      return;
    }

    // 4 & 5 — external URL
    window.open(target, "_blank", "noopener,noreferrer");
  };

  switch (block.type) {
    case "Header":
      return (
        <h1
          className={`${className || "text-2xl font-bold"} leading-tight`}
          style={css}
        >
          {block.content}
        </h1>
      );

    case "Text":
      return (
        <p
          className={`${className || "text-base"} leading-relaxed`}
          style={css}
        >
          {block.content}
        </p>
      );

    case "Button":
      return (
        <div className={className}>
          <button
            type="button"
            onClick={() => handleButtonClick(block.meta?.url)}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: resolved.bgColor || theme.primaryColor,
              color: resolved.textColor || "#FFFFFF",
              fontFamily: css.fontFamily,
              fontSize: css.fontSize,
              textAlign: resolved.textAlign || "center",
            }}
          >
            {block.content || "Continue"}
          </button>
        </div>
      );

    case "Image":
      return block.meta?.url ? (
        <img
          src={block.meta.url}
          alt={block.content || "Campaign image"}
          className="w-full rounded-xl"
          style={{ backgroundColor: resolved.bgColor || undefined }}
        />
      ) : (
        <div
          className="h-32 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: resolved.bgColor || "#F3F4F6" }}
        >
          <ImageIcon size={20} style={{ color: resolved.textColor || "#9CA3AF" }} />
        </div>
      );

    case "Video":
      return block.meta?.url ? (
        <video
          src={block.meta.url}
          controls
          className="w-full rounded-xl"
          style={{ backgroundColor: resolved.bgColor || "#000" }}
        />
      ) : (
        <div
          className="h-40 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: resolved.bgColor || "#F3F4F6" }}
        >
          <Video size={20} style={{ color: resolved.textColor || "#9CA3AF" }} />
        </div>
      );

    case "Audio":
      return (
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ backgroundColor: resolved.bgColor || "#FEF3C7" }}
        >
          {block.content && (
            <p className={`${className || "text-sm"}`} style={css}>
              {block.content}
            </p>
          )}
          {block.meta?.url ? (
            <audio src={block.meta.url} controls className="w-full" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Music size={14} />
              <span>Audio unavailable</span>
            </div>
          )}
        </div>
      );

    case "Footer":
      return (
        <p
          className={`${className || "text-xs text-center"} pt-3 border-t border-gray-100`}
          style={css}
        >
          {block.content}
        </p>
      );

    default:
      return null;
  }
}