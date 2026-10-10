// src/pages/dashboard/TagGroups.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Tag as TagIcon,
  Search,
  MoreHorizontal,
  CheckCircle,
  Edit2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { tagsAPI } from "../../services/apiClient";
import ServerError from "../../components/ServerError";

const PAGE_SIZE = 20;

const statusLabel = {
  unassigned: "Not Linked",
  assigned: "Assigned",
  activated: "Active",
  disabled: "Disabled",
};
const statusColor = {
  unassigned: "text-gray-400",
  assigned: "text-blue-600",
  activated: "text-green-600",
  disabled: "text-red-500",
};
const statusBg = {
  unassigned: "bg-gray-100",
  assigned: "bg-blue-50",
  activated: "bg-green-50",
  disabled: "bg-red-50",
};

const TYPE_FILTERS = ["All", "T-Shirt", "Cap", "Hoodie", "Bag"];

// SKU prefix → product type. Strips trailing digits from the first
// segment so "HDY013" → "HDY", "HD001008" → "HD", "TSH004" → "TSH".
const SKU_PREFIX_TO_TYPE = {
  TSH: "T-Shirt",
  TS: "T-Shirt",
  HD: "Hoodie",
  HDY: "Hoodie",
  CAP: "Cap",
  BG: "Bag",
};

const isObjectId = (value) =>
  typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

const getTagType = (tag) => {
  if (tag.type && !isObjectId(tag.type)) return tag.type;
  if (tag.productType && !isObjectId(tag.productType)) return tag.productType;

  const sku = (tag.sku || "").toUpperCase();
  if (sku) {
    const prefix = sku.split("-")[0].replace(/\d+$/, "");
    if (SKU_PREFIX_TO_TYPE[prefix]) return SKU_PREFIX_TO_TYPE[prefix];
  }

  return null;
};

// Extract a flat array of tags from whatever the endpoint returns.
function extractTags(res) {
  if (res?.data?.tags && Array.isArray(res.data.tags)) return res.data.tags;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return res || [];
}

export default function TagGroups() {
  const navigate = useNavigate();

  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });

  // Type breakdown across ALL tags (not just the current page)
  const [typeCounts, setTypeCounts] = useState({});

  const [activeTypeFilter, setActiveTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef({});

  // Close the action dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        openMenu &&
        !e.target.closest(".dropdown-menu") &&
        !e.target.closest(".dropdown-trigger")
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenu]);

  // ── Load the type breakdown across all tags (once, on mount) ──
  useEffect(() => {
    let cancelled = false;
    async function loadTypeCounts() {
      try {
        // Large page size to get as many tags as possible in one shot.
        // If you later have >1000 tags, switch to a server-provided breakdown.
        const res = await tagsAPI.getArtistTags(1, 1000);
        const allTags = extractTags(res);

        const counts = {};
        allTags.forEach((tag) => {
          const type = getTagType(tag);
          if (type) counts[type] = (counts[type] || 0) + 1;
        });

        if (!cancelled) setTypeCounts(counts);
      } catch (err) {
        console.error("Failed to load type counts:", err);
        // Non-fatal — leave counts empty; only "All" chip will show.
      }
    }
    loadTypeCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load the current page of tags ──
  const loadTags = useCallback(async () => {
    try {
      setLoadingTags(true);
      setError(null);

      const res = await tagsAPI.getArtistTags(page, PAGE_SIZE);
      const tagList = extractTags(res);
      setTags(tagList);

      const serverPagination = res?.pagination || res?.data?.pagination;
      if (serverPagination) {
        setPagination({
          total: serverPagination.total ?? tagList.length,
          page: serverPagination.page ?? page,
          limit: serverPagination.limit ?? PAGE_SIZE,
          totalPages:
            serverPagination.totalPages ??
            Math.max(
              1,
              Math.ceil((serverPagination.total ?? tagList.length) / PAGE_SIZE),
            ),
        });
      } else {
        setPagination({
          total: tagList.length,
          page: 1,
          limit: PAGE_SIZE,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error("Failed to load tags:", err);
      setError(err.message || "Failed to load tags");
    } finally {
      setLoadingTags(false);
    }
  }, [page]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Reset to page 1 whenever filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, activeTypeFilter]);

  const goBack = () => navigate("/dashboard/campaigns");

  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return value;
  };

  const filtered = tags.filter((tag) => {
    const tagType = getTagType(tag) || "";
    const matchType =
      activeTypeFilter === "All" || tagType === activeTypeFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (tag.tagId || tag._id || "").toLowerCase().includes(q) ||
      (tag.nfcLink || "").toLowerCase().includes(q) ||
      (tag.campaign || tag.campaignName || "").toLowerCase().includes(q) ||
      (tag.sku || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const openDropdown = (id, e) => {
    e?.stopPropagation?.();
    const target = e?.currentTarget || buttonRefs.current[id];

    if (!target) {
      setMenuPosition({
        top: window.innerHeight / 2 - 60,
        left: window.innerWidth / 2 - 75,
      });
      setOpenMenu(id);
      return;
    }

    const rect = target.getBoundingClientRect();
    const dropdownWidth = 160;
    const dropdownHeight = 120;

    let left = rect.right - dropdownWidth;
    let top = rect.bottom + 4;

    if (left < 10) left = 10;
    if (left + dropdownWidth > window.innerWidth - 10)
      left = window.innerWidth - dropdownWidth - 10;
    if (top + dropdownHeight > window.innerHeight - 10)
      top = rect.top - dropdownHeight - 4;
    if (top < 10) top = 10;

    setMenuPosition({ top, left });
    setOpenMenu(openMenu === id ? null : id);
  };

  if (error) {
    return <ServerError onRetry={loadTags} />;
  }

  const openTag =
    openMenu !== null
      ? tags.find((t, i) => (t._id || t.id || i) === openMenu) || null
      : null;
  const openTagStatus = openTag?.status || "unassigned";

  // Show a chip for "All" and any type that exists anywhere in the artist's tags.
  const visibleFilters = TYPE_FILTERS.filter(
    (f) => f === "All" || (typeCounts[f] || 0) > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-transparent text-gray-500 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0 mb-0.5">
              Tag Management
            </h1>
            <p className="text-sm text-gray-500 m-0">
              All NFC tags across your campaigns
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters + Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {visibleFilters.map((f) => (
            <button
              key={f}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                activeTypeFilter === f
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTypeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg min-w-[220px]">
          <Search size={14} className="text-gray-400" />
          <input
            className="w-full border-none outline-none text-sm text-gray-800 bg-transparent"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      {loadingTags ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl border border-gray-200">
          <Loader2 size={36} className="text-primary animate-spin mb-3" />
          <p className="text-gray-400">Loading tags…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <EmptyState
            icon={<TagIcon size={40} className="text-gray-300" />}
            title={
              search || activeTypeFilter !== "All"
                ? "No tags found"
                : "No tags yet"
            }
            description={
              search || activeTypeFilter !== "All"
                ? "Try adjusting your filter or search term."
                : "Tags will appear here once you assign products to campaigns."
            }
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Tag ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[200px]">
                      NFC Link
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                      Scans
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-10">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((tag, i) => {
                    const id = tag._id || tag.id || i;
                    const tagId =
                      tag.tagId || tag._id?.slice(-8) || `TAG-${i + 1}`;
                    const nfcLink = tag.nfcLink || tag.nfcUrl || tag.link;
                    const type = getDisplayValue(getTagType(tag));
                    const color = getDisplayValue(tag.color);
                    const size = getDisplayValue(tag.size);
                    const sku = getDisplayValue(tag.sku);
                    const campaignName = getDisplayValue(
                      tag.campaign || tag.campaignName,
                    );
                    const scans = tag.scans || tag.tapCount || 0;
                    const status = tag.status || "unassigned";

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-green-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                          {tagId}
                        </td>
                        <td className="px-4 py-2.5 max-w-[200px]">
                          {nfcLink ? (
                            <a
                              href={nfcLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700 font-mono text-xs flex items-center gap-1 truncate hover:underline"
                            >
                              {nfcLink}
                              <ExternalLink size={12} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{type}</td>
                        <td className="px-4 py-2.5 text-gray-600">{color}</td>
                        <td className="px-4 py-2.5 text-gray-600">{size}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">
                          {sku}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {campaignName}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 font-medium">
                          {scans.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor[status] || "text-gray-500"} ${statusBg[status] || "bg-gray-100"}`}
                          >
                            {statusLabel[status] || "Not Linked"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right w-10">
                          <button
                            ref={(el) => {
                              buttonRefs.current[id] = el;
                            }}
                            onClick={(e) => openDropdown(id, e)}
                            className="dropdown-trigger p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-all inline-flex items-center justify-center"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-800">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>
                –
                <span className="font-medium text-gray-800">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-800">
                  {pagination.total}
                </span>{" "}
                tags
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1 || loadingTags}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page{" "}
                  <span className="font-medium text-gray-800">
                    {pagination.page}
                  </span>{" "}
                  of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={
                    pagination.page >= pagination.totalPages || loadingTags
                  }
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Floating action dropdown ── */}
      {openMenu !== null && openTag && (
        <>
          <div
            className="fixed inset-0 z-[997]"
            onClick={() => setOpenMenu(null)}
          />
          <div
            className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] min-w-[160px] overflow-hidden"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm border-b border-gray-100">
              <CheckCircle
                size={13}
                className={statusColor[openTagStatus] || "text-gray-400"}
              />
              <span
                className={`font-semibold ${statusColor[openTagStatus] || "text-gray-500"}`}
              >
                {statusLabel[openTagStatus] || "Not Linked"}
              </span>
            </div>
            <button
              disabled
              title="Not available yet — no update endpoint exists for tags"
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-gray-300 cursor-not-allowed"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              disabled
              title="Not available yet — no delete endpoint exists for tags"
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-sm text-gray-300 cursor-not-allowed"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
