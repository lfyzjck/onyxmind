import { useState } from "react";
import type OnyxMindPlugin from "../../../main";
import {
  type ModelConfig,
  type ProviderConfig,
  type ProviderId,
  PROVIDER_META,
  PROVIDER_IDS,
} from "../../../settings";
import { t } from "../../../i18n";
import { Toggle } from "../components/SettingRow";

interface ProviderTabProps {
  plugin: OnyxMindPlugin;
  providerIds?: ProviderId[];
}

function createDefaultProvider(id: ProviderId): ProviderConfig {
  return {
    id,
    apiKey: "",
    apiBase: "",
    models: PROVIDER_META[id].defaultModels,
    npm: "@ai-sdk/openai",
  };
}

function normalizeProviders(
  existing: ProviderConfig[],
  requiredIds: ProviderId[],
): ProviderConfig[] {
  // 过滤掉 undefined，确保每个必需 id 都有配置
  const valid = existing.filter((p): p is ProviderConfig => p != null);
  const map = new Map(valid.map((p) => [p.id, p]));

  return requiredIds.map((id) => {
    const found = map.get(id);
    if (found) return found;
    return createDefaultProvider(id);
  });
}

export function ProviderTab({
  plugin,
  providerIds = PROVIDER_IDS,
}: ProviderTabProps) {
  const [selectedId, setSelectedId] = useState<ProviderId>(
    providerIds[0] ?? "openai",
  );

  const [providers, setProviders] = useState<ProviderConfig[]>(() => {
    const normalized = normalizeProviders(
      plugin.settings.providers ?? [],
      providerIds,
    );
    plugin.settings.providers = normalized;
    return normalized;
  });

  const [activeProviderId, setActiveProviderId] = useState<ProviderId>(
    () => plugin.settings.activeProviderId,
  );
  const [activeModelId, setActiveModelId] = useState<string>(
    () => plugin.settings.activeModelId,
  );

  // 现在 getProvider 一定能找到，因为初始化时已确保完整性
  const getProvider = (id: ProviderId): ProviderConfig =>
    providers.find((p) => p.id === id)!;

  const saveProviders = async (next: ProviderConfig[]) => {
    setProviders(next);
    plugin.settings.providers = next;
    await plugin.saveSettings();
  };

  const updateProvider = async (
    id: ProviderId,
    updates: Partial<Omit<ProviderConfig, "id">>,
  ) => {
    await saveProviders(
      providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const updateModel = async (
    pid: ProviderId,
    idx: number,
    updates: Partial<ModelConfig>,
  ) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: p.models.map((m, i) => (i === idx ? { ...m, ...updates } : m)),
    });
  };

  const addModel = async (pid: ProviderId) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: [
        ...p.models,
        { modelId: "", maxTokens: 128000, isReasoning: false },
      ],
    });
  };

  const removeModel = async (pid: ProviderId, idx: number) => {
    const p = getProvider(pid);
    await updateProvider(pid, {
      models: p.models.filter((_, i) => i !== idx),
    });
  };

  const updateActiveModel = async (pid: ProviderId, mid: string) => {
    setActiveProviderId(pid);
    setActiveModelId(mid);
    plugin.settings.activeProviderId = pid;
    plugin.settings.activeModelId = mid;
    await plugin.saveSettings();
  };

  const current = getProvider(selectedId);
  const meta = PROVIDER_META[selectedId];
  const activeProvider = providers.find((p) => p.id === activeProviderId);

  return (
    <>
      {/* Two-column layout */}
      <div className="onyxmind-sp-provider-layout">
        {/* Left sidebar */}
        <nav className="onyxmind-sp-sidebar" aria-label="Providers">
          {providerIds.map((id) => {
            const p = getProvider(id);
            const isSelected = selectedId === id;
            const isActive = activeProviderId === id;
            const hasKey = p.apiKey.trim().length > 0;
            return (
              <button
                key={id}
                className={`onyxmind-sp-provider-item${isSelected ? " is-selected" : ""}`}
                onClick={() => setSelectedId(id)}
              >
                <span className="onyxmind-sp-provider-name">
                  {PROVIDER_META[id].name}
                </span>
                <span
                  className={`onyxmind-sp-provider-dot${hasKey ? " has-key" : ""}${isActive ? " is-active" : ""}`}
                  title={
                    isActive
                      ? t("settings.provider.status.active")
                      : hasKey
                        ? t("settings.provider.status.configured")
                        : t("settings.provider.status.noKey")
                  }
                />
              </button>
            );
          })}
        </nav>

        {/* Right config panel */}
        <div className="onyxmind-sp-config">
          <div className="onyxmind-sp-config-title">{meta.name}</div>

          <div className="onyxmind-sp-field">
            <label className="onyxmind-sp-field-label">
              {t("settings.provider.apiKey")}
            </label>
            <input
              type="password"
              className="onyxmind-sp-input"
              placeholder={`Enter ${meta.name} API key`}
              value={current.apiKey}
              onChange={(e) => {
                const v = e.target.value;
                void updateProvider(selectedId, { apiKey: v });
              }}
            />
          </div>

          {!meta.fixedApiBase && (
            <div className="onyxmind-sp-field">
              <label className="onyxmind-sp-field-label">
                {t("settings.provider.apiBaseUrl")}
              </label>
              <input
                type="text"
                className="onyxmind-sp-input"
                placeholder={meta.defaultApiBase}
                value={current.apiBase}
                onChange={(e) => {
                  const v = e.target.value;
                  void updateProvider(selectedId, { apiBase: v });
                }}
              />
            </div>
          )}

          {/* Models table */}
          <div className="onyxmind-sp-models-section">
            <div className="onyxmind-sp-models-head">
              <span className="onyxmind-sp-col-model">
                {t("settings.provider.modelId")}
              </span>
              <span className="onyxmind-sp-col-tokens">
                {t("settings.provider.maxTokens")}
              </span>
              <span className="onyxmind-sp-col-reas">
                {t("settings.provider.reasoning")}
              </span>
              <span className="onyxmind-sp-col-del" />
            </div>

            {current.models.map((model, idx) => (
              <div key={idx} className="onyxmind-sp-model-row">
                <input
                  type="text"
                  className="onyxmind-sp-input onyxmind-sp-col-model"
                  value={model.modelId}
                  placeholder="model-id"
                  onChange={(e) => {
                    const v = e.target.value;
                    void updateModel(selectedId, idx, { modelId: v });
                  }}
                />
                <input
                  type="number"
                  className="onyxmind-sp-input onyxmind-sp-col-tokens"
                  value={model.maxTokens}
                  min={1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v > 0)
                      void updateModel(selectedId, idx, { maxTokens: v });
                  }}
                />
                <Toggle
                  checked={model.isReasoning}
                  onChange={(v) =>
                    void updateModel(selectedId, idx, { isReasoning: v })
                  }
                />
                <button
                  className="onyxmind-sp-remove-btn"
                  aria-label={t("aria.removeModel")}
                  onClick={() => void removeModel(selectedId, idx)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="onyxmind-sp-add-btn"
              onClick={() => void addModel(selectedId)}
            >
              {t("settings.provider.addModel")}
            </button>
          </div>
        </div>
      </div>

      {/* Active model — full width strip below two-column layout */}
      <div className="onyxmind-sp-active-model">
        <div className="onyxmind-sp-active-model-title">
          {t("settings.provider.activeModel")}
        </div>
        <div className="onyxmind-sp-active-model-row">
          <div className="onyxmind-sp-active-field">
            <label className="onyxmind-sp-field-label">
              {t("settings.provider.provider")}
            </label>
            <select
              className="onyxmind-sp-select"
              value={activeProviderId}
              onChange={(e) => {
                const pid = e.target.value as ProviderId;
                const first =
                  providers.find((p) => p.id === pid)?.models[0]?.modelId ?? "";
                void updateActiveModel(pid, first);
              }}
            >
              {providerIds.map((id) => (
                <option key={id} value={id}>
                  {PROVIDER_META[id].name}
                </option>
              ))}
            </select>
          </div>
          <div className="onyxmind-sp-active-field">
            <label className="onyxmind-sp-field-label">
              {t("settings.provider.model")}
            </label>
            <select
              className="onyxmind-sp-select"
              value={activeModelId}
              onChange={(e) =>
                void updateActiveModel(activeProviderId, e.target.value)
              }
            >
              {(activeProvider?.models ?? []).map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.modelId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
