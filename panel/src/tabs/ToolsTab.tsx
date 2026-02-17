import { useEffect, useState } from "react";
import { useInspector } from "../context/InspectorContext.js";
import { useInspectedPage } from "../hooks/useInspectedPage.js";
import { ToolCard } from "../components/ToolCard.js";

interface DiscoveredTool {
  name: string;
  description: string;
  inputSchema: string;
}

export function ToolsTab() {
  const { state } = useInspector();
  const { evaluate } = useInspectedPage();
  const [tools, setTools] = useState<DiscoveredTool[]>([]);

  useEffect(() => {
    refreshTools();
  }, []);

  useEffect(() => {
    setTools(state.tools);
  }, [state.tools]);

  const refreshTools = async () => {
    try {
      const result = await evaluate(
        "JSON.stringify(navigator.modelContextTesting?.listTools() ?? [])",
      );
      if (typeof result === "string") {
        setTools(JSON.parse(result));
      }
    } catch {
      // modelContextTesting may not be available
    }
  };

  const handleExecute = async (name: string, args: string): Promise<string | null> => {
    // inspectedWindow.eval() cannot await promises, so we store the result
    // in a temp global and poll for it.
    const key = `__aiInspectorResult_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await evaluate(
      `void navigator.modelContextTesting.executeTool(${JSON.stringify(name)}, ${JSON.stringify(args)})` +
      `.then(r => { window[${JSON.stringify(key)}] = JSON.stringify({ ok: true, value: r }); })` +
      `.catch(e => { window[${JSON.stringify(key)}] = JSON.stringify({ ok: false, error: String(e) }); })`,
    );

    // Poll for the result (up to 30s)
    for (let i = 0; i < 300; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const raw = await evaluate(`window[${JSON.stringify(key)}]`);
      if (typeof raw === "string") {
        await evaluate(`delete window[${JSON.stringify(key)}]`);
        const parsed = JSON.parse(raw);
        if (!parsed.ok) throw new Error(parsed.error);
        return parsed.value;
      }
    }
    throw new Error("Tool execution timed out");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>WebMCP Tools</h3>
        <button onClick={refreshTools} style={{ border: "1px solid #ccc", borderRadius: 4, padding: "4px 10px", background: "#fff", cursor: "pointer", fontSize: 11 }}>
          Refresh
        </button>
      </div>
      {tools.length === 0 ? (
        <div style={{ color: "#999", padding: 20, textAlign: "center" }}>
          <p>No WebMCP tools detected on this page.</p>
          <p style={{ fontSize: 11 }}>Ensure the page registers tools via <code>navigator.modelContext.registerTool()</code></p>
        </div>
      ) : (
        tools.map((tool) => (
          <ToolCard
            key={tool.name}
            name={tool.name}
            description={tool.description}
            inputSchema={tool.inputSchema}
            onExecute={handleExecute}
          />
        ))
      )}
    </div>
  );
}
