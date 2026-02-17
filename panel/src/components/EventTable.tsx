import { useRef, useEffect, memo } from "react";
import type { MergedEntry } from "../lib/merge-events.js";
import {
  getEntryType,
  getEntryColor,
  getEntryName,
  getEntryCategory,
  getEntryCategoryColor,
  getEntryStatus,
  getEntrySize,
  getEntryTime,
  isEntryFailed,
} from "../lib/merge-events.js";

interface EventTableProps {
  entries: MergedEntry[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  /** When true, hides the Name column to make room for the detail pane. */
  compact: boolean;
}

/* ── Styles ───────────────────────────────────────────────────── */

const TH: React.CSSProperties = {
  padding: "4px 6px",
  textAlign: "left",
  fontWeight: 500,
  color: "#888",
  fontSize: 10,
  borderRight: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
  userSelect: "none",
};

const TD: React.CSSProperties = {
  padding: "4px 6px",
  borderRight: "1px solid #f0f0f0",
  verticalAlign: "middle",
};

const TD_ELLIPSIS: React.CSSProperties = {
  ...TD,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 0,
};

const TD_MUTED: React.CSSProperties = { ...TD, color: "#999", fontSize: 10 };
const TD_MONO: React.CSSProperties = { ...TD_MUTED, fontFamily: "'SF Mono', monospace" };

/* ── Row component ────────────────────────────────────────────── */

const EntryRow = memo(function EntryRow({
  entry,
  index,
  isSelected,
  onSelect,
  compact,
}: {
  entry: MergedEntry;
  index: number;
  isSelected: boolean;
  onSelect: (i: number) => void;
  compact: boolean;
}) {
  const color = getEntryColor(entry);
  const displayType = getEntryType(entry);
  const category = getEntryCategory(entry);
  const catColor = getEntryCategoryColor(entry);
  const name = getEntryName(entry);
  const status = getEntryStatus(entry);
  const size = getEntrySize(entry);
  const time = getEntryTime(entry);
  const hasPair = !!entry.response;
  const failed = isEntryFailed(entry);
  const hasErrorResponse = failed && !!entry.response;
  const isPending = failed && !entry.response;

  const bg = isSelected
    ? (failed ? "#fce4e4" : "#e8f0fe")
    : failed
      ? (index % 2 === 0 ? "#fff5f5" : "#fff0f0")
      : (index % 2 === 0 ? "#fff" : "#fafafa");

  const hoverBg = failed ? "#ffebeb" : "#f5f7fa";

  return (
    <tr
      onClick={() => onSelect(index)}
      style={{ cursor: "pointer", background: bg, borderBottom: `1px solid ${failed ? "#fde0e0" : "#f0f0f0"}` }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = bg; }}
    >
      {/* Type */}
      <td style={TD}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 3, height: 12, borderRadius: 1, background: color, flexShrink: 0 }} />
          <span style={{ color, fontWeight: 500, fontSize: 10, fontFamily: "'SF Mono', monospace" }}>
            {displayType}
          </span>
          {hasPair && (
            <span style={{ fontSize: 8, color: "#999", fontWeight: 400 }}>⇄</span>
          )}
        </span>
      </td>

      {/* Name (hidden in compact mode) */}
      {!compact && (
        <td style={TD_ELLIPSIS} title={name}>{name}</td>
      )}

      {/* Status */}
      <td style={TD}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: status.color, fontSize: 10, fontWeight: 500 }}>
          {hasErrorResponse && <span title="Error response">✕</span>}
          {isPending && <span title="No response received">⏳</span>}
          {status.label}
        </span>
      </td>

      {/* Category */}
      <td style={TD}>
        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${catColor}14`, color: catColor, fontWeight: 500 }}>
          {category}
        </span>
      </td>

      {/* Size */}
      <td style={TD_MUTED}>{size}</td>

      {/* Time */}
      <td style={TD_MONO}>{time}</td>
    </tr>
  );
});

/* ── Table component ──────────────────────────────────────────── */

export function EventTable({ entries, selectedIndex, onSelect, compact }: EventTableProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(entries.length);

  useEffect(() => {
    if (entries.length > prevLen.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    prevLen.current = entries.length;
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", fontSize: 12 }}>
        No events recorded yet.
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto", height: "100%", fontSize: 11 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ position: "sticky", top: 0, background: "#f8f8f8", borderBottom: "1px solid #e0e0e0", zIndex: 1 }}>
            <th style={{ ...TH, width: compact ? 110 : 130 }}>Type</th>
            {!compact && <th style={TH}>Name</th>}
            <th style={{ ...TH, width: 55 }}>Status</th>
            <th style={{ ...TH, width: 58 }}>Category</th>
            <th style={{ ...TH, width: 52 }}>Size</th>
            <th style={{ ...TH, width: 80 }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              index={i}
              isSelected={selectedIndex === i}
              onSelect={onSelect}
              compact={compact}
            />
          ))}
        </tbody>
      </table>
      <div ref={endRef} />
    </div>
  );
}
