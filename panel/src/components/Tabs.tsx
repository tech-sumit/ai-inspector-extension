interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: readonly TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", background: "#f8f8f8", padding: "0 8px" }}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: active === item.id ? "2px solid #1a73e8" : "2px solid transparent",
            background: "none",
            color: active === item.id ? "#1a73e8" : "#666",
            fontWeight: active === item.id ? 600 : 400,
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
