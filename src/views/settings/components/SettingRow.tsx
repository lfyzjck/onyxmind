import { type ReactNode } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className="onyxmind-sp-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="onyxmind-sp-toggle-track">
        <span className="onyxmind-sp-toggle-thumb" />
      </span>
    </label>
  );
}

interface SettingRowProps {
  name: string;
  desc?: string;
  children: ReactNode;
}

export function SettingRow({ name, desc, children }: SettingRowProps) {
  return (
    <div className="onyxmind-sp-row">
      <div className="onyxmind-sp-row-info">
        <div className="onyxmind-sp-row-name">{name}</div>
        {desc && <div className="onyxmind-sp-row-desc">{desc}</div>}
      </div>
      <div className="onyxmind-sp-row-ctrl">{children}</div>
    </div>
  );
}
