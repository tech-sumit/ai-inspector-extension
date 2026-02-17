interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: 60,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: 11,
        padding: 8,
        border: "1px solid #ddd",
        borderRadius: 4,
        resize: "vertical",
        boxSizing: "border-box",
      }}
      spellCheck={false}
    />
  );
}
