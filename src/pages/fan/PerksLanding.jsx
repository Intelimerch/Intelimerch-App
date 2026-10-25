// src/pages/fan/PerksLanding.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../../components/MobileShell";
import {
  Video,
  Link2,
  Music,
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertCircle,
  Nfc,
  Gift,
} from "lucide-react";
import { tapAPI, getTapToken, getOwnerToken } from "../../services/apiClient";
import CampaignPageRenderer, {
  REVEAL_PERKS_EVENT,
} from "./CampaignPageRenderer";

const PERK_PRESENTATION = {
  video: {
    label: "Exclusive",
    cta: "Watch",
    route: "/fan/perks/video",
    icon: Video,
    iconBg: "bg-red-50",
    iconColor: "text-red-400",
  },
  audio: {
    label: "Audio",
    cta: "Listen",
    route: "/fan/perks/audio",
    icon: Music,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
  image: {
    label: "Image",
    cta: "View",
    route: "/fan/perks/image",
    icon: ImageIcon,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-400",
  },
  document: {
    label: "Document",
    cta: "Open",
    route: "/fan/perks/document",
    icon: FileText,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
  link: {
    label: "Link",
    cta: "Get Link",
    route: "/fan/perks/link",
    icon: Link2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-400",
  },
};

const presentationFor = (contentType) =>
  PERK_PRESENTATION[(contentType || "").toLowerCase()] ||
  PERK_PRESENTATION.link;

export default function PerksLanding() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [perksRevealed, setPerksRevealed] = useState(false);
  const perksRef = useRef(null);

  const tapToken = getTapToken();
  const ownerToken = getOwnerToken();
  const firstName = localStorage.getItem("fanFirstName");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await tapAPI.getCampaignResources({
          tapToken,
          ownerToken,
        });

        // 🚨 THE LOG YOU REQUESTED
        console.log("getCampaignResources response:", JSON.stringify(response));

        setData(response?.data || response);
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        setError(err.message || "Failed to load perks.");
      } finally {
        setLoading(false);
      }
    }

    if (tapToken && ownerToken) fetchData();
    else setLoading(false);
  }, [tapToken, ownerToken]);

  useEffect(() => {
    const handler = () => setPerksRevealed(true);
    window.addEventListener(REVEAL_PERKS_EVENT, handler);
    return () => window.removeEventListener(REVEAL_PERKS_EVENT, handler);
  }, []);

  useEffect(() => {
    if (perksRevealed && perksRef.current) {
      setTimeout(() => {
        perksRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [perksRevealed]);

  const openPerk = (resource) => {
    const perk =
      typeof resource.perkId === "object" ? resource.perkId : resource;
    const { route } = presentationFor(perk?.contentType);
    const mediaUrl =
      perk?.fileUrl ||
      perk?.url ||
      perk?.mediaUrl ||
      perk?.linkUrl ||
      perk?.file?.url ||
      perk?.media?.url ||
      perk?.file ||
      perk?.media;
    const params = new URLSearchParams();
    if (perk?.perkName) params.set("title", perk.perkName);
    if (perk?.description) params.set("desc", perk.description);
    if (mediaUrl && typeof mediaUrl === "string") params.set("url", mediaUrl);
    params.set("resourceId", resource._id);
    navigate(`${route}?${params.toString()}`);
  };

  if (!tapToken || !ownerToken)
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Nfc size={48} className="text-primary mb-4" />
          <h1 className="text-xl font-bold">Tap your merch</h1>
        </div>
      </MobileShell>
    );
  if (loading)
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={40} className="text-primary animate-spin mb-4" />
        </div>
      </MobileShell>
    );
  if (error)
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h1 className="text-xl font-bold">Error</h1>
          <p>{error}</p>
        </div>
      </MobileShell>
    );

  const campaign = data?.campaign;
  const resources = data?.resources || [];
  const pageStructure = campaign?.pageStructure;
  const blocks = pageStructure?.blocks || [];
  const hasDesign = blocks.length > 0;
  const showPerks = !hasDesign || perksRevealed;

  return (
    <MobileShell>
      {/* CAMPAIGN DESIGN */}
      {hasDesign && (
        <div className="-mx-4 -mt-4 mb-6">
          <CampaignPageRenderer pageStructure={pageStructure} />
        </div>
      )}

      {/* PERKS SECTION */}
      {showPerks && (
        <div
          ref={perksRef}
          className={`transition-all duration-500 ${perksRevealed ? "animate-pulse-highlight" : ""}`}
        >
          <div className="flex items-center justify-between mb-4 pt-2">
            <div>
              <p className="font-bold text-gray-900">
                {firstName
                  ? `Hey ${firstName} 👋 Welcome back`
                  : "Welcome back 👋"}
              </p>
              <p className="text-sm text-gray-500">
                Your Perks ({resources.length} Unlocked)
              </p>
            </div>
          </div>

          {/* <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Exclusive content unlocked for this piece. Thank you for being part of the movement.
          </p> */}

          {resources.length > 0 ? (
            <div className="space-y-3">
              {resources.map((resource) => {
                const perk =
                  typeof resource.perkId === "object" ? resource.perkId : null;
                const {
                  label,
                  cta,
                  icon: Icon,
                  iconBg,
                  iconColor,
                } = presentationFor(perk?.contentType);

                return (
                  <button
                    key={resource._id}
                    onClick={() => openPerk(resource)}
                    className="w-full card text-left hover:shadow-md transition-shadow relative"
                  >
                    <div
                      className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
                    >
                      <Icon size={18} className={iconColor} />
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-bold text-gray-900 mb-2">
                      {perk?.perkName || "Exclusive perk"}
                    </p>
                    {perk?.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {perk.description}
                      </p>
                    )}
                    <span className="text-primary font-semibold text-sm">
                      {cta} →
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500">No perks available.</p>
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
}
