import { useState } from "react";
import { JsonEditor } from "./JsonEditor.js";

interface ToolCardProps {
  name: string;
  description: string;
  inputSchema: string;
  onExecute: (name: string, args: string) => Promise<string | null>;
}

export function ToolCard({ name, description, inputSchema, onExecute }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [args, setArgs] = useState("{}");
  const [result, setResult] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  let schema: Record<string, unknown> = {};
  try { schema = JSON.parse(inputSchema); } catch { /* ignore */ }

  const handleExecute = async () => {
    setExecuting(true);
    setResult("Executing...");
    try {
      const response = await onExecute(name, args);
      setResult(response ?? "null");
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ fontSize: 13 }}>{name}</strong>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 11 }}>{description}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ border: "1px solid #ccc", borderRadius: 4, padding: "4px 10px", background: "#fff", cursor: "pointer", fontSize: 11 }}>
          {expanded ? "Collapse" : "Execute"}
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Input Schema:</div>
          <pre style={{ background: "#f5f5f5", padding: 8, borderRadius: 4, fontSize: 11, overflow: "auto", maxHeight: 120 }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
          <div style={{ fontSize: 11, color: "#888", margin: "8px 0 4px" }}>Arguments (JSON):</div>
          <JsonEditor value={args} onChange={setArgs} />
          <button onClick={handleExecute} disabled={executing} style={{ marginTop: 8, background: executing ? "#93b8e8" : "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", cursor: executing ? "default" : "pointer", fontSize: 12 }}>
            {executing ? "Running..." : "Run"}
          </button>
          {result && (
            <pre style={{ marginTop: 8, background: "#f0f7ff", padding: 8, borderRadius: 4, fontSize: 11 }}>
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
