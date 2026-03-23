import { useState } from "react";
import type OnyxMindPlugin from "../../main";
import { PROVIDER_IDS } from "../../settings";
import { t } from "../../i18n";
import { ProviderTab } from "./tabs/ProviderTab";
import { AgentTab } from "./tabs/AgentTab";
import { PermissionTab } from "./tabs/PermissionTab";
import { AdvancedTab } from "./tabs/AdvancedTab";
import type { TabId } from "./types";

const TABS: { id: TabId; label: string }[] = [
  { id: "provider", label: t("settings.tab.provider") },
  { id: "agent", label: t("settings.tab.agent") },
  { id: "permission", label: t("settings.tab.permission") },
  { id: "advanced", label: t("settings.tab.advanced") },
];

interface SettingsPanelProps {
  plugin: OnyxMindPlugin;
}

export function SettingsPanel({ plugin }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("provider");

  return (
    <div className="onyxmind-sp">
      {/* Top tab bar */}
      <div className="onyxmind-sp-tabbar" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`onyxmind-sp-tab${activeTab === id ? " is-active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="onyxmind-sp-content" role="tabpanel">
        {activeTab === "provider" && (
          <ProviderTab plugin={plugin} providerIds={PROVIDER_IDS} />
        )}
        {activeTab === "agent" && <AgentTab plugin={plugin} />}
        {activeTab === "permission" && <PermissionTab plugin={plugin} />}
        {activeTab === "advanced" && <AdvancedTab plugin={plugin} />}
      </div>
    </div>
  );
}
