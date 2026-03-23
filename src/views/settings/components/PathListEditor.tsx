import { useState } from "react";

interface PathListEditorProps {
  paths: string[];
  onChange: (paths: string[]) => void;
  placeholder?: string;
}

export function PathListEditor({
  paths,
  onChange,
  placeholder,
}: PathListEditorProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !paths.includes(trimmed)) {
      onChange([...paths, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="onyxmind-sp-path-field">
      {paths.map((p) => (
        <span key={p} className="onyxmind-sp-path-tag">
          {p}
          <button
            className="onyxmind-sp-path-tag-remove"
            aria-label={`Remove ${p}`}
            onClick={() => onChange(paths.filter((x) => x !== p))}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        className="onyxmind-sp-path-inline-input"
        value={input}
        placeholder={paths.length === 0 ? (placeholder ?? "e.g. Journal/") : ""}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && input === "" && paths.length > 0) {
            onChange(paths.slice(0, -1));
          }
        }}
      />
    </div>
  );
}
