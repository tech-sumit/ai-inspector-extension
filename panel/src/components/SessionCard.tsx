import { useState } from "react";

interface SessionCardProps {
  sessionId: string;
  options?: Record<string, unknown>;
  prompts: Array<{ type: string; [key: string]: unknown }>;
}

export function SessionCard({ sessionId, options, prompts }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div>
          <strong style={{ fontSize: 12 }}>Session #{sessionId.slice(0, 8)}</strong>
          <span style={{ marginLeft: 8, color: "#888", fontSize: 11 }}>{prompts.length} prompts</span>
        </div>
        <span style={{ color: "#aaa", fontSize: 11 }}>{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          {options && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#888" }}>Options:</div>
              <pre style={{ fontSize: 10, background: "#f5f5f5", padding: 6, borderRadius: 4 }}>
                {JSON.stringify(options, null, 2)}
              </pre>
            </div>
          )}
          {prompts.map((p, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${p.type === "PROMPT_SENT" ? "#ff9800" : p.type === "PROMPT_RESPONSE" ? "#4caf50" : "#f44336"}`, padding: "4px 8px", marginBottom: 4, fontSize: 11 }}>
              <div style={{ fontWeight: 600, color: "#666", fontSize: 10 }}>{p.type}</div>
              <pre style={{ margin: "2px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 10 }}>
                {JSON.stringify(p.type === "PROMPT_SENT" ? p.input : p.type === "PROMPT_RESPONSE" ? p.result : p.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
