import { t } from "../../../i18n";

export function ChatHeader() {
  return (
    <div className="onyxmind-brand-row">
      <span className="onyxmind-brand-icon">✶</span>
      <div className="onyxmind-brand-meta">
        <div className="onyxmind-brand-title">{t("brand.name")}</div>
      </div>
    </div>
  );
}
