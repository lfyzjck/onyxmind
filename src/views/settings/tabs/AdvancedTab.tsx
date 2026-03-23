import { useState } from "react";
import type OnyxMindPlugin from "../../../main";
import { type OnyxMindSettings } from "../../../settings";
import { t } from "../../../i18n";
import { SettingRow, Toggle } from "../components/SettingRow";

interface AdvancedTabProps {
  plugin: OnyxMindPlugin;
}

export function AdvancedTab({ plugin }: AdvancedTabProps) {
  const s = plugin.settings;

  const save = async (updates: Partial<OnyxMindSettings>) => {
    Object.assign(plugin.settings, updates);
    await plugin.saveSettings();
  };

  const [serviceUrl, setServiceUrl] = useState(s.opencodeBaseUrl);
  const [timeout, setTimeout_] = useState(String(s.timeout));
  const [retries, setRetries] = useState(String(s.maxRetries));
  const [stream, setStream] = useState(s.streamResponse);

  return (
    <div className="onyxmind-sp-rows">
      <SettingRow
        name={t("settings.advanced.serviceUrl")}
        desc={t("settings.advanced.serviceUrl.desc")}
      >
        <input
          type="text"
          className="onyxmind-sp-input onyxmind-sp-input-md"
          value={serviceUrl}
          placeholder="http://localhost:4096"
          onChange={(e) => {
            setServiceUrl(e.target.value);
            void save({ opencodeBaseUrl: e.target.value });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.advanced.timeout")}
        desc={t("settings.advanced.timeout.desc")}
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={timeout}
          min={1000}
          onChange={(e) => {
            setTimeout_(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n > 0) void save({ timeout: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.advanced.retries")}
        desc={t("settings.advanced.retries.desc")}
      >
        <input
          type="number"
          className="onyxmind-sp-input onyxmind-sp-input-sm"
          value={retries}
          min={0}
          onChange={(e) => {
            setRetries(e.target.value);
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n >= 0) void save({ maxRetries: n });
          }}
        />
      </SettingRow>

      <SettingRow
        name={t("settings.advanced.stream")}
        desc={t("settings.advanced.stream.desc")}
      >
        <Toggle
          checked={stream}
          onChange={(v) => {
            setStream(v);
            void save({ streamResponse: v });
          }}
        />
      </SettingRow>
    </div>
  );
}
