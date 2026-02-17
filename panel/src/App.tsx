import { useState } from "react";
import { InspectorProvider } from "./context/InspectorContext.js";
import { Tabs } from "./components/Tabs.js";
import { ToolsTab } from "./tabs/ToolsTab.js";
import { TimelineTab } from "./tabs/TimelineTab.js";
import { AISessionsTab } from "./tabs/AISessionsTab.js";
import { StatusBar } from "./components/StatusBar.js";

const TAB_ITEMS = [
  { id: "tools", label: "Tools" },
  { id: "timeline", label: "Timeline" },
  { id: "sessions", label: "AI Sessions" },
] as const;

type TabId = (typeof TAB_ITEMS)[number]["id"];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("tools");

  return (
    <InspectorProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "12px", color: "#333", background: "#fff" }}>
        <Tabs items={TAB_ITEMS} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
          {activeTab === "tools" && <ToolsTab />}
          {activeTab === "timeline" && <TimelineTab />}
          {activeTab === "sessions" && <AISessionsTab />}
        </div>
        <StatusBar />
      </div>
    </InspectorProvider>
  );
}
