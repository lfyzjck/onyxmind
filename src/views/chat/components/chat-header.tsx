import { BRAND_NAME } from "../constants";

export function ChatHeader() {
  return (
    <div className="onyxmind-brand-row">
      <span className="onyxmind-brand-icon">✶</span>
      <div className="onyxmind-brand-meta">
        <div className="onyxmind-brand-title">{BRAND_NAME}</div>
      </div>
    </div>
  );
}
