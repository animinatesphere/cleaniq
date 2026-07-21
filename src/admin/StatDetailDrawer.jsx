import { useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

/**
 * Slide-in drawer for KPI box drill-downs.
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   title       string   — drawer heading
 *   subtitle    string   — row count / value summary
 *   items       array    — data rows to display
 *   renderItem  (item, index) => ReactNode  — how to render each row
 *   emptyText   string   — shown when items is empty
 *   onViewAll   () => void | null  — "View all" link at bottom (optional)
 *   viewAllLabel string  — label for view all button (default "View all")
 *   accentColor string   — "emerald" | "amber" | "rose" | "blue" (default "emerald")
 */
const StatDetailDrawer = ({
  isOpen,
  onClose,
  title = "Details",
  subtitle = "",
  items = [],
  renderItem,
  emptyText = "No data to show.",
  onViewAll = null,
  viewAllLabel = "View all",
  accentColor = "emerald",
}) => {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const accent = {
    emerald: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500", icon: "text-emerald-400" },
    amber:   { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",       dot: "bg-amber-500",   icon: "text-amber-400"   },
    rose:    { badge: "bg-rose-500/15 text-rose-400 border-rose-500/25",           dot: "bg-rose-500",    icon: "text-rose-400"    },
    blue:    { badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",           dot: "bg-blue-500",    icon: "text-blue-400"    },
    violet:  { badge: "bg-violet-500/15 text-violet-400 border-violet-500/25",     dot: "bg-violet-500",  icon: "text-violet-400"  },
  }[accentColor] || { badge: "bg-white/10 text-white/60", dot: "bg-white/40", icon: "text-white/40" };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[#0B2D22] border-l border-white/10 shadow-2xl shadow-black/50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${accent.dot}`} />
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white truncate">{title}</h2>
              {subtitle && (
                <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors ml-3"
          >
            <X size={16} />
          </button>
        </div>

        {/* Count badge */}
        <div className="px-5 py-2.5 border-b border-white/[0.04] shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${accent.badge}`}>
            {items.length} record{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-sm text-white/30">{emptyText}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {items.map((item, i) =>
                renderItem ? (
                  <div key={i}>{renderItem(item, i)}</div>
                ) : (
                  <div key={i} className="px-5 py-3 text-sm text-white/70">
                    {String(item)}
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {onViewAll && (
          <div className="shrink-0 border-t border-white/[0.07] px-5 py-3">
            <button
              onClick={() => { onViewAll(); onClose(); }}
              className={`w-full flex items-center justify-center gap-1.5 text-[13px] font-semibold ${accent.icon} hover:opacity-80 transition-opacity py-2`}
            >
              {viewAllLabel}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StatDetailDrawer;
