import { useState } from "react";
import type OnyxMindPlugin from "../../../main";
import { type OnyxMindSettings } from "../../../settings";
import { t } from "../../../i18n";
import { SettingRow, Toggle } from "../components/SettingRow";

interface AgentTabProps {
  plugin: OnyxMindPlugin;
}

export function AgentTab({ plugin }: AgentTabProps) {
  const s = plugin.settings;

  const save = async (updates: Partial<OnyxMindSettings>) => {
    Object.assign(plugin.settings, updates);
    await plugin.saveSettings();
  };

  const [searchScope, setSearchScope] = useState(s.defaultSearchScope);
  const [autoSave, setAutoSave] = useState(s.autoSave);
  const [maxSessions, setMaxSessions] = useState(String(s.maxActiveSessions));
  const [confirmOps, setConfirmOps] = useState(s.confirmFileOperations);
  const [maxHistory, setMaxHistory] = useState(String(s.maxHistoryMessages));
  const [showTools, setShowTools] = useState(s.showToolCallsAfterStreaming);

  return (
    <div className="onyxmind-sp-rows">
      <SettingRow
        name={t("settings.agent.searchScope")}
        desc={t("settings.agent.searchScope.desc")}
      >
        <select
          className="onyxmind-sp-select onyxmind-sp-select-sm"
          value={searchScope}
          onChange={(e) => {
            const v = e.target.value as "vault" | "current-folder";
            setSearchScope(v);
            void save({ defaultSearchScope: v });
          }}
        >
          <option value="vault">{t("settings.agent.searchScope.vault")}</option>
          <option value="current-folder">
            {t("settings.agent.searchScope.folder")}
          </option>
        </select>
      </SettingRow>

      <SettingRow
        name={t("settings.agent.autoSave")}
        desc={t("settings.agent.autoSave.desc")}
      >
        <Toggle
          checked={autoSave}
          onChange={(v) => {
            setAutoSave(v);
            void save({ autoSave: v });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.agent.maxSessions")}
        desc={t("settings.agent.maxSessions.desc")}
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={maxSessions}
          min={1}
          onChange={(e) => {
            setMaxSessions(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ maxActiveSessions: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.agent.confirmOps")}
        desc={t("settings.agent.confirmOps.desc")}
      >
        <Toggle
          checked={confirmOps}
          onChange={(v) => {
            setConfirmOps(v);
            void save({ confirmFileOperations: v });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.agent.maxHistory")}
        desc={t("settings.agent.maxHistory.desc")}
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={maxHistory}
          min={1}
          onChange={(e) => {
            setMaxHistory(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ maxHistoryMessages: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.agent.showTools")}
        desc={t("settings.agent.showTools.desc")}
      >
        <Toggle
          checked={showTools}
          onChange={(v) => {
            setShowTools(v);
            void save({ showToolCallsAfterStreaming: v });
          }}
        />
      </SettingRow>
    </div>
  );
}
